import bcrypt from 'bcryptjs'
import { createHash, randomUUID } from 'crypto'
import { eq, and } from 'drizzle-orm'
import type { Db } from '@/db/index.js'
import { users, refreshTokens, userRoles } from '@/db/schema/index.js'
import { AppError } from '@/shared/errors.js'
import { config } from '@/config.js'
import type { FastifyInstance } from 'fastify'

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export async function getUserRoles(db: Db, userId: string): Promise<string[]> {
  const rows = await db.query.userRoles.findMany({
    where: eq(userRoles.userId, userId),
  })
  return rows.map((r) => r.roleKey)
}

export async function issueTokenPair(
  fastify: FastifyInstance,
  db: Db,
  userId: string,
  email: string,
  roles: string[],
): Promise<{ accessToken: string; refreshToken: string }> {
  const accessToken = fastify.jwt.sign(
    { sub: userId, email, roles, type: 'access' },
    { expiresIn: config.JWT_ACCESS_TTL },
  )

  const rawRefresh = randomUUID()
  const family = randomUUID()
  const expiresAt = new Date(Date.now() + config.JWT_REFRESH_TTL * 1000)

  await db.insert(refreshTokens).values({
    userId,
    tokenHash: hashToken(rawRefresh),
    family,
    expiresAt,
  })

  return { accessToken, refreshToken: rawRefresh }
}

export async function registerUser(
  fastify: FastifyInstance,
  db: Db,
  data: { fullName: string; email: string; password: string },
) {
  const existing = await db.query.users.findFirst({ where: eq(users.email, data.email) })
  if (existing) {
    throw new AppError(409, 'EmailAlreadyExists', 'A user with this email already exists')
  }

  const passwordHash = await bcrypt.hash(data.password, 12)
  const [user] = await db.insert(users).values({
    email: data.email,
    passwordHash,
    fullName: data.fullName,
    isEmailVerified: false,
  }).returning()

  await db.insert(userRoles).values({ userId: user.id, roleKey: 'owner' })

  const roles = ['owner']
  const tokens = await issueTokenPair(fastify, db, user.id, user.email, roles)

  return { user, roles, ...tokens }
}

export async function loginUser(
  fastify: FastifyInstance,
  db: Db,
  data: { email: string; password: string },
) {
  const user = await db.query.users.findFirst({ where: eq(users.email, data.email) })
  if (!user || !user.passwordHash) {
    throw new AppError(401, 'InvalidCredentials', 'Invalid email or password')
  }

  const valid = await bcrypt.compare(data.password, user.passwordHash)
  if (!valid) {
    throw new AppError(401, 'InvalidCredentials', 'Invalid email or password')
  }

  if (!user.isActive) {
    throw new AppError(403, 'AccountDisabled', 'Your account has been disabled')
  }

  const roles = await getUserRoles(db, user.id)
  const tokens = await issueTokenPair(fastify, db, user.id, user.email, roles)

  return { user, roles, ...tokens }
}

export async function rotateRefreshToken(
  fastify: FastifyInstance,
  db: Db,
  rawToken: string,
) {
  const tokenHash = hashToken(rawToken)
  const stored = await db.query.refreshTokens.findFirst({
    where: eq(refreshTokens.tokenHash, tokenHash),
  })

  if (!stored) {
    throw new AppError(401, 'InvalidToken', 'Refresh token not found')
  }

  if (stored.isRevoked) {
    // Possible token theft — revoke entire family
    await db.update(refreshTokens)
      .set({ isRevoked: true })
      .where(eq(refreshTokens.family, stored.family))
    throw new AppError(401, 'TokenReuse', 'Refresh token has already been used')
  }

  if (new Date() > stored.expiresAt) {
    throw new AppError(401, 'TokenExpired', 'Refresh token has expired')
  }

  // Revoke old token
  await db.update(refreshTokens)
    .set({ isRevoked: true })
    .where(eq(refreshTokens.id, stored.id))

  const user = await db.query.users.findFirst({ where: eq(users.id, stored.userId) })
  if (!user) throw new AppError(401, 'InvalidToken', 'User not found')

  const roles = await getUserRoles(db, user.id)
  return issueTokenPair(fastify, db, user.id, user.email, roles)
}

export async function revokeRefreshToken(db: Db, rawToken: string) {
  const tokenHash = hashToken(rawToken)
  const stored = await db.query.refreshTokens.findFirst({
    where: eq(refreshTokens.tokenHash, tokenHash),
  })
  if (!stored) return

  await db.update(refreshTokens)
    .set({ isRevoked: true })
    .where(eq(refreshTokens.family, stored.family))
}
