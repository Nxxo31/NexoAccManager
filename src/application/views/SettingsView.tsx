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

  const cardStyle: React.CSSProperties = { padding: 16, background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)' };
  const headingStyle: React.CSSProperties = { fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 };
  const btnStyle: React.CSSProperties = { padding: '6px 12px', color: 'var(--text-primary)', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 };

  return (
    <div style={{ padding: 16, overflow: 'auto', height: '100%' }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Ajustes</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* General */}
        <div style={cardStyle}>
          <h3 style={headingStyle}>General</h3>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text-primary)' }}>
            <input type="checkbox" checked={savePasswords} onChange={(e) => { setSavePasswords(e.target.checked); handleSave('savePasswords', e.target.checked); }} />
            Guardar contraseñas (cifrado AES-256)
          </label>
        </div>

        {/* Botting */}
        <div style={cardStyle}>
          <h3 style={headingStyle}>Botting</h3>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text-primary)', marginBottom: 8 }}>
            <input type="checkbox" checked={botting} onChange={(e) => { setBotting(e.target.checked); handleSave('botting', e.target.checked); }} />
            Activar modo botting
          </label>
          <label style={{ fontSize: 14, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            Intervalo (minutos):
            <input type="number" min={1} max={60} value={bottingInterval} onChange={(e) => setBottingInterval(Number(e.target.value))} style={{ width: 60, padding: 4, background: 'var(--bg)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 4 }} />
          </label>
        </div>

        {/* Advanced */}
        <div style={cardStyle}>
          <h3 style={headingStyle}>Avanzado</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={async () => { const r = await window.api.advanced.exportData(); if (r.success) notify('success', 'Datos exportados'); }} style={{ ...btnStyle, background: 'var(--bg-elevated)' }}>Exportar datos</button>
            <button onClick={async () => { if (confirm('¿Borrar todas las cuentas?')) { await window.api.advanced.deleteAllAccounts(); notify('success', 'Cuentas eliminadas'); } }} style={{ ...btnStyle, background: '#7f1d1d' }}>Borrar todo</button>
            <button onClick={async () => { await window.api.advanced.clearCache(); notify('success', 'Cache limpiado'); }} style={{ ...btnStyle, background: 'var(--bg-elevated)' }}>Limpiar cache</button>
          </div>
        </div>
      </div>
    </div>
  );
}
