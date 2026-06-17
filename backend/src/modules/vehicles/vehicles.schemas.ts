import { Type, Static } from '@sinclair/typebox'

const FuelTypeEnum = Type.Union([
  Type.Literal('petrol'), Type.Literal('diesel'), Type.Literal('electric'),
  Type.Literal('hybrid'), Type.Literal('lpg'),
])

const TransmissionEnum = Type.Union([
  Type.Literal('manual'), Type.Literal('automatic'), Type.Literal('cvt'),
])

const ConditionEnum = Type.Union([
  Type.Literal('excellent'), Type.Literal('good'), Type.Literal('fair'), Type.Literal('poor'),
])

export const CreateVehicleSchema = Type.Object({
  plateNumber:      Type.String({ minLength: 1, maxLength: 20 }),
  make:             Type.String({ minLength: 1, maxLength: 100 }),
  model:            Type.String({ minLength: 1, maxLength: 100 }),
  year:             Type.Integer({ minimum: 1900, maximum: 2100 }),
  fuelType:         FuelTypeEnum,
  transmission:     TransmissionEnum,
  chassisNumber:    Type.Optional(Type.String()),
  engineNumber:     Type.Optional(Type.String()),
  variant:          Type.Optional(Type.String()),
  color:            Type.Optional(Type.String()),
  engineCapacityCC: Type.Optional(Type.Integer()),
  currentMileageKm: Type.Optional(Type.Integer({ minimum: 0 })),
  condition:        Type.Optional(ConditionEnum),
  bio:              Type.Optional(Type.String({ maxLength: 500 })),
})
export type CreateVehicleBody = Static<typeof CreateVehicleSchema>

export const UpdateVehicleSchema = Type.Object({
  make:             Type.Optional(Type.String()),
  model:            Type.Optional(Type.String()),
  variant:          Type.Optional(Type.String()),
  color:            Type.Optional(Type.String()),
  engineCapacityCC: Type.Optional(Type.Integer()),
  currentMileageKm: Type.Optional(Type.Integer({ minimum: 0 })),
  condition:        Type.Optional(ConditionEnum),
  bio:              Type.Optional(Type.String({ maxLength: 500 })),
  chassisNumber:    Type.Optional(Type.String()),
  engineNumber:     Type.Optional(Type.String()),
})
export type UpdateVehicleBody = Static<typeof UpdateVehicleSchema>
