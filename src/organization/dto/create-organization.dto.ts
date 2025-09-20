import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class CreateOrganizationDto {
  @ApiProperty({
    example: 'Organization Name',
    description: 'The name of the organization',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    example: 'user-public-key',
    description:
      'The public key associated with the organization for encryption',
  })
  @IsString()
  @IsNotEmpty()
  publicKey: string;

  @ApiProperty({
    example: 'owner-id',
    description: 'The id of the current user',
  })
  @IsString()
  @IsNotEmpty()
  ownerId: string;

  @ApiProperty({
    example: 'private_key_encrypted',
    description: 'The encrypted private key',
  })
  @IsString()
  @IsNotEmpty()
  privateKeyEncrypted: string;

  @ApiProperty({
    example: 'key_derivation_salt',
    description: 'The salt used for key derivation',
  })
  @IsString()
  @IsNotEmpty()
  keyDerivationSalt: string;

  @ApiProperty({
    example: 'encryption_iv',
    description: 'The initialization vector used for encryption',
  })
  @IsString()
  @IsNotEmpty()
  encryptionIv: string;
}
