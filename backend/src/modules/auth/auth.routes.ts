import type { FastifyPluginAsync } from 'fastify'
import { RegisterBodySchema, LoginBodySchema, RefreshBodySchema, LogoutBodySchema, TokenResponseSchema } from './auth.schemas.js'
import * as handlers from './auth.handlers.js'

const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/register', {
    schema: {
      tags: ['Auth'],
      summary: 'Register a new user',
      security: [],
      body: RegisterBodySchema,
      response: { 201: TokenResponseSchema },
    },
    handler: handlers.register,
  })

  fastify.post('/login', {
    schema: {
      tags: ['Auth'],
      summary: 'Login with email and password',
      security: [],
      body: LoginBodySchema,
      response: { 200: TokenResponseSchema },
    },
    handler: handlers.login,
  })

  fastify.post('/refresh', {
    schema: {
      tags: ['Auth'],
      summary: 'Rotate refresh token',
      security: [],
      body: RefreshBodySchema,
    },
    handler: handlers.refresh,
  })

  fastify.post('/logout', {
    schema: {
      tags: ['Auth'],
      summary: 'Revoke refresh token family',
      body: LogoutBodySchema,
    },
    handler: handlers.logout,
  })

  fastify.get('/google', {
    schema: {
      tags: ['Auth'],
      summary: 'Redirect to Google OAuth consent page',
      security: [],
    },
    handler: handlers.googleRedirect,
  })

  fastify.get('/google/callback', {
    schema: {
      tags: ['Auth'],
      summary: 'Google OAuth callback',
      security: [],
      querystring: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          error: { type: 'string' },
        },
      },
    },
    handler: handlers.googleCallback,
  })
}

export default authRoutes
