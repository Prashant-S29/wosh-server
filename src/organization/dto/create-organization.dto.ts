import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsNumber,
  IsObject,
  IsOptional,
  IsBoolean,
  IsArray,
  ArrayNotEmpty,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

// DTO for MKDF configuration
class MKDFConfigDto {
  @ApiProperty({
    example: 2,
    description: 'Number of factors required for key derivation',
  })
  @IsNumber()
  @IsNotEmpty()
  requiredFactors: number;

  @ApiProperty({
    example: ['passphrase', 'device', 'pin'],
    description: 'Array of enabled factors for this organization',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsIn(['passphrase', 'device', 'pin'], { each: true })
  enabledFactors: ('passphrase' | 'device' | 'pin')[];

  @ApiProperty({
    example: true,
    description: 'Whether device fingerprint is required',
  })
  @IsBoolean()
  deviceFingerprintRequired: boolean;
}

// DTO for mkdfConfig wrapper
class MkdfConfigWrapperDto {
  @ApiProperty({
    example: 1,
    description: 'MKDF version number for future compatibility',
  })
  @IsNumber()
  @IsNotEmpty()
  mkdfVersion: number;

  @ApiProperty({
    example: 2,
    description: 'Number of factors required for this organization',
  })
  @IsNumber()
  @IsNotEmpty()
  requiredFactors: number;

  @ApiProperty({
    type: MKDFConfigDto,
    description: 'Factor configuration object',
  })
  @IsObject()
  @Type(() => MKDFConfigDto)
  factorConfig: MKDFConfigDto;
}

// DTO for deviceInfo
class DeviceInfoDto {
  @ApiProperty({
    example: 'Chrome on macOS',
    description: 'Human-readable device name',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  deviceName: string;

  @ApiProperty({
    example: 'KMluisPROOLQu7z4AduoVqFot+66Rt9WxWXIOfPCWc4=',
    description: 'Device fingerprint hash (base64 encoded)',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  deviceFingerprint: string;

  @ApiProperty({
    example: 'Encrypted device key (base64 encoded)',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  encryptedDeviceKey: string;

  @ApiProperty({
    example: 'IV for device key encryption (base64 encoded)',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  encryptionIv: string;

  @ApiProperty({
    example: 'Salt for device key derivation (base64 encoded)',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  keyDerivationSalt: string;

  @ApiProperty({
    example: 'Salt for combining MKDF factors (base64 encoded)',
  })
  @IsString()
  @IsNotEmpty()
  combinationSalt: string;

  @ApiProperty({
    example: 'Salt for PIN factor derivation (base64 encoded)',
    required: true,
  })
  @IsString()
  @IsOptional()
  pinSalt?: string;
}

export class CreateOrganizationDto {
  @ApiProperty({
    example: 'Wosh App',
    description: 'The name of the organization',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    example: 'user-123-uuid',
    description: 'The ID of the organization owner',
  })
  @IsString()
  @IsNotEmpty()
  ownerId: string;

  @ApiProperty({
    example: 'base64-encoded-public-key',
    description: 'The public key for the organization (base64 encoded)',
  })
  @IsString()
  @IsNotEmpty()
  publicKey: string;

  @ApiProperty({
    example: 'base64-encoded-private-key',
    description: 'The encrypted private key (base64 encoded)',
  })
  @IsString()
  @IsNotEmpty()
  privateKeyEncrypted: string;

  @ApiProperty({
    example: 'base64-encoded-salt',
    description: 'The salt used for key derivation (base64 encoded)',
  })
  @IsString()
  @IsNotEmpty()
  keyDerivationSalt: string;

  @ApiProperty({
    example: 'base64-encoded-iv',
    description: 'The initialization vector for encryption (base64 encoded)',
  })
  @IsString()
  @IsNotEmpty()
  encryptionIv: string;

  @ApiProperty({
    type: MkdfConfigWrapperDto,
    description: 'MKDF configuration wrapper object',
  })
  @IsObject()
  @Type(() => MkdfConfigWrapperDto)
  mkdfConfig: MkdfConfigWrapperDto;

  @ApiProperty({
    type: DeviceInfoDto,
    description: 'Device registration object',
  })
  @IsObject()
  @Type(() => DeviceInfoDto)
  deviceInfo: DeviceInfoDto;
}
