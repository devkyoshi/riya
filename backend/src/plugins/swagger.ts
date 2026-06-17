import fp from 'fastify-plugin'
import { FastifyPluginAsync } from 'fastify'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'

const swaggerPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(fastifySwagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'Riya API',
        description: 'Digital Vehicle Identity & Social Lifecycle Platform',
        version: '1.0.0',
      },
      servers: [{ url: 'http://localhost:3001', description: 'Development' }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [{ bearerAuth: [] }],
      tags: [
        { name: 'Auth',      description: 'Authentication endpoints' },
        { name: 'Vehicles',  description: 'Vehicle profile management' },
        { name: 'Documents', description: 'Document vault' },
        { name: 'Records',   description: 'Service, insurance, and compliance records' },
        { name: 'Timeline',  description: 'Vehicle lifecycle timeline' },
        { name: 'Admin',     description: 'System administration' },
      ],
    },
  })

  await fastify.register(fastifySwaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  })
}

export default fp(swaggerPlugin, { name: 'swagger' })
