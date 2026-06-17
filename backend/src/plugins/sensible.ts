import fp from 'fastify-plugin'
import { FastifyPluginAsync } from 'fastify'
import fastifySensible from '@fastify/sensible'

const sensiblePlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(fastifySensible)
}

export default fp(sensiblePlugin, { name: 'sensible' })
