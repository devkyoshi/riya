import { eq, and } from 'drizzle-orm'
import { randomBytes } from 'crypto'
import type { Db } from '@/db/index.js'
import { ownershipTransfers, ownershipHistory, vehicles, users, timelinePosts, userRoles } from '@/db/schema/index.js'
import { AppError } from '@/shared/errors.js'

function generateClaimToken(): string {
  return randomBytes(32).toString('hex')
}

export async function initiateTransfer(db: Db, vehicleId: string, fromOwnerId: string, data: {
  toEmail: string
  transferType?: string
  notes?: string
  expiresInDays?: number
}) {
  const vehicle = await db.query.vehicles.findFirst({
    where: and(eq(vehicles.id, vehicleId), eq(vehicles.isActive, true)),
  })
  if (!vehicle) throw new AppError(404, 'VehicleNotFound', 'Vehicle not found')
  if (vehicle.ownerId !== fromOwnerId) throw new AppError(403, 'Forbidden', 'Only the vehicle owner can initiate a transfer')

  // Check no pending transfer already exists
  const pendingTransfer = await db.query.ownershipTransfers.findFirst({
    where: and(eq(ownershipTransfers.vehicleId, vehicleId), eq(ownershipTransfers.status, 'pending')),
  })
  if (pendingTransfer) throw new AppError(409, 'PendingTransferExists', 'A pending transfer already exists for this vehicle. Cancel it before initiating a new one.')

  const claimToken = generateClaimToken()
  const days = data.expiresInDays ?? 7
  const claimExpiresAt = new Date(Date.now() + days * 86_400_000)

  const toUser = await db.query.users.findFirst({
    where: eq(users.email, data.toEmail.toLowerCase()),
  })

  const [transfer] = await db.insert(ownershipTransfers).values({
    vehicleId,
    fromOwnerId,
    toUserId: toUser?.id ?? undefined,
    toEmail: data.toEmail.toLowerCase(),
    transferType: data.transferType ?? 'purchase',
    notes: data.notes,
    claimToken,
    claimExpiresAt,
  }).returning()

  return transfer
}

export async function claimTransfer(db: Db, claimToken: string, claimingUserId: string) {
  const transfer = await db.query.ownershipTransfers.findFirst({
    where: and(eq(ownershipTransfers.claimToken, claimToken), eq(ownershipTransfers.status, 'pending')),
  })
  if (!transfer) throw new AppError(404, 'TransferNotFound', 'Transfer not found or already completed')

  if (new Date() > transfer.claimExpiresAt) {
    await db.update(ownershipTransfers).set({ status: 'expired' }).where(eq(ownershipTransfers.id, transfer.id))
    throw new AppError(410, 'TransferExpired', 'This transfer claim has expired')
  }

  const claimingUser = await db.query.users.findFirst({ where: eq(users.id, claimingUserId) })
  if (!claimingUser) throw new AppError(404, 'UserNotFound', 'User not found')

  // Verify email matches (if not matched as user at initiation time)
  if (claimingUser.email.toLowerCase() !== transfer.toEmail.toLowerCase()) {
    throw new AppError(403, 'EmailMismatch', 'Your account email does not match the transfer recipient email')
  }

  const today = new Date().toISOString().split('T')[0]

  // Close out previous ownership record
  await db.update(ownershipHistory)
    .set({ endDate: today })
    .where(and(
      eq(ownershipHistory.vehicleId, transfer.vehicleId),
      eq(ownershipHistory.ownerId, transfer.fromOwnerId),
    ))

  // Create new ownership record
  await db.insert(ownershipHistory).values({
    vehicleId: transfer.vehicleId,
    ownerId: claimingUserId,
    transferType: transfer.transferType as any,
    startDate: today,
    notes: transfer.notes ?? undefined,
  })

  // Transfer vehicle ownership
  await db.update(vehicles)
    .set({ ownerId: claimingUserId, updatedAt: new Date() })
    .where(eq(vehicles.id, transfer.vehicleId))

  // Assign owner role to new user if not already an owner
  await db.insert(userRoles).values({ userId: claimingUserId, roleKey: 'owner' }).onConflictDoNothing()

  // Mark transfer complete
  await db.update(ownershipTransfers)
    .set({ status: 'completed', toUserId: claimingUserId, completedAt: new Date() })
    .where(eq(ownershipTransfers.id, transfer.id))

  // Timeline entry
  await db.insert(timelinePosts).values({
    vehicleId: transfer.vehicleId,
    createdBy: claimingUserId,
    postType: 'ownership_transfer',
    title: 'Ownership Transferred',
    body: `Vehicle ownership transferred via ${transfer.transferType}`,
    payload: { fromOwnerId: transfer.fromOwnerId, toOwnerId: claimingUserId, transferType: transfer.transferType },
    refId: transfer.id,
    refTable: 'ownership_transfers',
  })

  return { success: true, vehicleId: transfer.vehicleId }
}

export async function cancelTransfer(db: Db, vehicleId: string, ownerId: string) {
  const vehicle = await db.query.vehicles.findFirst({
    where: and(eq(vehicles.id, vehicleId), eq(vehicles.isActive, true)),
  })
  if (!vehicle) throw new AppError(404, 'VehicleNotFound', 'Vehicle not found')
  if (vehicle.ownerId !== ownerId) throw new AppError(403, 'Forbidden', 'Access denied')

  const transfer = await db.query.ownershipTransfers.findFirst({
    where: and(eq(ownershipTransfers.vehicleId, vehicleId), eq(ownershipTransfers.status, 'pending')),
  })
  if (!transfer) throw new AppError(404, 'TransferNotFound', 'No pending transfer found for this vehicle')

  await db.update(ownershipTransfers)
    .set({ status: 'cancelled' })
    .where(eq(ownershipTransfers.id, transfer.id))
}

export async function getPendingTransfer(db: Db, vehicleId: string, ownerId: string) {
  const vehicle = await db.query.vehicles.findFirst({
    where: and(eq(vehicles.id, vehicleId), eq(vehicles.isActive, true)),
  })
  if (!vehicle) throw new AppError(404, 'VehicleNotFound', 'Vehicle not found')
  if (vehicle.ownerId !== ownerId) throw new AppError(403, 'Forbidden', 'Access denied')

  return db.query.ownershipTransfers.findFirst({
    where: and(eq(ownershipTransfers.vehicleId, vehicleId), eq(ownershipTransfers.status, 'pending')),
  })
}
