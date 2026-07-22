// Application View: SettingsView — theme, language, botting, advanced toggles

import { useState } from 'react';
import { useUIStore } from '../store/uiStore';

export function SettingsView(): JSX.Element {
  const notify = useUIStore((s) => s.notify);
  const [savePasswords, setSavePasswords] = useState(false);
  const [botting, setBotting] = useState(false);
  const [bottingInterval, setBottingInterval] = useState(5);

  const handleSave = async (key: string, value: boolean) => {
    await window.api.settings.set(key, value);
    notify('success', `Configuración guardada: ${key}`);
  };

  return (
    <div style={{ padding: 16, overflow: 'auto', height: '100%' }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: '#eee', marginBottom: 16 }}>Ajustes</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* General */}
        <div style={{ padding: 16, background: '#1a1a2e', borderRadius: 8, border: '1px solid #2a2a4e' }}>
          <h3 style={{ fontSize: 14, color: '#aaa', marginBottom: 12 }}>General</h3>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#ddd' }}>
            <input type="checkbox" checked={savePasswords} onChange={(e) => { setSavePasswords(e.target.checked); handleSave('savePasswords', e.target.checked); }} />
            Guardar contraseñas (cifrado AES-256)
          </label>
        </div>

        {/* Botting */}
        <div style={{ padding: 16, background: '#1a1a2e', borderRadius: 8, border: '1px solid #2a2a4e' }}>
          <h3 style={{ fontSize: 14, color: '#aaa', marginBottom: 12 }}>Botting</h3>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#ddd', marginBottom: 8 }}>
            <input type="checkbox" checked={botting} onChange={(e) => { setBotting(e.target.checked); handleSave('botting', e.target.checked); }} />
            Activar modo botting
          </label>
          <label style={{ fontSize: 14, color: '#ddd', display: 'flex', alignItems: 'center', gap: 8 }}>
            Intervalo (minutos):
            <input type="number" min={1} max={60} value={bottingInterval} onChange={(e) => setBottingInterval(Number(e.target.value))} style={{ width: 60, padding: 4, background: '#0d0d1a', color: '#eee', border: '1px solid #333', borderRadius: 4 }} />
          </label>
        </div>

        {/* Advanced */}
        <div style={{ padding: 16, background: '#1a1a2e', borderRadius: 8, border: '1px solid #2a2a4e' }}>
          <h3 style={{ fontSize: 14, color: '#aaa', marginBottom: 12 }}>Avanzado</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={async () => { const r = await window.api.advanced.exportData(); if (r.success) notify('success', 'Datos exportados'); }} style={{ padding: '6px 12px', background: '#2a2a4e', color: '#eee', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>Exportar datos</button>
            <button onClick={async () => { if (confirm('¿Borrar todas las cuentas?')) { await window.api.advanced.deleteAllAccounts(); notify('success', 'Cuentas eliminadas'); } }} style={{ padding: '6px 12px', background: '#7f1d1d', color: '#eee', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>Borrar todo</button>
            <button onClick={async () => { await window.api.advanced.clearCache(); notify('success', 'Cache limpiado'); }} style={{ padding: '6px 12px', background: '#2a2a4e', color: '#eee', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>Limpiar cache</button>
          </div>
        </div>
      </div>
    </div>
  );
}
