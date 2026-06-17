import fp from 'fastify-plugin'
import { FastifyPluginAsync } from 'fastify'
import fastifyCors from '@fastify/cors'
import { config } from '@/config.js'

const corsPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(fastifyCors, {
    origin: [config.FRONTEND_URL, 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
}

export default fp(corsPlugin, { name: 'cors' })
