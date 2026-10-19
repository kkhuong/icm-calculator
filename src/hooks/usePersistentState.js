import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// An object of screen state that is saved on the device under `key` and restored on launch.
// Returns [state, update, loaded]. `update` takes a partial object, or a function of the current
// state returning one, and merges it in. Saved data is merged over `initial`, so fields added in
// later versions get their defaults. Render nothing until `loaded`, or the restore would overwrite
// whatever the user typed in the meantime.
export default function usePersistentState(key, initial) {
  const [state, setState] = useState(initial);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(key)
      .then((raw) => {
        if (!raw) return;
        try {
          const saved = JSON.parse(raw);
          setState((cur) => ({ ...cur, ...saved }));
        } catch {}
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [key]);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(key, JSON.stringify(state)).catch(() => {});
  }, [key, state, loaded]);

  const update = useCallback(
    (patch) => setState((cur) => ({ ...cur, ...(typeof patch === 'function' ? patch(cur) : patch) })),
    [],
  );
  return [state, update, loaded];
}
