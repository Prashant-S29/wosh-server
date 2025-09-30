import { Test, TestingModule } from '@nestjs/testing';
import { SecretController } from './secret.controller';
import { SecretService } from './secret.service';

describe('SecretController', () => {
  let controller: SecretController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SecretController],
      providers: [SecretService],
    }).compile();

    controller = module.get<SecretController>(SecretController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
