import { Global, Module } from '@nestjs/common';
import { CLOCK, SystemClock } from './domain/clock';
import { PrismaService } from './data/prisma.service';

@Global()
@Module({
  providers: [PrismaService, { provide: CLOCK, useClass: SystemClock }],
  exports: [PrismaService, CLOCK],
})
export class CommonModule {}
