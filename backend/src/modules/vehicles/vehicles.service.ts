import { eq, and, desc } from 'drizzle-orm'
import type { Db } from '@/db/index.js'
import { vehicles, ownershipHistory, timelinePosts } from '@/db/schema/index.js'
import { AppError } from '@/shared/errors.js'
import type { CreateVehicleBody, UpdateVehicleBody } from './vehicles.schemas.js'

export async function createVehicle(db: Db, ownerId: string, data: CreateVehicleBody) {
  const existing = await db.query.vehicles.findFirst({
    where: eq(vehicles.plateNumber, data.plateNumber.toUpperCase()),
  })
  if (existing) {
    throw new AppError(409, 'PlateNumberExists', 'A vehicle with this plate number already exists')
  }

  const [vehicle] = await db.insert(vehicles).values({
    ...data,
    plateNumber: data.plateNumber.toUpperCase(),
    ownerId,
    currentMileageKm: data.currentMileageKm ?? 0,
    condition: data.condition ?? 'good',
  }).returning()

  const today = new Date().toISOString().split('T')[0]

  await db.insert(ownershipHistory).values({
    vehicleId: vehicle.id,
    ownerId,
    transferType: 'purchase',
    startDate: today,
  })

  await db.insert(timelinePosts).values({
    vehicleId: vehicle.id,
    createdBy: ownerId,
    postType: 'ownership_transfer',
    title: 'Vehicle Added',
    body: `${vehicle.year} ${vehicle.make} ${vehicle.model} added to Riya`,
    payload: { plateNumber: vehicle.plateNumber },
    refId: vehicle.id,
    refTable: 'vehicles',
  })

  return vehicle
}

export async function listVehicles(db: Db, ownerId: string) {
  return db.query.vehicles.findMany({
    where: and(eq(vehicles.ownerId, ownerId), eq(vehicles.isActive, true)),
    orderBy: [desc(vehicles.createdAt)],
  })
}

export async function getVehicle(db: Db, vehicleId: string, requestingUserId: string) {
  const vehicle = await db.query.vehicles.findFirst({
    where: and(eq(vehicles.id, vehicleId), eq(vehicles.isActive, true)),
  })
  if (!vehicle) throw new AppError(404, 'VehicleNotFound', 'Vehicle not found')
  if (vehicle.ownerId !== requestingUserId) throw new AppError(403, 'Forbidden', 'Access denied')
  return vehicle
}

export async function updateVehicle(db: Db, vehicleId: string, ownerId: string, data: UpdateVehicleBody) {
  const vehicle = await getVehicle(db, vehicleId, ownerId)

  const [updated] = await db.update(vehicles)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(vehicles.id, vehicle.id))
    .returning()

  return updated
}

export async function deleteVehicle(db: Db, vehicleId: string, ownerId: string) {
  const vehicle = await getVehicle(db, vehicleId, ownerId)
  await db.update(vehicles).set({ isActive: false, updatedAt: new Date() }).where(eq(vehicles.id, vehicle.id))
}

export async function updateCoverPhoto(db: Db, vehicleId: string, ownerId: string, url: string) {
  const vehicle = await getVehicle(db, vehicleId, ownerId)
  const [updated] = await db.update(vehicles)
    .set({ coverPhotoUrl: url, updatedAt: new Date() })
    .where(eq(vehicles.id, vehicle.id))
    .returning()
  return updated
}
