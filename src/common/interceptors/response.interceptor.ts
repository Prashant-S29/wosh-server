import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';
import { GlobalApiResponse, InternalApiResponse } from 'src/types';

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasProperty<T extends string>(
  obj: Record<string, unknown>,
  prop: T,
): obj is Record<T, unknown> {
  return prop in obj;
}

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<GlobalApiResponse> {
    return next.handle().pipe(
      map((data: unknown) => {
        const response = context.switchToHttp().getResponse<Response>();

        if (this.isInternalApiResponse(data)) {
          response.status(data.statusCode);

          return {
            data: data.data,
            error: data.errorCode,
            message: data.message,
          };
        }

        return {
          data: data ?? null,
          error: null,
          message: 'Success',
        };
      }),
    );
  }

  private isInternalApiResponse(data: unknown): data is InternalApiResponse {
    if (!isObject(data)) {
      return false;
    }

    const requiredProperties = [
      'statusCode',
      'errorCode',
      'message',
      'data',
    ] as const;

    if (!requiredProperties.every((prop) => hasProperty(data, prop))) {
      return false;
    }

    return (
      typeof data.statusCode === 'number' &&
      (typeof data.errorCode === 'string' || data.errorCode === null) &&
      typeof data.message === 'string'
    );
  }
}
