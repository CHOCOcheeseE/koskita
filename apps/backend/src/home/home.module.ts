import { Module } from '@nestjs/common';
import { CLOCK, Clock } from '../common/domain/clock';
import { SplitBillUseCases } from '../split-bill/domain/split-bill.use-cases';
import { SplitBillModule } from '../split-bill/split-bill.module';
import { StudyUseCases } from '../study/domain/study.use-cases';
import { StudyModule } from '../study/study.module';
import { WalletUseCases } from '../wallet/domain/wallet.use-cases';
import { WalletModule } from '../wallet/wallet.module';
import { HomeUseCases } from './domain/home.use-cases';
import { HomeController } from './presentation/home.controller';

@Module({
  imports: [WalletModule, SplitBillModule, StudyModule],
  controllers: [HomeController],
  providers: [
    {
      provide: HomeUseCases,
      inject: [WalletUseCases, SplitBillUseCases, StudyUseCases, CLOCK],
      useFactory: (wallet: WalletUseCases, split: SplitBillUseCases, study: StudyUseCases, clock: Clock) =>
        new HomeUseCases(
          {
            currentBudgetStatus: (id) => wallet.currentBudgetStatus(id),
            splitTotals: (id) => split.splitTotals(id),
            classesToday: (id) => study.classesToday(id),
            upcomingTasks: (id) => study.upcomingTasks(id),
          },
          clock,
        ),
    },
  ],
})
export class HomeModule {}
