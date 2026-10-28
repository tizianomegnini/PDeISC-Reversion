import { useCallback, useEffect, useState } from 'react';

/** Carga datos al montar y expone { data, error, loading, reload }. */
export function useFetch(fn, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const load = useCallback(async (silent = false) => {
    if (!silent) setState((s) => ({ ...s, loading: true, error: null }));
    try { setState({ data: await fn(), error: null, loading: false }); }
    catch (e) { setState({ data: null, error: e.message, loading: false }); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => { load(); }, [load]);
  return { ...state, reload: load };
}
