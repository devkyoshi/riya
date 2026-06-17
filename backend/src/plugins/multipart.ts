import fp from 'fastify-plugin'
import { FastifyPluginAsync } from 'fastify'
import fastifyMultipart from '@fastify/multipart'
import { config } from '@/config.js'

const multipartPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(fastifyMultipart, {
    limits: {
      fileSize: config.UPLOAD_MAX_SIZE_BYTES,
      files: 1,
    },
  })
}

export default fp(multipartPlugin, { name: 'multipart' })
