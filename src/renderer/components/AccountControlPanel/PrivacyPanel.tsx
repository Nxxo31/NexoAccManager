import { useState, useEffect, useCallback } from 'react';

interface PrivacySettings {
  privateMessages: 'none' | 'friends' | 'all';
  chatInGame: 'none' | 'friends' | 'all';
  inventoryPrivacy: 'private' | 'public';
  groupPrivacy: 'private' | 'public';
  lastSeenPrivacy: 'none' | 'friends' | 'all';
  followPrivacy: 'none' | 'friends' | 'all';
}

interface PrivacyPanelProps {
  accountId: string;
}

const PRIVACY_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'friends', label: 'Amigos' },
  { value: 'none', label: 'Nadie' },
] as const;

const BINARY_OPTIONS = [
  { value: 'public', label: 'Publico' },
  { value: 'private', label: 'Privado' },
] as const;

export default function PrivacyPanel({ accountId }: PrivacyPanelProps) {
  const [settings, setSettings] = useState<PrivacySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    if (!accountId) return;
    setLoading(true);
    setError(null);
    try {
      // @ts-expect-error api existe en window via preload
      const result = await window.api.settings.getPrivacy(accountId);
      if (!result.success) {
        setError(result.error || 'Error cargando privacidad');
        return;
      }
      setSettings(result.data || {});
    } catch (e) {
      setError((e as Error).message || 'Error al cargar privacidad');
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleUpdate = async (key: keyof PrivacySettings, value: string) => {
    setSaving((prev) => ({ ...prev, [key]: true }));
    setError(null);
    setSuccess(null);
    try {
      // @ts-expect-error api existe en window via preload
      const result = await window.api.settings.updatePrivacy(accountId, key, value);
      if (!result.success) {
        setError(result.error || `Error actualizando ${key}`);
        return;
      }
      setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
      setSuccess('Configuracion actualizada');
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError((e as Error).message || `Error al actualizar ${key}`);
    } finally {
      setSaving((prev) => ({ ...prev, [key]: false }));
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
        No se pudieron cargar las configuraciones de privacidad
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mensajes privados */}
      <PrivacySection
        title="Quien puede enviarme mensajes"
        description="Controla quien puede enviarte mensajes privados"
        settingKey="privateMessages"
        value={settings.privateMessages}
        options={PRIVACY_OPTIONS}
        saving={saving.privateMessages}
        onChange={handleUpdate}
      />

      {/* Chat en juegos */}
      <PrivacySection
        title="Chat en juegos"
        description="Quien puede chatear contigo dentro de los juegos"
        settingKey="chatInGame"
        value={settings.chatInGame}
        options={PRIVACY_OPTIONS}
        saving={saving.chatInGame}
        onChange={handleUpdate}
      />

      {/* Inventario */}
      <PrivacySection
        title="Privacidad del inventario"
        description="Quien puede ver tus items y Robux"
        settingKey="inventoryPrivacy"
        value={settings.inventoryPrivacy}
        options={BINARY_OPTIONS}
        saving={saving.inventoryPrivacy}
        onChange={handleUpdate}
      />

      {/* Grupos */}
      <PrivacySection
        title="Privacidad de grupos"
        description="Quien puede ver a que grupos perteneces"
        settingKey="groupPrivacy"
        value={settings.groupPrivacy}
        options={BINARY_OPTIONS}
        saving={saving.groupPrivacy}
        onChange={handleUpdate}
      />

      {/* Ultima conexion */}
      <PrivacySection
        title="Ultima conexion"
        description="Quien puede ver cuando estuviste en linea por ultima vez"
        settingKey="lastSeenPrivacy"
        value={settings.lastSeenPrivacy}
        options={PRIVACY_OPTIONS}
        saving={saving.lastSeenPrivacy}
        onChange={handleUpdate}
      />

      {/* Seguidores */}
      <PrivacySection
        title="Quien puede seguirme"
        description="Controla quien puede seguir tu actividad"
        settingKey="followPrivacy"
        value={settings.followPrivacy}
        options={PRIVACY_OPTIONS}
        saving={saving.followPrivacy}
        onChange={handleUpdate}
      />

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
// COMPONENTE: Seccion de privacidad
// =============================================================================
interface PrivacySectionProps {
  title: string;
  description: string;
  settingKey: string;
  value: string;
  options: readonly { value: string; label: string }[];
  saving: boolean | undefined;
  onChange: (key: any, value: string) => void;
}

function PrivacySection({ title, description, settingKey, value, options, saving, onChange }: PrivacySectionProps) {
  return (
    <div className="p-4 bg-[#161616] border border-[#2A2A2A] rounded-lg">
      <div className="mb-3">
        <h4 className="text-sm font-medium text-white">{title}</h4>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <div className="flex gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(settingKey, opt.value)}
            disabled={saving}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all border ${
              value === opt.value
                ? 'bg-[#DE350D] text-white border-[#DE350D]'
                : 'bg-[#0D0D0D] text-gray-400 border-[#2A2A2A] hover:border-gray-500 hover:text-gray-300'
            } disabled:opacity-50`}
          >
            {saving && value === opt.value ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
            ) : (
              opt.label
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
