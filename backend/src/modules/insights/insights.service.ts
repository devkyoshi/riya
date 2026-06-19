import { eq, and, desc, asc, sql } from 'drizzle-orm'
import type { Db } from '@/db/index.js'
import {
  mileageLog, healthScores, valuationPredictions, fraudFlags,
  vehicles, serviceRecords, emissionTests, revenueLicenses, insurancePolicies,
} from '@/db/schema/index.js'
import { AppError } from '@/shared/errors.js'

async function assertOwner(db: Db, vehicleId: string, userId: string) {
  const v = await db.query.vehicles.findFirst({
    where: and(eq(vehicles.id, vehicleId), eq(vehicles.isActive, true)),
  })
  if (!v) throw new AppError(404, 'VehicleNotFound', 'Vehicle not found')
  if (v.ownerId !== userId) throw new AppError(403, 'Forbidden', 'Access denied')
  return v
}

// ─── Mileage Log ──────────────────────────────────────────────────────────────

export async function addMileageEntry(db: Db, vehicleId: string, userId: string, data: {
  mileageKm: number
  recordedAt: string
  source?: string
  notes?: string
}) {
  await assertOwner(db, vehicleId, userId)

  const [entry] = await db.insert(mileageLog).values({
    vehicleId,
    addedBy: userId,
    mileageKm: data.mileageKm,
    recordedAt: data.recordedAt,
    source: data.source ?? 'manual',
    notes: data.notes,
  }).returning()

  // Update vehicle's current mileage if this is the highest reading
  const vehicle = await db.query.vehicles.findFirst({ where: eq(vehicles.id, vehicleId) })
  if (vehicle && data.mileageKm > vehicle.currentMileageKm) {
    await db.update(vehicles).set({ currentMileageKm: data.mileageKm, updatedAt: new Date() }).where(eq(vehicles.id, vehicleId))
  }

  return entry
}

export async function listMileageLog(db: Db, vehicleId: string, userId: string) {
  await assertOwner(db, vehicleId, userId)
  return db.query.mileageLog.findMany({
    where: eq(mileageLog.vehicleId, vehicleId),
    orderBy: [desc(mileageLog.recordedAt)],
  })
}

// ─── Health Score (rule-based v1) ─────────────────────────────────────────────
//
// Score breakdown (100 points total):
//   30 pts — service frequency (regular servicing in last 12 months)
//   20 pts — mileage vs age (lower mileage per year = better)
//   20 pts — document compliance (valid revenue license + emission test)
//   15 pts — age factor (newer = higher)
//   10 pts — accident-free (no accident records)
//   5 pts  — condition rating

export async function computeHealthScore(db: Db, vehicleId: string, userId: string) {
  const vehicle = await assertOwner(db, vehicleId, userId)

  const now = new Date()
  const currentYear = now.getFullYear()
  const ageYears = Math.max(1, currentYear - vehicle.year)

  let score = 0
  const factors: Record<string, any> = {}

  // 1. Service frequency (30 pts)
  const oneYearAgo = new Date(now)
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  const recentServices = await db.query.serviceRecords.findMany({
    where: and(
      eq(serviceRecords.vehicleId, vehicleId),
      sql`${serviceRecords.serviceDate} >= ${oneYearAgo.toISOString().split('T')[0]}`,
    ),
  })
  const serviceScore = recentServices.length >= 2 ? 30 : recentServices.length === 1 ? 20 : 5
  score += serviceScore
  factors.serviceFrequency = { score: serviceScore, recentServicesCount: recentServices.length }

  // 2. Mileage vs age (20 pts)
  const avgKmPerYear = vehicle.currentMileageKm / ageYears
  let mileageScore = 0
  if (avgKmPerYear < 15000) mileageScore = 20
  else if (avgKmPerYear < 25000) mileageScore = 15
  else if (avgKmPerYear < 40000) mileageScore = 10
  else mileageScore = 5
  score += mileageScore
  factors.mileageVsAge = { score: mileageScore, avgKmPerYear: Math.round(avgKmPerYear) }

  // 3. Document compliance (20 pts)
  const today = now.toISOString().split('T')[0]
  const validLicense = await db.query.revenueLicenses.findFirst({
    where: and(eq(revenueLicenses.vehicleId, vehicleId), sql`${revenueLicenses.expiryDate} >= ${today}`),
  })
  const validEmission = await db.query.emissionTests.findFirst({
    where: and(eq(emissionTests.vehicleId, vehicleId), sql`${emissionTests.expiryDate} >= ${today}`),
  })
  const complianceScore = (validLicense ? 10 : 0) + (validEmission ? 10 : 0)
  score += complianceScore
  factors.compliance = {
    score: complianceScore,
    hasValidRevenueLicense: !!validLicense,
    hasValidEmissionTest: !!validEmission,
  }

  // 4. Age factor (15 pts)
  let ageScore = 0
  if (ageYears <= 3) ageScore = 15
  else if (ageYears <= 6) ageScore = 12
  else if (ageYears <= 10) ageScore = 8
  else if (ageYears <= 15) ageScore = 4
  else ageScore = 2
  score += ageScore
  factors.age = { score: ageScore, ageYears }

  // 5. Accident-free (10 pts) — proxied by no accident-type timeline posts
  // For v1 we give full points as accident_records table not yet populated (Phase 5+)
  score += 10
  factors.accidentFree = { score: 10 }

  // 6. Condition (5 pts)
  const conditionScoreMap: Record<string, number> = { excellent: 5, good: 4, fair: 2, poor: 0 }
  const conditionScore = conditionScoreMap[vehicle.condition] ?? 2
  score += conditionScore
  factors.condition = { score: conditionScore, condition: vehicle.condition }

  const grade = score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : score >= 40 ? 'D' : 'F'

  const [result] = await db.insert(healthScores)
    .values({ vehicleId, score, grade, factors, calculatedAt: now })
    .onConflictDoUpdate({
      target: healthScores.vehicleId,
      set: { score, grade, factors, calculatedAt: now },
    })
    .returning()

  return result
}

