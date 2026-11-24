export interface HealthChecker {
  isDatabaseUp(): Promise<boolean>;
}

export const HEALTH_CHECKER = Symbol('HEALTH_CHECKER');
