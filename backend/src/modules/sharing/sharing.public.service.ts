import { eq, and, desc } from 'drizzle-orm'
import type { Db } from '@/db/index.js'
import {
  shareLinks, vehicles, serviceRecords, insurancePolicies,
  revenueLicenses, emissionTests, documents, mileageLog, timelinePosts,
} from '@/db/schema/index.js'
import { AppError } from '@/shared/errors.js'

export async function getShareView(db: Db, token: string) {
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

  const scope = (link.scope as Record<string, boolean>) ?? {}

  const [svc, ins, rev, emi, docs, mileage, timeline] = await Promise.all([
    scope.serviceRecords
      ? db.query.serviceRecords.findMany({ where: eq(serviceRecords.vehicleId, vehicle.id), orderBy: [desc(serviceRecords.serviceDate)] })
      : Promise.resolve([]),
    scope.insurancePolicies
      ? db.query.insurancePolicies.findMany({ where: eq(insurancePolicies.vehicleId, vehicle.id), orderBy: [desc(insurancePolicies.startDate)] })
      : Promise.resolve([]),
    scope.revenueLicenses
      ? db.query.revenueLicenses.findMany({ where: eq(revenueLicenses.vehicleId, vehicle.id), orderBy: [desc(revenueLicenses.issueDate)] })
      : Promise.resolve([]),
    scope.emissionTests
      ? db.query.emissionTests.findMany({ where: eq(emissionTests.vehicleId, vehicle.id), orderBy: [desc(emissionTests.testDate)] })
      : Promise.resolve([]),
    scope.documents
      ? db.query.documents.findMany({ where: eq(documents.vehicleId, vehicle.id), orderBy: [desc(documents.createdAt)] })
      : Promise.resolve([]),
    scope.mileageLog
      ? db.query.mileageLog.findMany({ where: eq(mileageLog.vehicleId, vehicle.id), orderBy: [desc(mileageLog.recordedAt)] })
      : Promise.resolve([]),
    scope.timeline
      ? db.query.timelinePosts.findMany({ where: and(eq(timelinePosts.vehicleId, vehicle.id)), orderBy: [desc(timelinePosts.createdAt)], limit: 50 })
      : Promise.resolve([]),
  ])

  return {
    vehicle: {
      id: vehicle.id,
      plateNumber: vehicle.plateNumber,
      make: vehicle.make,
      model: vehicle.model,
      variant: vehicle.variant,
      year: vehicle.year,
      color: vehicle.color,
      fuelType: vehicle.fuelType,
      transmission: vehicle.transmission,
      engineCapacityCC: vehicle.engineCapacityCC,
      currentMileageKm: vehicle.currentMileageKm,
      condition: vehicle.condition,
      coverPhotoUrl: vehicle.coverPhotoUrl,
      bio: vehicle.bio,
    },
    shareLink: {
      label: link.label,
      expiresAt: link.expiresAt,
      scope,
    },
    data: {
      serviceRecords: svc,
      insurancePolicies: ins,
      revenueLicenses: rev,
      emissionTests: emi,
      documents: docs,
      mileageLog: mileage,
      timeline,
    },
  }
}
