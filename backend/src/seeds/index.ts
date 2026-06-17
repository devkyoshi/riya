import { seedRoles } from './roles.seed.js'
import { seedAdmin } from './admin.seed.js'

console.log('Starting database seed...')

await seedRoles()
await seedAdmin()

console.log('Seed complete.')
process.exit(0)
