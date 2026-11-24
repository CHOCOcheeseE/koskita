import { Module } from '@nestjs/common';
import { CLOCK, Clock } from '../common/domain/clock';
import { PrismaBudgetRepository, PrismaTransactionRepository } from './data/prisma-wallet.repositories';
import { BUDGET_REPOSITORY, BudgetRepository, TRANSACTION_REPOSITORY, TransactionRepository } from './domain/ports';
import { WalletUseCases } from './domain/wallet.use-cases';
import { WalletController } from './presentation/wallet.controller';

@Module({
  controllers: [WalletController],
  providers: [
    { provide: TRANSACTION_REPOSITORY, useClass: PrismaTransactionRepository },
    { provide: BUDGET_REPOSITORY, useClass: PrismaBudgetRepository },
    {
      provide: WalletUseCases,
      inject: [TRANSACTION_REPOSITORY, BUDGET_REPOSITORY, CLOCK],
      useFactory: (t: TransactionRepository, b: BudgetRepository, clock: Clock) => new WalletUseCases(t, b, clock),
    },
  ],
  exports: [WalletUseCases],
})
export class WalletModule {}
