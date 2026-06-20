import { eq, and, desc } from 'drizzle-orm'
import type { Db } from '@/db/index.js'
import { documents, timelinePosts, vehicles } from '@/db/schema/index.js'
import { AppError } from '@/shared/errors.js'
import type { MultipartFile } from '@fastify/multipart'
import type { StorageAdapter } from '@/shared/storage.js'
import { isOcrEligible, dispatchOcrJob } from './ocr.client.js'

export async function assertVehicleOwner(db: Db, vehicleId: string, userId: string) {
  const vehicle = await db.query.vehicles.findFirst({
    where: and(eq(vehicles.id, vehicleId), eq(vehicles.isActive, true)),
  })
  if (!vehicle) throw new AppError(404, 'VehicleNotFound', 'Vehicle not found')
  if (vehicle.ownerId !== userId) throw new AppError(403, 'Forbidden', 'Access denied')
  return vehicle
}

export async function uploadDocument(
  db: Db,
  storage: StorageAdapter,
  vehicleId: string,
  userId: string,
  file: MultipartFile,
  meta: {
    documentType: string
    title: string
    notes?: string
    expiresAt?: string
  },
) {
  await assertVehicleOwner(db, vehicleId, userId)

  const { key, url, sizeBytes } = await storage.upload(file, `vehicles/${vehicleId}/documents`)

  const eligible = isOcrEligible(meta.documentType)

  const [doc] = await db.insert(documents).values({
    vehicleId,
    uploadedBy: userId,
    documentType: meta.documentType as any,
    title: meta.title,
    fileUrl: url,
    fileKey: key,
    fileSizeBytes: sizeBytes,
    mimeType: file.mimetype,
    ocrStatus: eligible ? 'pending' : 'skipped',
    notes: meta.notes,
    expiresAt: meta.expiresAt ? new Date(meta.expiresAt) : undefined,
  }).returning()

  await db.insert(timelinePosts).values({
    vehicleId,
    createdBy: userId,
    postType: 'document_upload',
    title: `Document uploaded: ${meta.title}`,
    payload: { documentType: meta.documentType, documentId: doc.id },
    refId: doc.id,
    refTable: 'documents',
  })

  if (eligible) {
    dispatchOcrJob({ id: doc.id, documentType: doc.documentType, fileUrl: doc.fileUrl })
  }

  return doc
}

export async function listDocuments(db: Db, vehicleId: string, userId: string, type?: string) {
  await assertVehicleOwner(db, vehicleId, userId)

  const conditions = [eq(documents.vehicleId, vehicleId)]
  if (type) conditions.push(eq(documents.documentType, type as any))

  return db.query.documents.findMany({
    where: and(...conditions),
    orderBy: [desc(documents.createdAt)],
  })
}

export async function getDocument(db: Db, vehicleId: string, docId: string, userId: string) {
  await assertVehicleOwner(db, vehicleId, userId)

  const doc = await db.query.documents.findFirst({
    where: and(eq(documents.id, docId), eq(documents.vehicleId, vehicleId)),
  })
  if (!doc) throw new AppError(404, 'DocumentNotFound', 'Document not found')
  return doc
}

export async function deleteDocument(db: Db, storage: StorageAdapter, vehicleId: string, docId: string, userId: string) {
  const doc = await getDocument(db, vehicleId, docId, userId)
  await storage.delete(doc.fileKey)
  await db.delete(documents).where(eq(documents.id, docId))
}

export async function confirmOcrFields(db: Db, vehicleId: string, docId: string, userId: string) {
  const doc = await getDocument(db, vehicleId, docId, userId)
  const [updated] = await db.update(documents)
    .set({ isVerified: true, verifiedBy: userId })
    .where(eq(documents.id, docId))
    .returning()
  return updated
}
