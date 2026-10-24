import { useSyncExternalStore } from 'react';

const noopSubscribe = () => () => {};

/** True only after hydration on the client; false during SSR and the hydration pass. */
export function useMounted(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}
