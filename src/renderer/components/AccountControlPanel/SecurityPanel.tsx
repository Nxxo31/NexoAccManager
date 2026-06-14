import { useState, useEffect, useCallback } from 'react';

interface ActiveSession {
  id: string;
  deviceName: string;
  os: string;
  browser: string;
  location: string;
  createdAt: string;
  lastSeen: string;
}

interface TwoFAStatus {
  enabled: boolean;
  method?: string;
}

interface SecurityPanelProps {
  accountId: string;
}

type Tab = 'sessions' | 'password' | '2fa';

export default function SecurityPanel({ accountId }: SecurityPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('sessions');

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-[#0D0D0D] rounded-lg">
        {(['sessions', 'password', '2fa'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-3 text-xs font-medium rounded-md transition-all ${
              activeTab === tab
                ? 'bg-[#DE350D] text-white'
                : 'text-[#A0A0A0] hover:text-white hover:bg-[#1E1E1E]'
            }`}
          >
            {tab === 'sessions' && 'Sesiones'}
            {tab === 'password' && 'Contraseña'}
            {tab === '2fa' && '2FA'}
          </button>
        ))}
      </div>

      {activeTab === 'sessions' && <SessionsTab accountId={accountId} />}
      {activeTab === 'password' && <PasswordTab accountId={accountId} />}
      {activeTab === '2fa' && <TwoFATab accountId={accountId} />}
    </div>
  );
}

// =============================================================================
// TAB: Sesiones activas
// =============================================================================
function SessionsTab({ accountId }: { accountId: string }) {
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // @ts-expect-error api existe en window via preload
      const result = await window.api.security.getSessions(accountId);
      if (!result.success) {
        setError(result.error || 'Error cargando sesiones');
        return;
      }
      setSessions(result.data || []);
    } catch (e) {
      setError((e as Error).message || 'Error al cargar sesiones');
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleLogout = async (sessionId: string) => {
    setLoadingId(sessionId);
    setActionError(null);
    setActionSuccess(null);
    try {
      // @ts-expect-error api existe en window via preload
      const result = await window.api.security.logoutSession(accountId, sessionId);
      if (!result.success) {
        setActionError(result.error || 'Error cerrando sesión');
        return;
      }
      setActionSuccess('Sesión cerrada correctamente');
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (e) {
      setActionError((e as Error).message || 'Error cerrando sesión');
    } finally {
      setLoadingId(null);
    }
  };

  const handleLogoutAll = async () => {
    setLoadingId('all');
    setActionError(null);
    setActionSuccess(null);
    try {
      // @ts-expect-error api existe en window via preload
      const result = await window.api.security.logoutAll(accountId);
      if (!result.success) {
        setActionError(result.error || 'Error cerrando sesiones');
        return;
      }
      setActionSuccess('Todas las sesiones han sido cerradas');
      setSessions([]);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (e) {
      setActionError((e as Error).message || 'Error cerrando sesiones');
    } finally {
      setLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="w-7 h-7 border-2 border-[#DE350D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-[#A0A0A0]">
          {sessions.length} sesi{sessions.length === 1 ? 'ón' : 'ones'} activa{sessions.length === 1 ? '' : 's'}
        </h4>
        {sessions.length > 1 && (
          <button
            onClick={handleLogoutAll}
            disabled={loadingId !== null}
            className="text-xs text-[#DE350D] hover:text-[#B22A0A] font-medium transition-colors disabled:opacity-50"
          >
            {loadingId === 'all' ? 'Cerrando...' : 'Cerrar todas'}
          </button>
        )}
      </div>

      {sessions.length === 0 && !loading ? (
        <div className="text-center py-8 text-sm text-gray-600">
          No hay sesiones activas
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between p-3 bg-[#161616] border border-[#2A2A2A] rounded-lg group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-[#1E1E1E] flex items-center justify-center flex-shrink-0">
                  <DeviceIcon os={session.os} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {session.deviceName || 'Dispositivo desconocido'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {session.browser} · {session.os} · {session.location}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleLogout(session.id)}
                disabled={loadingId === session.id}
                className="opacity-0 group-hover:opacity-100 ml-3 flex-shrink-0 text-xs text-red-400 hover:text-[#FF4757] font-medium px-3 py-1.5 rounded-md hover:bg-red-500/10 transition-all disabled:opacity-50"
              >
                {loadingId === session.id ? 'Cerrando...' : 'Cerrar'}
              </button>
            </div>
          ))}
        </div>
      )}

      {actionError && (
        <div className="flex items-center gap-2 p-3 bg-[#FF4757]/10 border border-[#FF4757]/30 rounded-lg">
          <svg className="w-4 h-4 text-[#FF4757] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-[#FF4757]">{actionError}</p>
        </div>
      )}

      {actionSuccess && (
        <div className="flex items-center gap-2 p-3 bg-[#2ED573]/10 border border-[#2ED573]/30 rounded-lg">
          <svg className="w-4 h-4 text-[#2ED573] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-xs text-[#2ED573]">{actionSuccess}</p>
        </div>
      )}

      <button
        onClick={loadSessions}
        className="w-full py-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
      >
        Actualizar
      </button>
    </div>
  );
}

// =============================================================================
// TAB: Cambiar contraseña
// =============================================================================
function PasswordTab({ accountId }: { accountId: string }) {
  const [current, setCurrent] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const passwordsMatch = newPass === confirm;
  const isValid = current.length > 0 && newPass.length >= 8 && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      // @ts-expect-error api existe en window via preload
      const result = await window.api.security.changePassword(accountId, current, newPass);
      if (!result.success) {
        setError(result.error || 'Error cambiando contraseña');
        return;
      }
      setSuccess(true);
      setCurrent('');
      setNewPass('');
      setConfirm('');
      setTimeout(() => setSuccess(false), 4000);
    } catch (e) {
      setError((e as Error).message || 'Error al cambiar contraseña');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-[#A0A0A0] mb-1.5 uppercase tracking-wide">
          Contraseña actual
        </label>
        <input
          type="password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm text-[#F5F6FA] placeholder-gray-600 focus:outline-none focus:border-[#DE350D] focus:ring-1 focus:ring-[#DE350D]/30 transition-all"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[#A0A0A0] mb-1.5 uppercase tracking-wide">
          Nueva contraseña
        </label>
        <input
          type="password"
          value={newPass}
          onChange={(e) => setNewPass(e.target.value)}
          placeholder="Mínimo 8 caracteres"
          autoComplete="new-password"
          className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm text-[#F5F6FA] placeholder-gray-600 focus:outline-none focus:border-[#DE350D] focus:ring-1 focus:ring-[#DE350D]/30 transition-all"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[#A0A0A0] mb-1.5 uppercase tracking-wide">
          Confirmar nueva contraseña
        </label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Repite la nueva contraseña"
          autoComplete="new-password"
          className={`w-full bg-[#0D0D0D] border rounded-lg px-3 py-2.5 text-sm text-[#F5F6FA] placeholder-gray-600 focus:outline-none focus:ring-1 transition-all ${
            confirm.length > 0 && !passwordsMatch
              ? 'border-[#FF4757] focus:border-[#FF4757] focus:ring-[#FF4757]/30'
              : 'border-[#2A2A2A] focus:border-[#DE350D] focus:ring-[#DE350D]/30'
          }`}
        />
        {confirm.length > 0 && !passwordsMatch && (
          <p className="text-xs text-[#FF4757] mt-1">Las contraseñas no coinciden</p>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-[#FF4757]/10 border border-[#FF4757]/30 rounded-lg">
          <svg className="w-4 h-4 text-[#FF4757] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-[#FF4757]">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 bg-[#2ED573]/10 border border-[#2ED573]/30 rounded-lg">
          <svg className="w-4 h-4 text-[#2ED573] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-xs text-[#2ED573]">Contraseña cambiada correctamente</p>
        </div>
      )}

      <button
        type="submit"
        disabled={saving || !isValid}
        className="w-full py-2.5 bg-[#DE350D] hover:bg-[#B22A0A] text-white text-sm font-semibold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {saving ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Cambiando...
          </>
        ) : (
          'Cambiar contraseña'
        )}
      </button>
    </form>
  );
}

// =============================================================================
// TAB: 2FA
// =============================================================================
function TwoFATab({ accountId }: { accountId: string }) {
  const [status, setStatus] = useState<TwoFAStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // @ts-expect-error api existe en window via preload
      const result = await window.api.security.get2FA(accountId);
      if (!result.success) {
        setError(result.error || 'Error cargando estado 2FA');
        return;
      }
      setStatus(result.data);
    } catch (e) {
      setError((e as Error).message || 'Error al cargar 2FA');
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleToggle = async () => {
    if (!status) return;
    const newEnabled = !status.enabled;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      // @ts-expect-error api existe en window via preload
      const result = await window.api.security.set2FA(accountId, newEnabled);
      if (!result.success) {
        setError(result.error || 'Error cambiando 2FA');
        return;
      }
      setStatus((prev) => (prev ? { ...prev, enabled: newEnabled } : null));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      setError((e as Error).message || 'Error al cambiar 2FA');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="w-7 h-7 border-2 border-[#DE350D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toggle card */}
      <div className="flex items-center justify-between p-4 bg-[#161616] border border-[#2A2A2A] rounded-lg">
        <div>
          <h4 className="text-sm font-medium text-white">Verificación en dos pasos</h4>
          <p className="text-xs text-gray-500 mt-0.5">
            {status?.enabled
              ? `Activo (${status.method || 'autenticador'})`
              : 'Protege tu cuenta con un segundo factor'}
          </p>
        </div>
        <button
          onClick={handleToggle}
          disabled={saving}
          className={`relative w-12 h-6 rounded-full transition-all disabled:opacity-50 ${
            status?.enabled ? 'bg-[#2ED573]' : 'bg-[#2A2A2A]'
          }`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              status?.enabled ? 'translate-x-6' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {/* Info */}
      <div className="p-4 bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg">
        <p className="text-xs text-gray-500 leading-relaxed">
          {status?.enabled ? (
            <>
              Tu cuenta tiene verificación en dos pasos activada mediante{' '}
              <span className="text-gray-300">{status.method || 'autenticador'}</span>.
              Esto añade una capa extra de seguridad.
            </>
          ) : (
            <>
              Activa la verificación en dos pasos para proteger tu cuenta contra accesos no autorizados.
              Se recomienda usar una app de autenticación como Google Authenticator o Authy.
            </>
          )}
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-[#FF4757]/10 border border-[#FF4757]/30 rounded-lg">
          <svg className="w-4 h-4 text-[#FF4757] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-[#FF4757]">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 bg-[#2ED573]/10 border border-[#2ED573]/30 rounded-lg">
          <svg className="w-4 h-4 text-[#2ED573] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-xs text-[#2ED573]">Configuración actualizada</p>
        </div>
      )}

      <button
        onClick={loadStatus}
        className="w-full py-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
      >
        Actualizar estado
      </button>
    </div>
  );
}

// =============================================================================
// Helpers
// =============================================================================
function DeviceIcon({ os }: { os: string }) {
  const lower = os.toLowerCase();
  if (lower.includes('windows') || lower.includes('win')) {
    return (
      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
      </svg>
    );
  }
  if (lower.includes('mac') || lower.includes('darwin') || lower.includes('ios')) {
    return (
      <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    );
  }
  if (lower.includes('android') || lower.includes('mobile')) {
    return (
      <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    );
  }
  return (
    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}