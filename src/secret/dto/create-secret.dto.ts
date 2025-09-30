import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSecretDto {
  @ApiProperty({
    example: 'DATABASE_URI',
    description: 'The key name for the secret',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  keyName: string;

  @ApiProperty({
    example: 'This is the DB password used for prod environment',
    description: 'Optional note or description for the secret',
    required: false,
  })
  @IsString()
  @IsOptional()
  note?: string;

  @ApiProperty({
    example: 'encrypted-data-here',
    description: 'The encrypted ciphertext of the secret',
  })
  @IsString()
  @IsOptional()
  ciphertext?: string;

  @ApiProperty({
    example: 'random-nonce-value',
    description: 'The nonce used for encryption',
  })
  @IsString()
  @IsOptional()
  nonce: string;

  @ApiProperty({
    example: { environment: 'production', createdBy: 'admin-user' },
    description: 'Optional metadata in JSON format',
    required: false,
  })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class CreateManySecretsDto {
  @ApiProperty({
    type: [CreateSecretDto],
    description: 'Array of secrets to create',
    example: [
      {
        keyName: 'API_KEY',
        ciphertext: 'encrypted-api-key',
        nonce: 'nonce-1',
        note: 'Production API key',
        metadata: { environment: 'production' },
      },
      {
        keyName: 'DB_PASSWORD',
        ciphertext: 'encrypted-password',
        nonce: 'nonce-2',
        note: 'Database password',
        metadata: { environment: 'production' },
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSecretDto)
  secrets: CreateSecretDto[];
}
