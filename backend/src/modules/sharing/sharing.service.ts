import { eq, and, desc } from 'drizzle-orm'
import { randomBytes } from 'crypto'
import type { Db } from '@/db/index.js'
import { shareLinks, vehicleCoOwners, vehicles, users } from '@/db/schema/index.js'
import { AppError } from '@/shared/errors.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function assertVehicleOwner(db: Db, vehicleId: string, userId: string) {
  const v = await db.query.vehicles.findFirst({
    where: and(eq(vehicles.id, vehicleId), eq(vehicles.isActive, true)),
  })
  if (!v) throw new AppError(404, 'VehicleNotFound', 'Vehicle not found')
  if (v.ownerId !== userId) throw new AppError(403, 'Forbidden', 'Only the vehicle owner can perform this action')
  return v
}

function generateToken(): string {
  return randomBytes(32).toString('hex')
}

// ─── Share Links ──────────────────────────────────────────────────────────────

export async function createShareLink(db: Db, vehicleId: string, userId: string, data: {
  label?: string
  scope?: Record<string, boolean>
  expiresInDays?: number
  isSingleUse?: boolean
}) {
  await assertVehicleOwner(db, vehicleId, userId)

  const token = generateToken()
  const expiresAt = data.expiresInDays
    ? new Date(Date.now() + data.expiresInDays * 86_400_000)
    : null

  const [link] = await db.insert(shareLinks).values({
    vehicleId,
    issuedBy: userId,
    token,
    label: data.label,
    scope: data.scope ?? {
      serviceRecords: true,
      documents: true,
      insurancePolicies: true,
      revenueLicenses: true,
      emissionTests: true,
      mileageLog: false,
      timeline: true,
    },
    isSingleUse: data.isSingleUse ?? false,
    expiresAt: expiresAt ?? undefined,
  }).returning()

  return link
}

export async function listShareLinks(db: Db, vehicleId: string, userId: string) {
  await assertVehicleOwner(db, vehicleId, userId)
  return db.query.shareLinks.findMany({
    where: and(eq(shareLinks.vehicleId, vehicleId), eq(shareLinks.isActive, true)),
    orderBy: [desc(shareLinks.createdAt)],
  })
}

export async function revokeShareLink(db: Db, vehicleId: string, linkId: string, userId: string) {
  await assertVehicleOwner(db, vehicleId, userId)
  const link = await db.query.shareLinks.findFirst({
    where: and(eq(shareLinks.id, linkId), eq(shareLinks.vehicleId, vehicleId)),
  })
  if (!link) throw new AppError(404, 'ShareLinkNotFound', 'Share link not found')
  await db.update(shareLinks).set({ isActive: false }).where(eq(shareLinks.id, linkId))
}

export async function resolveShareLink(db: Db, token: string) {
  const link = await db.query.shareLinks.findFirst({
    where: and(eq(shareLinks.token, token), eq(shareLinks.isActive, true)),
  })

  if (!link) throw new AppError(404, 'ShareLinkNotFound', 'Share link not found or has been revoked')

  if (link.expiresAt && new Date() > link.expiresAt) {
    await db.update(shareLinks).set({ isActive: false }).where(eq(shareLinks.id, link.id))
    throw new AppError(410, 'ShareLinkExpired', 'This share link has expired')
  }

  // Increment view count
  await db.update(shareLinks)
    .set({ viewCount: link.viewCount + 1 })
    .where(eq(shareLinks.id, link.id))

  // Auto-deactivate single-use links immediately after first view
  if (link.isSingleUse) {
    await db.update(shareLinks).set({ isActive: false }).where(eq(shareLinks.id, link.id))
  }

  const vehicle = await db.query.vehicles.findFirst({
    where: and(eq(vehicles.id, link.vehicleId), eq(vehicles.isActive, true)),
  })
  if (!vehicle) throw new AppError(404, 'VehicleNotFound', 'Vehicle not found')

  return { link, vehicle }
}

// ─── Co-Owners ────────────────────────────────────────────────────────────────

export async function addCoOwner(db: Db, vehicleId: string, ownerId: string, data: {
  email: string
  canEdit?: boolean
}) {
  await assertVehicleOwner(db, vehicleId, ownerId)

  const targetUser = await db.query.users.findFirst({
    where: eq(users.email, data.email.toLowerCase()),
  })
  if (!targetUser) throw new AppError(404, 'UserNotFound', 'No user found with that email address')
  if (targetUser.id === ownerId) throw new AppError(400, 'CannotAddSelf', 'You cannot add yourself as a co-owner')

  const existing = await db.query.vehicleCoOwners.findFirst({
    where: and(eq(vehicleCoOwners.vehicleId, vehicleId), eq(vehicleCoOwners.userId, targetUser.id)),
  })
  if (existing) throw new AppError(409, 'AlreadyCoOwner', 'This user is already a co-owner')

  const [coOwner] = await db.insert(vehicleCoOwners).values({
    vehicleId,
    userId: targetUser.id,
    addedBy: ownerId,
    canEdit: data.canEdit ?? false,
  }).returning()

  return { ...coOwner, user: { id: targetUser.id, fullName: targetUser.fullName, email: targetUser.email } }
}

export async function listCoOwners(db: Db, vehicleId: string, userId: string) {
  await assertVehicleOwner(db, vehicleId, userId)
  const rows = await db.query.vehicleCoOwners.findMany({
    where: eq(vehicleCoOwners.vehicleId, vehicleId),
    orderBy: [desc(vehicleCoOwners.createdAt)],
  })
  const result = []
  for (const row of rows) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, row.userId),
      columns: { id: true, fullName: true, email: true, avatarUrl: true },
    })
    result.push({ ...row, user })
  }
  return result
}

export async function removeCoOwner(db: Db, vehicleId: string, coUserId: string, ownerId: string) {
  await assertVehicleOwner(db, vehicleId, ownerId)
  const existing = await db.query.vehicleCoOwners.findFirst({
    where: and(eq(vehicleCoOwners.vehicleId, vehicleId), eq(vehicleCoOwners.userId, coUserId)),
  })
  if (!existing) throw new AppError(404, 'CoOwnerNotFound', 'Co-owner not found')
  await db.delete(vehicleCoOwners)
    .where(and(eq(vehicleCoOwners.vehicleId, vehicleId), eq(vehicleCoOwners.userId, coUserId)))
}
