import type { FastifyPluginAsync } from 'fastify'
import { Type } from '@sinclair/typebox'
import * as handlers from './records.handlers.js'

const ServiceRecordBody = Type.Object({
  serviceDate:  Type.String({ format: 'date' }),
  mileageKm:    Type.Integer({ minimum: 0 }),
  description:  Type.String({ minLength: 1 }),
  garageName:   Type.Optional(Type.String()),
  laborCost:    Type.Optional(Type.String()),
  totalCost:    Type.Optional(Type.String()),
  currency:     Type.Optional(Type.String()),
  parts:        Type.Optional(Type.Any()),
})

const InsuranceBody = Type.Object({
  provider:     Type.String({ minLength: 1 }),
  policyNumber: Type.String({ minLength: 1 }),
  startDate:    Type.String({ format: 'date' }),
  endDate:      Type.String({ format: 'date' }),
  coverageType: Type.Optional(Type.String()),
  premiumLkr:   Type.Optional(Type.String()),
})

const RevenueLicenseBody = Type.Object({
  issueDate:     Type.String({ format: 'date' }),
  expiryDate:    Type.String({ format: 'date' }),
  licenseNumber: Type.Optional(Type.String()),
  feeAmountLkr:  Type.Optional(Type.String()),
})

const EmissionTestBody = Type.Object({
  testDate:    Type.String({ format: 'date' }),
  expiryDate:  Type.String({ format: 'date' }),
  testCenter:  Type.Optional(Type.String()),
  result:      Type.Optional(Type.Union([Type.Literal('pass'), Type.Literal('fail')])),
  readings:    Type.Optional(Type.Any()),
})

const VehicleParams = Type.Object({ id: Type.String() })

const recordsRoutes: FastifyPluginAsync = async (fastify) => {
  // Service Records
  fastify.post('/vehicles/:id/service-records', {
    schema: { tags: ['Records'], summary: 'Add service record', params: VehicleParams, body: ServiceRecordBody },
    preHandler: [fastify.requireAuth(), fastify.requireFeature('service_records')],
    handler: handlers.addServiceRecord,
  })
  fastify.get('/vehicles/:id/service-records', {
    schema: { tags: ['Records'], summary: 'List service records', params: VehicleParams },
    preHandler: [fastify.requireAuth(), fastify.requireFeature('service_records')],
    handler: handlers.listServiceRecords,
  })

  // Insurance
  fastify.post('/vehicles/:id/insurance', {
    schema: { tags: ['Records'], summary: 'Add insurance policy', params: VehicleParams, body: InsuranceBody },
    preHandler: [fastify.requireAuth(), fastify.requireFeature('insurance_records')],
    handler: handlers.addInsurancePolicy,
  })
  fastify.get('/vehicles/:id/insurance', {
    schema: { tags: ['Records'], summary: 'List insurance policies', params: VehicleParams },
    preHandler: [fastify.requireAuth(), fastify.requireFeature('insurance_records')],
    handler: handlers.listInsurancePolicies,
  })

  // Revenue Licenses
  fastify.post('/vehicles/:id/revenue-licenses', {
    schema: { tags: ['Records'], summary: 'Add revenue license', params: VehicleParams, body: RevenueLicenseBody },
    preHandler: [fastify.requireAuth(), fastify.requireFeature('revenue_licenses')],
    handler: handlers.addRevenueLicense,
  })
  fastify.get('/vehicles/:id/revenue-licenses', {
    schema: { tags: ['Records'], summary: 'List revenue licenses', params: VehicleParams },
    preHandler: [fastify.requireAuth(), fastify.requireFeature('revenue_licenses')],
    handler: handlers.listRevenueLicenses,
  })

  // Emission Tests
  fastify.post('/vehicles/:id/emission-tests', {
    schema: { tags: ['Records'], summary: 'Add emission test', params: VehicleParams, body: EmissionTestBody },
    preHandler: [fastify.requireAuth(), fastify.requireFeature('emission_tests')],
    handler: handlers.addEmissionTest,
  })
  fastify.get('/vehicles/:id/emission-tests', {
    schema: { tags: ['Records'], summary: 'List emission tests', params: VehicleParams },
    preHandler: [fastify.requireAuth(), fastify.requireFeature('emission_tests')],
    handler: handlers.listEmissionTests,
  })
}

export default recordsRoutes
