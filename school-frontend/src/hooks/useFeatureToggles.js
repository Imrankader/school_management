import { useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

// Fetches the admin-controlled module on/off switches for a role (TEACHER or PARENT).
// A module is treated as enabled until the toggles finish loading, and if the request
// fails, so a slow/broken network never hides a module that's actually allowed.
// Pass a falsy role (e.g. for a user whose role doesn't need gating) to skip the fetch.
export function useFeatureToggles(role) {
  const [toggles, setToggles] = useState(null);
  const [loading, setLoading] = useState(!!role);

  useEffect(() => {
    if (!role) {
      setToggles(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    authService.getFeatureToggles(role)
      .then((res) => {
        if (!cancelled && res.success && res.data) setToggles(res.data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [role]);

  const isEnabled = useCallback((moduleKey) => {
    if (!toggles) return true;
    const entry = toggles.find((t) => t.moduleKey === moduleKey);
    return entry ? entry.enabled : true;
  }, [toggles]);

  return { toggles, loading, isEnabled };
}
