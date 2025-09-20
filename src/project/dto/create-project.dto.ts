import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({
    example: 'Project Name',
    description: 'The name of the project',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    example: 'wrapped_symmetric_key',
    description: 'The public key associated with the project for encryption',
  })
  @IsString()
  @IsNotEmpty()
  wrappedSymmetricKey: string;

  @ApiProperty({
    example: 'organization-id',
    description: 'The id of the organization',
  })
  @IsString()
  @IsNotEmpty()
  organizationId: string;
}
