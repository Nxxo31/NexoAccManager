import { useState, useEffect } from 'react';

export default function SettingsPanel() {
  const [multiRoblox, setMultiRoblox] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // @ts-expect-error api existe en window via preload
      const val = await window.api.settings.get('MultiRoblox');
      setMultiRoblox(val === 'true');

      // @ts-expect-error api existe en window via preload
      const key = await window.api.settings.get('ApiKey');
      setApiKey(key || null);
    } catch {
      // Settings no disponibles antes de inicializar
    }
  };

  const toggleMultiRoblox = async () => {
    const next = !multiRoblox;
    try {
      // @ts-expect-error api existe en window via preload
      await window.api.roblox.setMultiRoblox(next);
      setMultiRoblox(next);
    } catch (err) {
      console.error('Error al cambiar MultiRoblox:', err);
    }
  };

  const copyApiKey = async () => {
    if (!apiKey) return;
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-6">Configuración</h2>

      <div className="space-y-6">
        {/* Multi-Roblox */}
        <div className="bg-[#2f3640] rounded-lg p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium mb-1">Multi-Roblox</h3>
              <p className="text-sm text-gray-500">
                Permite tener varias instancias de Roblox abiertas simultáneamente.
                Usa el protocolo roblox:// directamente.
              </p>
            </div>
            <button
              onClick={toggleMultiRoblox}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                multiRoblox ? 'bg-[#2ed573]' : 'bg-gray-600'
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  multiRoblox ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* API Key */}
        <div className="bg-[#2f3640] rounded-lg p-5">
          <h3 className="font-medium mb-1">Clave API</h3>
          <p className="text-sm text-gray-500 mb-3">
            Usa esta clave para controlar NexoAccManager desde scripts externos
            via API REST (puerto 8080).
          </p>
          {apiKey ? (
            <div className="flex gap-2">
              <code className="flex-1 bg-[#1e272e] px-3 py-2 rounded text-xs font-mono text-[#6c5ce7] break-all">
                {apiKey}
              </code>
              <button
                onClick={copyApiKey}
                className="px-3 py-2 bg-[#6c5ce7]/20 text-[#6c5ce7] rounded text-xs hover:bg-[#6c5ce7]/30 transition-colors whitespace-nowrap"
              >
                {copied ? '¡Copiado!' : 'Copiar'}
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">
              API key no disponible. Ejecuta la aplicación para generarla.
            </p>
          )}
        </div>

        {/* Acerca de */}
        <div className="bg-[#2f3640] rounded-lg p-5">
          <h3 className="font-medium mb-1">Acerca de</h3>
          <div className="text-sm text-gray-500 space-y-1">
            <p><strong>NexoAccManager</strong> v1.0.0</p>
            <p>Gestión segura de cuentas de Roblox.</p>
            <p>Licencia: GPL-3.0</p>
          </div>
        </div>
      </div>
    </div>
  );
}