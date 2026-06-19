import type { FastifyPluginAsync } from 'fastify'
import { Type } from '@sinclair/typebox'
import * as handlers from './insights.handlers.js'

const AddMileageBody = Type.Object({
  mileageKm:  Type.Integer({ minimum: 0 }),
  recordedAt: Type.String({ pattern: '^\\d{4}-\\d{2}-\\d{2}$' }),
  source:     Type.Optional(Type.String({ maxLength: 50 })),
  notes:      Type.Optional(Type.String()),
})

const insightsRoutes: FastifyPluginAsync = async (fastify) => {
  const authInsights = [fastify.requireAuth(), fastify.requireFeature('vehicle_insights')]

  fastify.post('/vehicles/:id/mileage', {
    schema: { tags: ['Insights'], summary: 'Log a mileage reading', params: Type.Object({ id: Type.String() }), body: AddMileageBody },
    preHandler: authInsights,
    handler: handlers.addMileageEntry,
  })

  fastify.get('/vehicles/:id/mileage', {
    schema: { tags: ['Insights'], summary: 'Get mileage history', params: Type.Object({ id: Type.String() }) },
    preHandler: authInsights,
    handler: handlers.listMileageLog,
  })

  fastify.get('/vehicles/:id/health-score', {
    schema: { tags: ['Insights'], summary: 'Compute and return vehicle health score', params: Type.Object({ id: Type.String() }) },
    preHandler: authInsights,
    handler: handlers.getHealthScore,
  })

  fastify.get('/vehicles/:id/valuation', {
    schema: { tags: ['Insights'], summary: 'Compute resale valuation estimate', params: Type.Object({ id: Type.String() }) },
    preHandler: authInsights,
    handler: handlers.getValuation,
  })

  fastify.get('/vehicles/:id/maintenance-schedule', {
    schema: { tags: ['Insights'], summary: 'Get predictive maintenance schedule', params: Type.Object({ id: Type.String() }) },
    preHandler: authInsights,
    handler: handlers.getMaintenanceSchedule,
  })

  fastify.post('/vehicles/:id/fraud-check', {
    schema: { tags: ['Insights'], summary: 'Run odometer anomaly detection over mileage log', params: Type.Object({ id: Type.String() }) },
    preHandler: authInsights,
    handler: handlers.runFraudCheck,
  })

  fastify.get('/vehicles/:id/fraud-flags', {
    schema: { tags: ['Insights'], summary: 'List active fraud flags', params: Type.Object({ id: Type.String() }) },
    preHandler: authInsights,
    handler: handlers.listFraudFlags,
  })
}

export default insightsRoutes
