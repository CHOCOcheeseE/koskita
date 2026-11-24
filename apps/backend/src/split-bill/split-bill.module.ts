import { Module } from '@nestjs/common';
import { mathRandom, PrismaBillRepository, PrismaGroupRepository } from './data/prisma-split-bill.repositories';
import { BILL_REPOSITORY, BillRepository, GROUP_REPOSITORY, GroupRepository, RANDOM } from './domain/ports';
import { SplitBillUseCases } from './domain/split-bill.use-cases';
import { SplitBillController } from './presentation/split-bill.controller';

@Module({
  controllers: [SplitBillController],
  providers: [
    { provide: GROUP_REPOSITORY, useClass: PrismaGroupRepository },
    { provide: BILL_REPOSITORY, useClass: PrismaBillRepository },
    { provide: RANDOM, useValue: mathRandom },
    {
      provide: SplitBillUseCases,
      inject: [GROUP_REPOSITORY, BILL_REPOSITORY, RANDOM],
      useFactory: (g: GroupRepository, b: BillRepository, random: () => number) => new SplitBillUseCases(g, b, random),
    },
  ],
  exports: [SplitBillUseCases],
})
export class SplitBillModule {}
