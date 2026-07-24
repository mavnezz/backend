import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { DomainException } from '../../Domain/DomainException';

/**
 * Zentraler Exception-Filter. Liefert ein einheitliches Fehler-Format:
 *   { error: { code, message, details } }
 *
 * - fachliche `DomainException`  → deren `status` + `code`
 * - Nest `HttpException`         → HTTP-Status + abgeleiteter Code (inkl. Validierung)
 * - alles andere                 → 500 INTERNAL_ERROR (Stacktrace nur ins Log)
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof DomainException) {
      response.status(exception.status).json({
        error: {
          code: exception.code,
          message: exception.message,
          details: exception.details ?? null,
        },
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();
      const rawMessage =
        typeof payload === 'string'
          ? payload
          : ((payload as Record<string, unknown>).message ?? exception.message);
      const isValidation = Array.isArray(rawMessage);

      response.status(status).json({
        error: {
          code: this.codeForStatus(status),
          message: isValidation ? 'Validation failed' : String(rawMessage),
          details: isValidation ? rawMessage : null,
        },
      });
      return;
    }

    this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
        details: null,
      },
    });
  }

  private codeForStatus(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'VALIDATION_ERROR';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      default:
        return 'HTTP_ERROR';
    }
  }
}
