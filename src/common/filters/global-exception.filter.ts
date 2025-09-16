import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { GlobalApiResponse } from 'src/types';

interface HttpExceptionResponse {
  message?: string | string[];
  error?: string;
  statusCode?: number;
  errorCode?: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorCode = 'INTERNAL_SERVER_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        errorCode = this.getErrorCodeFromStatus(status);
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const responseObj = exceptionResponse as HttpExceptionResponse;

        if (responseObj.message) {
          message = Array.isArray(responseObj.message)
            ? responseObj.message.join(', ')
            : responseObj.message;
        }

        errorCode =
          responseObj.errorCode ||
          responseObj.error ||
          this.getErrorCodeFromStatus(status);
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      errorCode = 'APPLICATION_ERROR';
      this.logger.error(
        `Application error: ${exception.message}`,
        exception.stack,
      );
    } else {
      this.logger.error('Unknown error occurred', exception);
    }

    const errorResponse: GlobalApiResponse<null> = {
      data: null,
      error: errorCode,
      message,
    };

    response.status(status).json(errorResponse);
  }

  private getErrorCodeFromStatus(status: HttpStatus): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'VALIDATION_ERROR';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'RATE_LIMITED';
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return 'INTERNAL_SERVER_ERROR';
      default:
        return 'HTTP_ERROR';
    }
  }
}
