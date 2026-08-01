import { useState, useEffect, useRef, useCallback } from 'react';

export default function useDirty(deps, isLoading) {
  const snapshot = useRef(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (snapshot.current === null) {
      snapshot.current = JSON.stringify(deps);
      return;
    }
    setDirty(JSON.stringify(deps) !== snapshot.current);
  }, [isLoading, ...deps]);

  const reset = useCallback(() => {
    snapshot.current = JSON.stringify(deps);
    setDirty(false);
  }, deps);

  return { dirty, reset };
}
