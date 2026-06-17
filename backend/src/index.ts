import { buildApp } from '@/app.js'
import { config } from '@/config.js'
import { mkdirSync } from 'fs'

mkdirSync(config.STORAGE_LOCAL_PATH, { recursive: true })

const app = await buildApp()

try {
  await app.listen({ port: config.PORT, host: '0.0.0.0' })
  console.log(`Server running at http://localhost:${config.PORT}`)
  console.log(`Swagger docs at http://localhost:${config.PORT}/docs`)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
