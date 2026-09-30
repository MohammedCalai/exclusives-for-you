import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const request = host.switchToHttp().getRequest<Request>();
    const status = error instanceof HttpException ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const raw = error instanceof HttpException ? error.getResponse() : null;
    const message = typeof raw === 'object' && raw && 'message' in raw ? (raw as { message: unknown }).message : status === 500 ? 'An unexpected error occurred' : String(raw);
    response.status(status).json({ statusCode: status, code: error instanceof HttpException ? error.name : 'InternalServerError', message, path: request.url, timestamp: new Date().toISOString() });
  }
}
