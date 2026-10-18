import React, { useState, useEffect } from 'react';
import { authService } from '../../services/authService';
import { useToast } from '../../context/ToastContext';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { ShieldCheck, ToggleRight, ToggleLeft, GraduationCap, Users } from 'lucide-react';

const ROLE_META = {
  TEACHER: { label: 'Teacher Portal', icon: GraduationCap },
  PARENT: { label: 'Parent Portal', icon: Users },
};

export const ModuleAccessPage = () => {
  const [toggles, setToggles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);
  const { addToast } = useToast();

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const res = await authService.getAllFeatureToggles();
      if (res.success && res.data) setToggles(res.data);
    } catch {
      addToast('Failed to load module access settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (t) => {
    const key = `${t.role}:${t.moduleKey}`;
    const nextEnabled = !t.enabled;
    setSavingKey(key);
    // Optimistic update so the switch feels instant
    setToggles((prev) => prev.map((x) => (x.role === t.role && x.moduleKey === t.moduleKey ? { ...x, enabled: nextEnabled } : x)));
    try {
      await authService.setFeatureToggle(t.role, t.moduleKey, nextEnabled);
      addToast(`${t.label} ${nextEnabled ? 'enabled' : 'disabled'} for ${ROLE_META[t.role]?.label || t.role}`, 'success');
    } catch {
      // Revert on failure
      setToggles((prev) => prev.map((x) => (x.role === t.role && x.moduleKey === t.moduleKey ? { ...x, enabled: t.enabled } : x)));
      addToast('Failed to update module access', 'error');
    } finally {
      setSavingKey(null);
    }
  };

  const roles = Object.keys(ROLE_META).filter((role) => toggles.some((t) => t.role === role));

  return (
    <div>
      <Breadcrumb items={[{ label: 'Module Access' }]} />
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h1 className="page-title">Module Access</h1>
          <p className="page-subtitle">
            Turn portal sections on or off for each role. Disabled modules are hidden from that role's portal.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {roles.map((role) => {
            const RoleIcon = ROLE_META[role].icon;
            const roleToggles = toggles.filter((t) => t.role === role);
            return (
              <div className="card" key={role}>
                <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <RoleIcon size={18} className="text-primary" />
                  <h3 className="card-title" style={{ fontSize: '1rem', fontWeight: 600 }}>{ROLE_META[role].label}</h3>
                </div>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Module</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roleToggles.map((t) => {
                        const key = `${t.role}:${t.moduleKey}`;
                        return (
                          <tr key={key}>
                            <td style={{ fontWeight: 600 }}>{t.label}</td>
                            <td>
                              {t.enabled
                                ? <span className="badge badge-success">Enabled</span>
                                : <span className="badge badge-secondary">Disabled</span>}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                className={`btn btn-sm ${t.enabled ? 'btn-secondary' : 'btn-primary'}`}
                                onClick={() => handleToggle(t)}
                                disabled={savingKey === key}
                              >
                                {t.enabled
                                  ? <><ToggleLeft size={14} /> Disable</>
                                  : <><ToggleRight size={14} /> Enable</>}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        <ShieldCheck size={14} /> Changes apply the next time that portal loads or refreshes.
      </div>
    </div>
  );
};
