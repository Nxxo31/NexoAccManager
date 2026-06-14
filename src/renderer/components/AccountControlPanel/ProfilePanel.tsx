import { useState, useEffect, useCallback } from 'react';

interface UserProfile {
  displayName: string;
  description: string;
  username: string;
  userId: number;
}

interface ProfilePanelProps {
  accountId: string;
  robloxUserId?: number;
}

export default function ProfilePanel({ accountId, robloxUserId }: ProfilePanelProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!accountId) return;
    setLoading(true);
    setError(null);
    try {
      // @ts-expect-error api existe en window via preload
      const result = await window.api.account.getProfile(accountId);
      if (!result.success) {
        setError(result.error || 'Error cargando perfil');
        return;
      }
      const data = result.data as UserProfile;
      setProfile(data);
      setDisplayName(data.displayName || '');
      setDescription(data.description || '');

      if (data.userId) {
        // @ts-expect-error api existe en window via preload
        const thumbResult = await window.api.account.getAvatarThumbnail(data.userId);
        if (thumbResult.success && thumbResult.data) {
          setAvatarUrl(thumbResult.data);
        }
      }
    } catch (e) {
      setError((e as Error).message || 'Error al cargar el perfil');
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      // @ts-expect-error api existe en window via preload
      const result = await window.api.account.updateProfile(accountId, {
        displayName: displayName.trim(),
        description: description.trim(),
      });
      if (!result.success) {
        setError(result.error || 'Error guardando perfil');
        return;
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      setError((e as Error).message || 'Error al guardar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges =
    profile &&
    (displayName !== (profile.displayName || '') ||
      description !== (profile.description || ''));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-2 border-[#DE350D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Avatar + Info header */}
      <div className="flex items-start gap-5 p-4 bg-[#161616] border border-[#2A2A2A] rounded-lg">
        <div className="flex-shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-20 h-20 rounded-full object-cover ring-2 ring-[#DE350D]/40"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-[#2A2A2A] flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          {profile && (
            <>
              <h3 className="text-lg font-semibold text-white truncate">
                {profile.displayName || profile.username}
              </h3>
              <p className="text-sm text-[#A0A0A0] truncate">@{profile.username}</p>
              {profile.userId > 0 && (
                <p className="text-xs text-gray-600 mt-1 font-mono">
                  ID: {profile.userId}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Formulario */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-[#A0A0A0] mb-1.5 uppercase tracking-wide">
            Display Name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Tu nombre visible"
            maxLength={20}
            className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm text-[#F5F6FA] placeholder-gray-600 focus:outline-none focus:border-[#DE350D] focus:ring-1 focus:ring-[#DE350D]/30 transition-all"
          />
          <p className="text-xs text-gray-600 mt-1 text-right">{displayName.length}/20</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#A0A0A0] mb-1.5 uppercase tracking-wide">
            DescripciÃ³n
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Cuéntanos sobre ti..."
            maxLength={1000}
            rows={4}
            className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm text-[#F5F6FA] placeholder-gray-600 focus:outline-none focus:border-[#DE350D] focus:ring-1 focus:ring-[#DE350D]/30 transition-all resize-none"
          />
          <p className="text-xs text-gray-600 mt-1 text-right">{description.length}/1000</p>
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-xs text-[#2ED573]">Perfil actualizado correctamente</p>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="w-full py-2.5 bg-[#DE350D] hover:bg-[#B22A0A] text-white text-sm font-semibold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M5 13l4 4L19 7" />
              </svg>
              Guardar cambios
            </>
          )}
        </button>
      </div>
    </div>
  );
}