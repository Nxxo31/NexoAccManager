import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  onClose: () => void;
  onLoginBrowser: () => void;
  onImportCookie: (cookie: string) => void;
  onBulkImport: (accounts: { username: string; password: string }[]) => void;
}

const TABS = ['login', 'cookie', 'bulk'] as const;
type Tab = typeof TABS[number];

export function AddAccountModal({ onClose, onLoginBrowser, onImportCookie, onBulkImport }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('login');
  const [cookie, setCookie] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [bulkText, setBulkText] = useState('');

  const handleBulkParse = () => {
    const lines = bulkText.trim().split('\n');
    const accounts = lines.map(line => {
      const [u, p] = line.split(':');
      return { username: u?.trim() || '', password: p?.trim() || '' };
    }).filter(a => a.username && a.password);
    onBulkImport(accounts);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          style={{ background: '#161616', borderRadius: '12px', width: '500px', padding: '24px', color: '#fff' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Agregar Cuenta</h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#A0A0A0', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
          </div>
          <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{ padding: '8px 16px', borderRadius: '6px', border: 'none',
                  background: activeTab === tab ? '#DE350D' : '#1E1E1E',
                  color: activeTab === tab ? '#fff' : '#A0A0A0', cursor: 'pointer', fontSize: '0.875rem' }}>
                {tab === 'login' ? 'Login Browser' : tab === 'cookie' ? 'Import Cookie' : 'Bulk Import'}
              </button>
            ))}
          </div>
          {activeTab === 'login' && (
            <div>
              <p style={{ color: '#A0A0A0', marginBottom: '16px' }}>Abre una ventana del navegador para iniciar sesión en Roblox.</p>
              <button onClick={onLoginBrowser} style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', background: '#DE350D', color: '#fff', cursor: 'pointer' }}>Abrir Navegador</button>
            </div>
          )}
          {activeTab === 'cookie' && (
            <div>
              <textarea value={cookie} onChange={(e) => setCookie(e.target.value)} placeholder="Pega tu cookie .ROBLOSECURITY aquí"
                style={{ width: '100%', height: '80px', background: '#0D0D0D', border: '1px solid #2A2A2A', borderRadius: '6px', color: '#fff', padding: '8px', marginBottom: '12px', resize: 'none' }} />
              <button onClick={() => onImportCookie(cookie)} disabled={!cookie.trim()}
                style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', background: cookie.trim() ? '#DE350D' : '#2A2A2A', color: '#fff', cursor: cookie.trim() ? 'pointer' : 'not-allowed' }}>Importar</button>
            </div>
          )}
          {activeTab === 'bulk' && (
            <div>
              <textarea value={bulkText} onChange={(e) => setBulkText(e.target.value)} placeholder="username:password (uno por línea)"
                style={{ width: '100%', height: '120px', background: '#0D0D0D', border: '1px solid #2A2A2A', borderRadius: '6px', color: '#fff', padding: '8px', marginBottom: '12px', resize: 'none', fontFamily: 'monospace' }} />
              <button onClick={handleBulkParse} disabled={!bulkText.trim()}
                style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', background: bulkText.trim() ? '#DE350D' : '#2A2A2A', color: '#fff', cursor: bulkText.trim() ? 'pointer' : 'not-allowed' }}>Importar Lotes</button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}