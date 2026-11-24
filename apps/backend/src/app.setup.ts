import { INestApplication } from '@nestjs/common';
import { HttpErrorFilter } from './common/presentation/http-exception.filter';
import { createValidationPipe } from './common/presentation/validation';

/** Pengaturan bersama untuk main.ts dan tes e2e. */
export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix('v1');
  app.useGlobalPipes(createValidationPipe());
  app.useGlobalFilters(new HttpErrorFilter());
}