// ─── Valuation (rule-based v1) ────────────────────────────────────────────────
//
// Rough Sri Lankan market estimate:
//  - Start with base MSRP approximation from make/year
//  - Apply depreciation curve
//  - Adjust for mileage, condition, service history

const BASE_PRICE_LKR: Record<string, number> = {
  toyota: 12_000_000,
  honda: 11_000_000,
  suzuki: 8_000_000,
  nissan: 10_000_000,
  mitsubishi: 10_500_000,
  hyundai: 9_000_000,
  kia: 9_500_000,
  mazda: 11_500_000,
  ford: 9_000_000,
  bmw: 25_000_000,
  mercedes: 30_000_000,
  audi: 22_000_000,
  default: 10_000_000,
}

export async function computeValuation(db: Db, vehicleId: string, userId: string) {
  const vehicle = await assertOwner(db, vehicleId, userId)

  const currentYear = new Date().getFullYear()
  const ageYears = Math.max(0, currentYear - vehicle.year)
  const makeKey = vehicle.make.toLowerCase()
  const basePrice = BASE_PRICE_LKR[makeKey] ?? BASE_PRICE_LKR.default

  // Depreciation: ~15% first year, ~10% each subsequent year, floors at 30% of base
  let depreciatedValue = basePrice
  for (let i = 0; i < ageYears; i++) {
    const rate = i === 0 ? 0.15 : 0.10
    depreciatedValue = depreciatedValue * (1 - rate)
  }
  depreciatedValue = Math.max(depreciatedValue, basePrice * 0.30)

  // Mileage adjustment (avg 15k km/year)
  const avgMileage = ageYears > 0 ? (ageYears * 15_000) : 15_000
  const mileageDelta = vehicle.currentMileageKm - avgMileage
  const mileageAdjustment = mileageDelta > 0
    ? Math.max(-0.15, -(mileageDelta / avgMileage) * 0.10)
    : Math.min(0.05, Math.abs(mileageDelta / avgMileage) * 0.05)

  depreciatedValue = depreciatedValue * (1 + mileageAdjustment)

  // Condition adjustment
  const conditionMultiplier: Record<string, number> = { excellent: 1.05, good: 1.0, fair: 0.90, poor: 0.75 }
  depreciatedValue = depreciatedValue * (conditionMultiplier[vehicle.condition] ?? 1.0)

  const estimatedValueLkr = Math.round(depreciatedValue / 10000) * 10000
  const minValueLkr = Math.round(estimatedValueLkr * 0.90 / 10000) * 10000
  const maxValueLkr = Math.round(estimatedValueLkr * 1.10 / 10000) * 10000

  const factors = {
    basePrice,
    ageYears,
    mileageKm: vehicle.currentMileageKm,
    mileageAdjustmentPct: Math.round(mileageAdjustment * 100),
    condition: vehicle.condition,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
  }

  const [result] = await db.insert(valuationPredictions)
    .values({ vehicleId, estimatedValueLkr, minValueLkr, maxValueLkr, factors, calculatedAt: new Date() })
    .onConflictDoUpdate({
      target: valuationPredictions.vehicleId,
      set: { estimatedValueLkr, minValueLkr, maxValueLkr, factors, calculatedAt: new Date() },
    })
    .returning()

  return result
}

// ─── Predictive Maintenance (rule-based v1) ───────────────────────────────────

