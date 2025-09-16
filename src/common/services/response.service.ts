import { HttpStatus, Injectable } from '@nestjs/common';
import { InternalApiResponse } from 'src/types';

@Injectable()
export class ResponseService {
  success<T>(
    data: T,
    message = 'Success',
    statusCode: number = HttpStatus.OK,
  ): InternalApiResponse<T> {
    return {
      data: data ?? null,
      errorCode: null,
      message,
      statusCode,
    };
  }

  error(
    errorCode: string,
    message: string,
    statusCode: number = HttpStatus.BAD_REQUEST,
  ): InternalApiResponse<null> {
    return {
      data: null,
      errorCode,
      message,
      statusCode,
    };
  }
}
