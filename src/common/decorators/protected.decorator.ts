import { SetMetadata } from '@nestjs/common';

export const PROTECTED_KEY = 'protected';
export const Protected = () => SetMetadata(PROTECTED_KEY, true);
