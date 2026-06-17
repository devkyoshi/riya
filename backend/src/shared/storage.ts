import { createWriteStream, mkdirSync, unlinkSync, existsSync } from 'fs'
import { join, extname, dirname } from 'path'
import { pipeline } from 'stream/promises'
import { randomUUID } from 'crypto'
import { fileURLToPath } from 'url'
import type { MultipartFile } from '@fastify/multipart'

export interface StorageAdapter {
  upload(file: MultipartFile, folder: string): Promise<{ key: string; url: string; sizeBytes: number }>
  delete(key: string): Promise<void>
  getUrl(key: string): string
}

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]

export function validateFileMime(mimeType: string): void {
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new Error(`Unsupported file type: ${mimeType}. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`)
  }
}

export class LocalStorageAdapter implements StorageAdapter {
  private readonly basePath: string
  private readonly baseUrl: string

  constructor(basePath: string, baseUrl: string) {
    this.basePath = basePath
    this.baseUrl = baseUrl
    mkdirSync(basePath, { recursive: true })
  }

  async upload(file: MultipartFile, folder: string): Promise<{ key: string; url: string; sizeBytes: number }> {
    validateFileMime(file.mimetype)

    const ext = extname(file.filename) || this.mimeToExt(file.mimetype)
    const key = `${folder}/${randomUUID()}${ext}`
    const dest = join(this.basePath, key)

    mkdirSync(dirname(dest), { recursive: true })

    let sizeBytes = 0
    const writeStream = createWriteStream(dest)

    await pipeline(
      file.file,
      async function* (source) {
        for await (const chunk of source) {
          sizeBytes += (chunk as Buffer).length
          yield chunk
        }
      },
      writeStream,
    )

    return { key, url: this.getUrl(key), sizeBytes }
  }

  async delete(key: string): Promise<void> {
    const path = join(this.basePath, key)
    if (existsSync(path)) {
      unlinkSync(path)
    }
  }

  getUrl(key: string): string {
    return `${this.baseUrl}/uploads/${key}`
  }

  private mimeToExt(mime: string): string {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'application/pdf': '.pdf',
    }
    return map[mime] ?? ''
  }
}