const SERVICE_INTERVALS = [
  { type: 'Oil & Filter Change',         kmInterval: 5_000,  monthInterval: 6 },
  { type: 'Air Filter Replacement',      kmInterval: 20_000, monthInterval: 12 },
  { type: 'Spark Plug Replacement',      kmInterval: 40_000, monthInterval: 24 },
  { type: 'Brake Fluid Flush',           kmInterval: 40_000, monthInterval: 24 },
  { type: 'Transmission Fluid Change',   kmInterval: 60_000, monthInterval: 36 },
  { type: 'Coolant Flush',               kmInterval: 60_000, monthInterval: 36 },
  { type: 'Timing Belt Replacement',     kmInterval: 100_000,monthInterval: 60 },
]

export async function getMaintenanceSchedule(db: Db, vehicleId: string, userId: string) {
  const vehicle = await assertOwner(db, vehicleId, userId)

  const lastService = await db.query.serviceRecords.findFirst({
    where: eq(serviceRecords.vehicleId, vehicleId),
    orderBy: [desc(serviceRecords.serviceDate)],
  })

  const lastServiceDate = lastService ? new Date(lastService.serviceDate) : new Date(vehicle.createdAt)
  const lastServiceMileage = lastService?.mileageKm ?? 0
  const currentMileage = vehicle.currentMileageKm

  const schedule = SERVICE_INTERVALS.map((item) => {
    const dueAtKm = lastServiceMileage + item.kmInterval
    const dueAtDate = new Date(lastServiceDate)
    dueAtDate.setMonth(dueAtDate.getMonth() + item.monthInterval)

    const kmRemaining = dueAtKm - currentMileage
    const daysRemaining = Math.floor((dueAtDate.getTime() - Date.now()) / 86_400_000)

    const isDueByKm = kmRemaining <= 1000
    const isDueByTime = daysRemaining <= 30
    const isOverdue = kmRemaining < 0 || daysRemaining < 0

    return {
      type: item.type,
      dueAtKm,
      dueAtDate: dueAtDate.toISOString().split('T')[0],
      kmRemaining,
      daysRemaining,
      status: isOverdue ? 'overdue' : isDueByKm || isDueByTime ? 'due_soon' : 'ok',
    }
  })

  return { vehicleId, currentMileageKm: currentMileage, schedule }
}

// ─── Fraud Detection (mileage anomaly) ───────────────────────────────────────

export async function runFraudCheck(db: Db, vehicleId: string, userId: string) {
  await assertOwner(db, vehicleId, userId)

  const entries = await db.query.mileageLog.findMany({
    where: eq(mileageLog.vehicleId, vehicleId),
    orderBy: [asc(mileageLog.recordedAt)],
  })

  const flags: Array<{ type: string; severity: string; details: any }> = []

  // Check for odometer rollback (any reading less than previous)
  for (let i = 1; i < entries.length; i++) {
    const prev = entries[i - 1]
    const curr = entries[i]
    if (curr.mileageKm < prev.mileageKm) {
      flags.push({
        type: 'odometer_rollback',
        severity: 'high',
        details: {
          from: { date: prev.recordedAt, mileage: prev.mileageKm },
          to: { date: curr.recordedAt, mileage: curr.mileageKm },
          delta: curr.mileageKm - prev.mileageKm,
        },
      })
    }

    // Check for suspiciously large jumps (>500 km/day)
    const daysDiff = Math.max(1, (new Date(curr.recordedAt).getTime() - new Date(prev.recordedAt).getTime()) / 86_400_000)
    const kmDiff = curr.mileageKm - prev.mileageKm
    const kmPerDay = kmDiff / daysDiff
    if (kmPerDay > 500) {
      flags.push({
        type: 'excessive_mileage_jump',
        severity: 'medium',
        details: {
          from: { date: prev.recordedAt, mileage: prev.mileageKm },
          to: { date: curr.recordedAt, mileage: curr.mileageKm },
          kmPerDay: Math.round(kmPerDay),
        },
      })
    }
  }

  // Persist new flags (skip already-existing identical flags)
  const savedFlags = []
  for (const flag of flags) {
    const [saved] = await db.insert(fraudFlags)
      .values({ vehicleId, type: flag.type, severity: flag.severity, details: flag.details })
      .returning()
    savedFlags.push(saved)
  }

  return {
    vehicleId,
    flagsFound: flags.length,
    flags: savedFlags,
    entriesAnalyzed: entries.length,
  }
}

export async function listFraudFlags(db: Db, vehicleId: string, userId: string) {
  await assertOwner(db, vehicleId, userId)
  return db.query.fraudFlags.findMany({
    where: and(eq(fraudFlags.vehicleId, vehicleId), eq(fraudFlags.isResolved, false)),
    orderBy: [desc(fraudFlags.createdAt)],
  })
}
