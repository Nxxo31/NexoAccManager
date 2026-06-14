import { useState, useEffect, useCallback } from 'react';

interface NotificationSettings {
  friendRequestNotifications: boolean;
  messageNotifications: boolean;
}

interface NotificationsPanelProps {
  accountId: string;
}

export default function NotificationsPanel({ accountId }: NotificationsPanelProps) {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    if (!accountId) return;
    setLoading(true);
    setError(null);
    try {
      // @ts-expect-error api existe en window via preload
      const result = await window.api.settings.getNotifications(accountId);
      if (!result.success) {
        setError(result.error || 'Error cargando notificaciones');
        return;
      }
      setSettings(result.data || {});
    } catch (e) {
      setError((e as Error).message || 'Error al cargar notificaciones');
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleToggle = async (key: keyof NotificationSettings) => {
    if (!settings) return;
    const newValue = !settings[key];
    setSavingKey(key);
    setError(null);
    setSuccess(null);
    try {
      // @ts-expect-error api existe en window via preload
      const result = await window.api.settings.updateNotification(accountId, key, newValue);
      if (!result.success) {
        setError(result.error || `Error actualizando ${key}`);
        return;
      }
      setSettings((prev) => (prev ? { ...prev, [key]: newValue } : prev));
      setSuccess('Configuracion actualizada');
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError((e as Error).message || `Error al actualizar ${key}`);
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-2 border-[#DE350D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-8 text-sm text-gray-500">
        No se pudieron cargar las configuraciones de notificaciones
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Solicitudes de amistad */}
      <ToggleCard
        title="Solicitudes de amistad"
        description="Recibir notificaciones cuando alguien te envia una solicitud de amistad"
        enabled={settings.friendRequestNotifications}
        saving={savingKey === 'friendRequestNotifications'}
        onToggle={() => handleToggle('friendRequestNotifications')}
      />

      {/* Mensajes */}
      <ToggleCard
        title="Mensajes"
        description="Recibir notificaciones cuando recibes un mensaje nuevo"
        enabled={settings.messageNotifications}
        saving={savingKey === 'messageNotifications'}
        onToggle={() => handleToggle('messageNotifications')}
      />

      {/* Info */}
      <div className="p-4 bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg">
        <p className="text-xs text-gray-500 leading-relaxed">
          Estas configuraciones controlan las notificaciones dentro de Roblox.
          Las notificaciones de la app se manejan desde el sistema operativo.
        </p>
      </div>

      {/* Feedback */}
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-xs text-[#2ED573]">{success}</p>
        </div>
      )}

      <button
        onClick={loadSettings}
        className="w-full py-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
      >
        Actualizar
      </button>
    </div>
  );
}

// =============================================================================
// COMPONENTE: Toggle Card
// =============================================================================
interface ToggleCardProps {
  title: string;
  description: string;
  enabled: boolean;
  saving: boolean;
  onToggle: () => void;
}

function ToggleCard({ title, description, enabled, saving, onToggle }: ToggleCardProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-[#161616] border border-[#2A2A2A] rounded-lg">
      <div className="min-w-0 pr-4">
        <h4 className="text-sm font-medium text-white">{title}</h4>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <button
        onClick={onToggle}
        disabled={saving}
        className={`relative w-12 h-6 rounded-full transition-all flex-shrink-0 disabled:opacity-50 ${
          enabled ? 'bg-[#2ED573]' : 'bg-[#2A2A2A]'
        }`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}
