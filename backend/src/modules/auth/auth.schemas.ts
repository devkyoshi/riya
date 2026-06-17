import { Type, Static } from '@sinclair/typebox'

export const RegisterBodySchema = Type.Object({
  fullName: Type.String({ minLength: 2, maxLength: 255 }),
  email:    Type.String({ format: 'email' }),
  password: Type.String({ minLength: 8 }),
})
export type RegisterBody = Static<typeof RegisterBodySchema>

export const LoginBodySchema = Type.Object({
  email:    Type.String({ format: 'email' }),
  password: Type.String({ minLength: 1 }),
})
export type LoginBody = Static<typeof LoginBodySchema>

export const RefreshBodySchema = Type.Object({
  refreshToken: Type.String(),
})
export type RefreshBody = Static<typeof RefreshBodySchema>

export const LogoutBodySchema = Type.Object({
  refreshToken: Type.String(),
})
export type LogoutBody = Static<typeof LogoutBodySchema>

export const TokenResponseSchema = Type.Object({
  accessToken:  Type.String(),
  refreshToken: Type.String(),
  user: Type.Object({
    id:       Type.String(),
    email:    Type.String(),
    fullName: Type.String(),
    roles:    Type.Array(Type.String()),
  }),
})
