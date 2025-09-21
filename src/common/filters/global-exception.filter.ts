import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorService } from '../errors/error.service';
import { AllErrorCodes, ErrorDefinition } from 'src/config/error.config';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly errorService: ErrorService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    // Check if response has already been sent
    if (response.headersSent) {
      this.logger.warn('Headers already sent, cannot send error response');
      return;
    }

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorResponse = {
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
        statusCode: 500,
      },
      message: 'Something went wrong',
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // Check if it's our custom error format from guards
      if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'data' in exceptionResponse &&
        'error' in exceptionResponse &&
        'message' in exceptionResponse
      ) {
        errorResponse = exceptionResponse as {
          data: null;
          error: ErrorDefinition;
          message: string;
        };
      } else {
        // Handle standard HTTP exceptions
        const message = exception.message;

        // Map HTTP status to our error codes
        let errorCode: AllErrorCodes = 'UNKNOWN_ERROR';
        switch (status) {
          case HttpStatus.BAD_REQUEST:
            errorCode = 'BAD_REQUEST';
            break;
          case HttpStatus.UNAUTHORIZED:
            errorCode = 'TOKEN_EXPIRED';
            break;
          case HttpStatus.FORBIDDEN:
            errorCode = 'ACCESS_DENIED';
            break;
          case HttpStatus.NOT_FOUND:
            errorCode = 'NOT_FOUND';
            break;
          case HttpStatus.TOO_MANY_REQUESTS:
            errorCode = 'TOO_MANY_REQUESTS';
            break;
          default:
            errorCode = 'INTERNAL_ERROR';
        }

        const errorDef = this.errorService.getErrorByCode(errorCode);
        errorResponse = {
          data: null,
          error: errorDef || {
            code: errorCode,
            message: message,
            statusCode: status,
          },
          message: message,
        };
      }
    } else if (exception instanceof Error) {
      // Handle non-HTTP errors
      this.logger.error('Unhandled error:', exception.stack);
      const errorDef = this.errorService.getErrorByCode('INTERNAL_ERROR');
      errorResponse = {
        data: null,
        error: errorDef || {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
          statusCode: 500,
        },
        message: 'Something went wrong',
      };
    } else {
      // Handle unknown exceptions
      this.logger.error('Unknown exception:', exception);
    }

    // Log the error for debugging
    this.logger.error(
      `${request.method} ${request.url} - Status: ${status} - Error: ${JSON.stringify(errorResponse.error)}`,
    );

    try {
      response.status(status).json(errorResponse);
    } catch (responseError) {
      this.logger.error('Failed to send error response:', responseError);
    }
  }
}
