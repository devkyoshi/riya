import { eq, and, desc } from 'drizzle-orm'
import type { Db } from '@/db/index.js'
import { businessAccounts, serviceRecords, insurancePolicies, timelinePosts, vehicles, userRoles } from '@/db/schema/index.js'
import { AppError } from '@/shared/errors.js'

// ─── Business Account ─────────────────────────────────────────────────────────

export async function registerBusiness(db: Db, userId: string, data: {
  type: 'garage' | 'insurer' | 'dealer'
  businessName: string
  registrationNumber?: string
  address?: string
  contactPhone?: string
  contactEmail?: string
}) {
  const existing = await db.query.businessAccounts.findFirst({
    where: eq(businessAccounts.ownerId, userId),
  })
  if (existing) throw new AppError(409, 'BusinessAlreadyRegistered', 'You already have a registered business account')

  const [account] = await db.insert(businessAccounts).values({
    ownerId: userId,
    type: data.type,
    businessName: data.businessName,
    registrationNumber: data.registrationNumber,
    address: data.address,
    contactPhone: data.contactPhone,
    contactEmail: data.contactEmail,
  }).returning()

  // Assign the appropriate role
  const roleKey = data.type === 'insurer' ? 'insurer' : 'garage'
  await db.insert(userRoles).values({ userId, roleKey }).onConflictDoNothing()

  return account
}

export async function getMyBusiness(db: Db, userId: string) {
  const account = await db.query.businessAccounts.findFirst({
    where: eq(businessAccounts.ownerId, userId),
  })
  if (!account) throw new AppError(404, 'BusinessNotFound', 'No business account found. Please register first.')
  return account
}

export async function updateBusiness(db: Db, userId: string, data: Partial<{
  businessName: string
  registrationNumber: string
  address: string
  contactPhone: string
  contactEmail: string
}>) {
  const account = await db.query.businessAccounts.findFirst({
    where: eq(businessAccounts.ownerId, userId),
  })
  if (!account) throw new AppError(404, 'BusinessNotFound', 'No business account found')

  const [updated] = await db.update(businessAccounts)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(businessAccounts.id, account.id))
    .returning()
  return updated
}

// ─── Partner Record Submission ────────────────────────────────────────────────

export async function submitServiceRecord(db: Db, partnerId: string, data: {
  vehiclePlate: string
  serviceDate: string
  mileageKm: number
  description: string
  parts?: any
  laborCost?: string
  totalCost?: string
}) {
  const business = await db.query.businessAccounts.findFirst({
    where: and(eq(businessAccounts.ownerId, partnerId), eq(businessAccounts.type, 'garage')),
  })
  if (!business) throw new AppError(403, 'NotAGarage', 'Only verified garage accounts can submit service records')

  const vehicle = await db.query.vehicles.findFirst({
    where: and(eq(vehicles.plateNumber, data.vehiclePlate.toUpperCase()), eq(vehicles.isActive, true)),
  })
  if (!vehicle) throw new AppError(404, 'VehicleNotFound', `No active vehicle found with plate ${data.vehiclePlate}`)

  const [record] = await db.insert(serviceRecords).values({
    vehicleId: vehicle.id,
    addedBy: partnerId,
    garageId: business.id,
    garageName: business.businessName,
    serviceDate: data.serviceDate,
    mileageKm: data.mileageKm,
    description: data.description,
    parts: data.parts,
    laborCost: data.laborCost,
    totalCost: data.totalCost,
    isVerified: true,
  }).returning()

  await db.insert(timelinePosts).values({
    vehicleId: vehicle.id,
    createdBy: partnerId,
    postType: 'service',
    title: `Service: ${data.description.substring(0, 80)}`,
    body: `Verified by ${business.businessName}`,
    payload: { serviceDate: data.serviceDate, mileageKm: data.mileageKm, totalCost: data.totalCost, verified: true },
    refId: record.id,
    refTable: 'service_records',
  })

  return record
}

export async function submitInsurancePolicy(db: Db, partnerId: string, data: {
  vehiclePlate: string
  policyNumber: string
  coverageType?: string
  startDate: string
  endDate: string
  premiumLkr?: string
}) {
  const business = await db.query.businessAccounts.findFirst({
    where: and(eq(businessAccounts.ownerId, partnerId), eq(businessAccounts.type, 'insurer')),
  })
  if (!business) throw new AppError(403, 'NotAnInsurer', 'Only verified insurer accounts can submit insurance policies')

  const vehicle = await db.query.vehicles.findFirst({
    where: and(eq(vehicles.plateNumber, data.vehiclePlate.toUpperCase()), eq(vehicles.isActive, true)),
  })
  if (!vehicle) throw new AppError(404, 'VehicleNotFound', `No active vehicle found with plate ${data.vehiclePlate}`)

  const [policy] = await db.insert(insurancePolicies).values({
    vehicleId: vehicle.id,
    addedBy: partnerId,
    provider: business.businessName,
    policyNumber: data.policyNumber,
    coverageType: data.coverageType,
    startDate: data.startDate,
    endDate: data.endDate,
    premiumLkr: data.premiumLkr,
  }).returning()

  await db.insert(timelinePosts).values({
    vehicleId: vehicle.id,
    createdBy: partnerId,
    postType: 'insurance_update',
    title: `Insurance: ${business.businessName} — ${data.policyNumber}`,
    body: `Policy submitted by ${business.businessName} (verified)`,
    payload: { endDate: data.endDate, coverageType: data.coverageType, verified: true },
    refId: policy.id,
    refTable: 'insurance_policies',
  })

  return policy
}

export async function listMySubmissions(db: Db, partnerId: string) {
  const business = await db.query.businessAccounts.findFirst({
    where: eq(businessAccounts.ownerId, partnerId),
  })
  if (!business) throw new AppError(404, 'BusinessNotFound', 'No business account found')

  if (business.type === 'garage') {
    return db.query.serviceRecords.findMany({
      where: eq(serviceRecords.addedBy, partnerId),
      orderBy: [desc(serviceRecords.serviceDate)],
    })
  } else if (business.type === 'insurer') {
    return db.query.insurancePolicies.findMany({
      where: eq(insurancePolicies.addedBy, partnerId),
      orderBy: [desc(insurancePolicies.startDate)],
    })
  }

  return []
}
