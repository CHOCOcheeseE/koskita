import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { USER_REPOSITORY, UserRepository } from '../auth/domain/ports';
import { ProfileUseCases } from './domain/profile.use-cases';
import { ProfileController } from './presentation/profile.controller';

@Module({
  imports: [AuthModule],
  controllers: [ProfileController],
  providers: [
    {
      provide: ProfileUseCases,
      inject: [USER_REPOSITORY],
      useFactory: (users: UserRepository) => new ProfileUseCases(users),
    },
  ],
})
export class ProfileModule {}
