import bcrypt from 'bcryptjs'
import { db } from '@/db/index.js'
import { users, userRoles } from '@/db/schema/index.js'
import { eq } from 'drizzle-orm'
import { config } from '@/config.js'

export async function seedAdmin() {
  const email = config.SEED_ADMIN_EMAIL
  const password = config.SEED_ADMIN_PASSWORD

  if (!email || !password) {
    console.log('SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set, skipping admin seed.')
    return
  }

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) })
  if (existing) {
    console.log(`Admin user ${email} already exists, skipping.`)
    return
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const [admin] = await db.insert(users).values({
    email,
    passwordHash,
    fullName: 'System Admin',
    isEmailVerified: true,
  }).returning()

  await db.insert(userRoles).values({ userId: admin.id, roleKey: 'admin' })

  console.log(`Admin user created: ${email}`)
}
