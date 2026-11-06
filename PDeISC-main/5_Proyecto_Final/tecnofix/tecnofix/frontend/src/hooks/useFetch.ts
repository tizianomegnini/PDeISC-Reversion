import { useCallback, useEffect, useState, type DependencyList } from 'react';
import { errorMessage } from '../services/api';

/** Carga datos al montar y expone { data, error, loading, reload }. */
export function useFetch<T>(fn: () => Promise<T>, deps: DependencyList = []) {
  const [state, setState] = useState<{ data: T | null; error: string | null; loading: boolean }>({ data: null, error: null, loading: true });
  const load = useCallback(async (silent = false): Promise<void> => {
    if (!silent) setState((s) => ({ ...s, loading: true, error: null }));
    try { setState({ data: await fn(), error: null, loading: false }); }
    catch (error) { setState({ data: null, error: errorMessage(error), loading: false }); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => { load(); }, [load]);
  return { ...state, reload: load };
}
