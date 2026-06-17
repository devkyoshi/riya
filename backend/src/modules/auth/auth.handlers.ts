import type { FastifyRequest, FastifyReply } from 'fastify'
import type { RegisterBody, LoginBody, RefreshBody, LogoutBody } from './auth.schemas.js'
import * as authService from './auth.service.js'
import { config } from '@/config.js'
import { OAuth2Client } from 'google-auth-library'
import { eq } from 'drizzle-orm'
import { users, userRoles } from '@/db/schema/index.js'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'

export async function register(req: FastifyRequest<{ Body: RegisterBody }>, reply: FastifyReply) {
  const result = await authService.registerUser(req.server, req.server.db, req.body)
  return reply.code(201).send({
    accessToken:  result.accessToken,
    refreshToken: result.refreshToken,
    user: {
      id:       result.user.id,
      email:    result.user.email,
      fullName: result.user.fullName,
      roles:    result.roles,
    },
  })
}

export async function login(req: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) {
  const result = await authService.loginUser(req.server, req.server.db, req.body)
  return reply.send({
    accessToken:  result.accessToken,
    refreshToken: result.refreshToken,
    user: {
      id:       result.user.id,
      email:    result.user.email,
      fullName: result.user.fullName,
      roles:    result.roles,
    },
  })
}

export async function refresh(req: FastifyRequest<{ Body: RefreshBody }>, reply: FastifyReply) {
  const tokens = await authService.rotateRefreshToken(req.server, req.server.db, req.body.refreshToken)
  return reply.send(tokens)
}

export async function logout(req: FastifyRequest<{ Body: LogoutBody }>, reply: FastifyReply) {
  await authService.revokeRefreshToken(req.server.db, req.body.refreshToken)
  return reply.code(204).send()
}

export async function googleRedirect(req: FastifyRequest, reply: FastifyReply) {
  if (!config.GOOGLE_CLIENT_ID || !config.GOOGLE_CALLBACK_URL) {
    return reply.code(503).send({ error: 'GoogleOAuthNotConfigured', message: 'Google OAuth is not configured' })
  }

  const client = new OAuth2Client(config.GOOGLE_CLIENT_ID, config.GOOGLE_CLIENT_SECRET, config.GOOGLE_CALLBACK_URL)
  const url = client.generateAuthUrl({
    access_type: 'offline',
    scope: ['profile', 'email'],
    prompt: 'consent',
  })
  return reply.redirect(url)
}

export async function googleCallback(req: FastifyRequest<{ Querystring: { code?: string; error?: string } }>, reply: FastifyReply) {
  const { code, error } = req.query

  if (error || !code) {
    return reply.redirect(`${config.FRONTEND_URL}/auth/login?error=oauth_cancelled`)
  }

  try {
    const client = new OAuth2Client(config.GOOGLE_CLIENT_ID, config.GOOGLE_CLIENT_SECRET, config.GOOGLE_CALLBACK_URL)
    const { tokens: googleTokens } = await client.getToken(code)
    client.setCredentials(googleTokens)

    const ticket = await client.verifyIdToken({
      idToken: googleTokens.id_token!,
      audience: config.GOOGLE_CLIENT_ID,
    })
    const payload = ticket.getPayload()!

    const db = req.server.db
    let user = await db.query.users.findFirst({ where: eq(users.googleId, payload.sub) })

    if (!user) {
      // Check if email exists — link accounts
      user = await db.query.users.findFirst({ where: eq(users.email, payload.email!) })
      if (user) {
        await db.update(users).set({ googleId: payload.sub, isEmailVerified: true }).where(eq(users.id, user.id))
      } else {
        const [newUser] = await db.insert(users).values({
          email:           payload.email!,
          fullName:        payload.name ?? payload.email!,
          avatarUrl:       payload.picture,
          googleId:        payload.sub,
          isEmailVerified: true,
          passwordHash:    await bcrypt.hash(randomUUID(), 12),
        }).returning()
        await db.insert(userRoles).values({ userId: newUser.id, roleKey: 'owner' })
        user = newUser
      }
    }

    const roles = await authService.getUserRoles(db, user.id)
    const { accessToken, refreshToken } = await authService.issueTokenPair(req.server, db, user.id, user.email, roles)

    return reply.redirect(`${config.FRONTEND_URL}/auth/callback?token=${accessToken}&refresh=${refreshToken}`)
  } catch (err) {
    req.log.error(err)
    return reply.redirect(`${config.FRONTEND_URL}/auth/login?error=oauth_failed`)
  }
}
