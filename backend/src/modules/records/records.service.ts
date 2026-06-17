import { eq, and, desc } from 'drizzle-orm'
import type { Db } from '@/db/index.js'
import { serviceRecords, insurancePolicies, revenueLicenses, emissionTests, timelinePosts, vehicles } from '@/db/schema/index.js'
import { AppError } from '@/shared/errors.js'

async function assertOwner(db: Db, vehicleId: string, userId: string) {
  const v = await db.query.vehicles.findFirst({ where: and(eq(vehicles.id, vehicleId), eq(vehicles.isActive, true)) })
  if (!v) throw new AppError(404, 'VehicleNotFound', 'Vehicle not found')
  if (v.ownerId !== userId) throw new AppError(403, 'Forbidden', 'Access denied')
}

// ─── Service Records ──────────────────────────────────────────────────────────

export async function addServiceRecord(db: Db, vehicleId: string, userId: string, data: {
  garageName?: string; serviceDate: string; mileageKm: number
  description: string; parts?: any; laborCost?: string; totalCost?: string; currency?: string
}) {
  await assertOwner(db, vehicleId, userId)

  const [record] = await db.insert(serviceRecords).values({
    vehicleId, addedBy: userId,
    garageName: data.garageName,
    serviceDate: data.serviceDate,
    mileageKm: data.mileageKm,
    description: data.description,
    parts: data.parts,
    laborCost: data.laborCost,
    totalCost: data.totalCost,
    currency: data.currency ?? 'LKR',
  }).returning()

  await db.insert(timelinePosts).values({
    vehicleId, createdBy: userId,
    postType: 'service',
    title: `Service: ${data.description.substring(0, 80)}`,
    body: data.garageName ? `At ${data.garageName}` : undefined,
    payload: { serviceDate: data.serviceDate, mileageKm: data.mileageKm, totalCost: data.totalCost },
    refId: record.id, refTable: 'service_records',
  })

  return record
}

export async function listServiceRecords(db: Db, vehicleId: string, userId: string) {
  await assertOwner(db, vehicleId, userId)
  return db.query.serviceRecords.findMany({
    where: eq(serviceRecords.vehicleId, vehicleId),
    orderBy: [desc(serviceRecords.serviceDate)],
  })
}

// ─── Insurance Policies ───────────────────────────────────────────────────────

export async function addInsurancePolicy(db: Db, vehicleId: string, userId: string, data: {
  provider: string; policyNumber: string; coverageType?: string
  startDate: string; endDate: string; premiumLkr?: string
}) {
  await assertOwner(db, vehicleId, userId)

  const [policy] = await db.insert(insurancePolicies).values({
    vehicleId, addedBy: userId, ...data,
  }).returning()

  await db.insert(timelinePosts).values({
    vehicleId, createdBy: userId,
    postType: 'insurance_update',
    title: `Insurance: ${data.provider} — ${data.policyNumber}`,
    payload: { endDate: data.endDate, coverageType: data.coverageType },
    refId: policy.id, refTable: 'insurance_policies',
  })

  return policy
}

export async function listInsurancePolicies(db: Db, vehicleId: string, userId: string) {
  await assertOwner(db, vehicleId, userId)
  return db.query.insurancePolicies.findMany({
    where: eq(insurancePolicies.vehicleId, vehicleId),
    orderBy: [desc(insurancePolicies.startDate)],
  })
}

// ─── Revenue Licenses ─────────────────────────────────────────────────────────

export async function addRevenueLicense(db: Db, vehicleId: string, userId: string, data: {
  licenseNumber?: string; issueDate: string; expiryDate: string; feeAmountLkr?: string
}) {
  await assertOwner(db, vehicleId, userId)

  const [license] = await db.insert(revenueLicenses).values({
    vehicleId, addedBy: userId, ...data,
  }).returning()

  await db.insert(timelinePosts).values({
    vehicleId, createdBy: userId,
    postType: 'revenue_license',
    title: 'Revenue License Updated',
    payload: { expiryDate: data.expiryDate },
    refId: license.id, refTable: 'revenue_licenses',
  })

  return license
}

export async function listRevenueLicenses(db: Db, vehicleId: string, userId: string) {
  await assertOwner(db, vehicleId, userId)
  return db.query.revenueLicenses.findMany({
    where: eq(revenueLicenses.vehicleId, vehicleId),
    orderBy: [desc(revenueLicenses.issueDate)],
  })
}

// ─── Emission Tests ───────────────────────────────────────────────────────────

export async function addEmissionTest(db: Db, vehicleId: string, userId: string, data: {
  testDate: string; expiryDate: string; testCenter?: string; result?: string; readings?: any
}) {
  await assertOwner(db, vehicleId, userId)

  const [test] = await db.insert(emissionTests).values({
    vehicleId, addedBy: userId, ...data, result: data.result ?? 'pass',
  }).returning()

  await db.insert(timelinePosts).values({
    vehicleId, createdBy: userId,
    postType: 'emission_test',
    title: `Emission Test: ${data.result ?? 'pass'}`,
    payload: { testDate: data.testDate, expiryDate: data.expiryDate },
    refId: test.id, refTable: 'emission_tests',
  })

  return test
}

export async function listEmissionTests(db: Db, vehicleId: string, userId: string) {
  await assertOwner(db, vehicleId, userId)
  return db.query.emissionTests.findMany({
    where: eq(emissionTests.vehicleId, vehicleId),
    orderBy: [desc(emissionTests.testDate)],
  })
}
