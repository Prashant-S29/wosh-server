import { Injectable } from '@nestjs/common';
import { ALL_ERRORS, AllErrorCodes } from 'src/config/error.config';

@Injectable()
export class ErrorService {
  getErrorByCode(code: AllErrorCodes) {
    for (const category of Object.values(ALL_ERRORS)) {
      const error = category.find((err) => err.code === code);
      if (error) return error;
    }
    return {
      code: 'UNKNOWN_ERROR',
      message: 'Unknown error occurred',
      statusCode: 500,
    };
  }
}
