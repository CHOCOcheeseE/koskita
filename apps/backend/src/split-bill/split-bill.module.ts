import { Module } from '@nestjs/common';
import { cryptoRandomInt, PrismaBillRepository, PrismaGroupRepository } from './data/prisma-split-bill.repositories';
import { BILL_REPOSITORY, BillRepository, GROUP_REPOSITORY, GroupRepository, RANDOM } from './domain/ports';
import type { RandomInt } from './domain/rules';
import { SplitBillUseCases } from './domain/split-bill.use-cases';
import { SplitBillController } from './presentation/split-bill.controller';

@Module({
  controllers: [SplitBillController],
  providers: [
    { provide: GROUP_REPOSITORY, useClass: PrismaGroupRepository },
    { provide: BILL_REPOSITORY, useClass: PrismaBillRepository },
    { provide: RANDOM, useValue: cryptoRandomInt },
    {
      provide: SplitBillUseCases,
      inject: [GROUP_REPOSITORY, BILL_REPOSITORY, RANDOM],
      useFactory: (g: GroupRepository, b: BillRepository, randomInt: RandomInt) => new SplitBillUseCases(g, b, randomInt),
    },
  ],
  exports: [SplitBillUseCases],
})
export class SplitBillModule {}
