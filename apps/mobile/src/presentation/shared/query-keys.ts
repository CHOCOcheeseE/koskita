/** Query key TanStack Query per modul. */
export const queryKeys = {
  me: ['profile', 'me'] as const,
  home: ['home', 'today'] as const,
  wallet: {
    all: ['wallet'] as const,
    categories: ['wallet', 'categories'] as const,
    transactions: (month: string) => ['wallet', 'transactions', month] as const,
    transaction: (id: string) => ['wallet', 'transaction', id] as const,
    summary: (month: string) => ['wallet', 'summary', month] as const,
    budget: (month: string) => ['wallet', 'budget', month] as const,
  },
  split: {
    all: ['split-bill'] as const,
    groups: ['split-bill', 'groups'] as const,
    group: (id: string) => ['split-bill', 'group', id] as const,
    balances: (id: string) => ['split-bill', 'balances', id] as const,
    bills: (groupId: string, status: string) => ['split-bill', 'bills', groupId, status] as const,
    bill: (id: string) => ['split-bill', 'bill', id] as const,
  },
  study: {
    all: ['study'] as const,
    schedules: ['study', 'schedules'] as const,
    schedule: (id: string) => ['study', 'schedule', id] as const,
    tasks: (status: string) => ['study', 'tasks', status] as const,
    task: (id: string) => ['study', 'task', id] as const,
  },
};
