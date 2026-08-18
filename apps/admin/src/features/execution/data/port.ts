import type {
  ExecutionFollowupNote,
  ExecutionOrder,
  ExecutionSnapshot,
  ExecutionSystemNoticeKind,
} from '@/features/execution/model/types';

/**
 * Temporary A04 adapter (DEV / frontend only).
 *
 *   UI → ExecutionDataPort → fixture implementation
 * Future:
 *   UI → TanStack Query → generated OpenAPI client
 *
 * Not a Backend contract. Do not invent OpenAPI payloads here.
 */
export type ExecutionDataPort = {
  subscribe: (listener: () => void) => () => void;
  getVersion: () => number;
  getSnapshot: (planId: string) => Promise<ExecutionSnapshot | null>;
  searchOrder: (planId: string, query: string) => Promise<ExecutionOrder | null>;
  saveFollowupNote: (
    planId: string,
    orderId: string,
    note: string,
  ) => Promise<ExecutionFollowupNote>;
  getSystemNotice: () => ExecutionSystemNoticeKind;
  isBackgroundRefreshing: () => boolean;
};
