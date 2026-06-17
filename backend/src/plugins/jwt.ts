import fp from 'fastify-plugin'
import { FastifyPluginAsync } from 'fastify'
import fastifyJwt from '@fastify/jwt'
import { config } from '@/config.js'

export interface JwtPayload {
  sub: string
  email: string
  roles: string[]
  type: 'access' | 'refresh'
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload
    user: JwtPayload
  }
}

const jwtPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(fastifyJwt, {
    secret: {
      private: config.JWT_ACCESS_SECRET,
      public: config.JWT_ACCESS_SECRET,
    },
    sign: {
      expiresIn: config.JWT_ACCESS_TTL,
    },
  })
}

export default fp(jwtPlugin, { name: 'jwt' })
