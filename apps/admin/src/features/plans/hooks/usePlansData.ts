import { useCallback, useEffect, useState } from 'react';

import type { A01ListState, A01PlanViewModel } from '@/features/plans/a01-types';
import {
  usePlansDataPort,
  usePlansFixtureVersion,
} from '@/features/plans/fixture/usePlansFixture';

export function usePlansList() {
  const port = usePlansDataPort();
  const version = usePlansFixtureVersion();
  const [state, setState] = useState<A01ListState>({ status: 'loading' });

  const reload = useCallback(async () => {
    const mode = port.getListMode();
    if (mode === 'loading') {
      setState({ status: 'loading' });
      return;
    }
    setState({ status: 'loading' });
    try {
      const plans = await port.listPlans();
      setState({ status: 'ready', plans });
    } catch {
      setState({
        status: 'error',
        message: 'بارگذاری لیست برنامه‌ها ناموفق بود',
      });
    }
  }, [port]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const mode = port.getListMode();
      if (mode === 'loading') {
        if (!cancelled) setState({ status: 'loading' });
        return;
      }
      if (!cancelled) setState({ status: 'loading' });
      try {
        const plans = await port.listPlans();
        if (!cancelled) setState({ status: 'ready', plans });
      } catch {
        if (!cancelled) {
          setState({
            status: 'error',
            message: 'بارگذاری لیست برنامه‌ها ناموفق بود',
          });
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [port, version]);

  return { state, reload };
}

export function usePlan(planId: string | undefined) {
  const port = usePlansDataPort();
  const version = usePlansFixtureVersion();
  const [plan, setPlan] = useState<A01PlanViewModel | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');

  const reload = useCallback(async () => {
    if (!planId) {
      setStatus('missing');
      setPlan(null);
      return;
    }
    setStatus('loading');
    try {
      const next = await port.getPlan(planId);
      if (!next) {
        setPlan(null);
        setStatus('missing');
        return;
      }
      setPlan(next);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [planId, port]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!planId) {
        if (!cancelled) {
          setPlan(null);
          setStatus('missing');
        }
        return;
      }
      if (!cancelled) setStatus('loading');
      try {
        const next = await port.getPlan(planId);
        if (cancelled) return;
        if (!next) {
          setPlan(null);
          setStatus('missing');
          return;
        }
        setPlan(next);
        setStatus('ready');
      } catch {
        if (!cancelled) setStatus('error');
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [planId, port, version]);

  return { plan, status, reload };
}
