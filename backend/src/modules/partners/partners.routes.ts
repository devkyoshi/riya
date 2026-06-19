import type { FastifyPluginAsync } from 'fastify'
import { Type } from '@sinclair/typebox'
import * as handlers from './partners.handlers.js'

const RegisterBusinessBody = Type.Object({
  type:               Type.Union([Type.Literal('garage'), Type.Literal('insurer'), Type.Literal('dealer')]),
  businessName:       Type.String({ minLength: 2, maxLength: 255 }),
  registrationNumber: Type.Optional(Type.String({ maxLength: 100 })),
  address:            Type.Optional(Type.String()),
  contactPhone:       Type.Optional(Type.String({ maxLength: 50 })),
  contactEmail:       Type.Optional(Type.String({ format: 'email' })),
})

const UpdateBusinessBody = Type.Object({
  businessName:       Type.Optional(Type.String({ minLength: 2, maxLength: 255 })),
  registrationNumber: Type.Optional(Type.String({ maxLength: 100 })),
  address:            Type.Optional(Type.String()),
  contactPhone:       Type.Optional(Type.String({ maxLength: 50 })),
  contactEmail:       Type.Optional(Type.String({ format: 'email' })),
})

const SubmitServiceBody = Type.Object({
  vehiclePlate: Type.String({ minLength: 2, maxLength: 20 }),
  serviceDate:  Type.String({ pattern: '^\\d{4}-\\d{2}-\\d{2}$' }),
  mileageKm:    Type.Integer({ minimum: 0 }),
  description:  Type.String({ minLength: 3 }),
  parts:        Type.Optional(Type.Any()),
  laborCost:    Type.Optional(Type.String()),
  totalCost:    Type.Optional(Type.String()),
})

const SubmitInsuranceBody = Type.Object({
  vehiclePlate:  Type.String({ minLength: 2, maxLength: 20 }),
  policyNumber:  Type.String({ minLength: 2, maxLength: 100 }),
  coverageType:  Type.Optional(Type.String({ maxLength: 100 })),
  startDate:     Type.String({ pattern: '^\\d{4}-\\d{2}-\\d{2}$' }),
  endDate:       Type.String({ pattern: '^\\d{4}-\\d{2}-\\d{2}$' }),
  premiumLkr:    Type.Optional(Type.String()),
})

const partnersRoutes: FastifyPluginAsync = async (fastify) => {
  const auth = [fastify.requireAuth()]

  fastify.post('/partner/register', {
    schema: { tags: ['Partners'], summary: 'Register a business account (garage / insurer / dealer)', body: RegisterBusinessBody },
    preHandler: auth,
    handler: handlers.registerBusiness,
  })

  fastify.get('/partner/profile', {
    schema: { tags: ['Partners'], summary: 'Get my business account profile' },
    preHandler: auth,
    handler: handlers.getMyBusiness,
  })

  fastify.patch('/partner/profile', {
    schema: { tags: ['Partners'], summary: 'Update business profile', body: UpdateBusinessBody },
    preHandler: auth,
    handler: handlers.updateBusiness,
  })

  fastify.post('/partner/service-records', {
    schema: { tags: ['Partners'], summary: 'Submit a service record for a vehicle (garage only)', body: SubmitServiceBody },
    preHandler: auth,
    handler: handlers.submitServiceRecord,
  })

  fastify.post('/partner/insurance', {
    schema: { tags: ['Partners'], summary: 'Submit an insurance policy for a vehicle (insurer only)', body: SubmitInsuranceBody },
    preHandler: auth,
    handler: handlers.submitInsurancePolicy,
  })

  fastify.get('/partner/submissions', {
    schema: { tags: ['Partners'], summary: 'List all records submitted by this partner' },
    preHandler: auth,
    handler: handlers.listMySubmissions,
  })
}

export default partnersRoutes
