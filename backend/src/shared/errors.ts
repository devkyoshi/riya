import { FastifyError, FastifyReply, FastifyRequest } from 'fastify'

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function errorHandler(error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
  request.log.error(error)

  if (error instanceof AppError) {
    return reply.code(error.statusCode).send({
      error: error.code,
      message: error.message,
    })
  }

  if (error.validation) {
    return reply.code(400).send({
      error: 'ValidationError',
      message: 'Request validation failed',
      details: error.validation,
    })
  }

  if (error.statusCode) {
    return reply.code(error.statusCode).send({
      error: error.code ?? 'Error',
      message: error.message,
    })
  }

  return reply.code(500).send({
    error: 'InternalServerError',
    message: 'An unexpected error occurred',
  })
}
