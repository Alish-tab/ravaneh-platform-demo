import { useCallback, useEffect, useState } from 'react';

import { useExecutionDataPort, useExecutionFixtureVersion } from '@/features/execution/data/useExecutionFixture';
import {
  ExecutionLoadError,
  type ExecutionFollowupNote,
  type ExecutionLoadErrorKind,
  type ExecutionOrder,
  type ExecutionSnapshot,
  type ExecutionSystemNoticeKind,
} from '@/features/execution/model/types';

export type ExecutionQueryStatus = 'loading' | 'ready' | 'error';

export type ExecutionQueryState = {
  status: ExecutionQueryStatus;
  snapshot: ExecutionSnapshot | null;
  errorKind: ExecutionLoadErrorKind | null;
  isRefreshing: boolean;
  systemNotice: ExecutionSystemNoticeKind;
};

function errorKindOf(error: unknown): ExecutionLoadErrorKind {
  if (error instanceof ExecutionLoadError) return error.kind;
  return 'unknown';
}

export function useExecutionData(planId: string | undefined) {
  const port = useExecutionDataPort();
  const version = useExecutionFixtureVersion();
  const [state, setState] = useState<ExecutionQueryState>({
    status: 'loading',
    snapshot: null,
    errorKind: null,
    isRefreshing: false,
    systemNotice: 'none',
  });

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!planId) {
        if (!cancelled) {
          setState({
            status: 'ready',
            snapshot: null,
            errorKind: null,
            isRefreshing: false,
            systemNotice: 'none',
          });
        }
        return;
      }

      if (!cancelled) {
        setState((current) => ({
          ...current,
          status: current.snapshot ? current.status : 'loading',
          isRefreshing: Boolean(current.snapshot) || port.isBackgroundRefreshing(),
        }));
      }

      try {
        const snapshot = await port.getSnapshot(planId);
        if (cancelled) return;
        setState({
          status: 'ready',
          snapshot,
          errorKind: null,
          isRefreshing: port.isBackgroundRefreshing(),
          systemNotice: port.getSystemNotice(),
        });
      } catch (error) {
        if (cancelled) return;
        const kind = errorKindOf(error);
        setState((current) => {
          if (current.snapshot) {
            return {
              ...current,
              isRefreshing: false,
              systemNotice:
                kind === 'server'
                  ? 'server-error'
                  : kind === 'conflict'
                    ? 'conflict'
                    : 'network-error',
            };
          }
          return {
            status: 'error',
            snapshot: null,
            errorKind: kind,
            isRefreshing: false,
            systemNotice: 'none',
          };
        });
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [planId, port, version]);

  const reload = useCallback(async () => {
    if (!planId) return;
    try {
      const snapshot = await port.getSnapshot(planId);
      setState({
        status: 'ready',
        snapshot,
        errorKind: null,
        isRefreshing: port.isBackgroundRefreshing(),
        systemNotice: port.getSystemNotice(),
      });
    } catch (error) {
      const kind = errorKindOf(error);
      setState((current) => {
        if (current.snapshot) {
          return {
            ...current,
            isRefreshing: false,
            systemNotice:
              kind === 'server' ? 'server-error' : kind === 'conflict' ? 'conflict' : 'network-error',
          };
        }
        return {
          status: 'error',
          snapshot: null,
          errorKind: kind,
          isRefreshing: false,
          systemNotice: 'none',
        };
      });
    }
  }, [planId, port]);

  const searchOrder = useCallback(
    async (query: string): Promise<ExecutionOrder | null> => {
      if (!planId) return null;
      return port.searchOrder(planId, query);
    },
    [planId, port],
  );

  const saveFollowupNote = useCallback(
    async (orderId: string, note: string): Promise<ExecutionFollowupNote> => {
      if (!planId) throw new Error('missing-plan');
      return port.saveFollowupNote(planId, orderId, note);
    },
    [planId, port],
  );

  return {
    ...state,
    reload,
    searchOrder,
    saveFollowupNote,
  };
}
