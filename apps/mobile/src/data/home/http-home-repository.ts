import type { HomeRepository, HomeSummary } from '@/domain/home/home';

import type { ApiClient, Schemas } from '../api/client';

const toHome = (dto: Schemas['HomeSummary']): HomeSummary => dto;

export class HttpHomeRepository implements HomeRepository {
  constructor(private readonly api: ApiClient) {}

  async getToday(): Promise<HomeSummary> {
    return toHome(await this.api.request<Schemas['HomeSummary']>('GET', '/v1/home/today'));
  }
}
