import { Test, TestingModule } from '@nestjs/testing';
import { Pm2Service } from './pm2.service';

describe('Pm2Service', () => {
  let service: Pm2Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Pm2Service],
    }).compile();

    service = module.get<Pm2Service>(Pm2Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
