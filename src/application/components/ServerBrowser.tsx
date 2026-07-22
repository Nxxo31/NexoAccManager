import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  onClose: () => void;
  onSearch: (placeId: string) => void;
  servers: { id: string; players: number; maxPlayers: number; ping: number }[];
  onJoin: (accountId: string, placeId: string, jobId: string) => void;
}

export function ServerBrowser({ onClose, onSearch, servers, onJoin }: Props) {
  const [placeId, setPlaceId] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        onClick={onClose}>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          style={{ background: '#161616', borderRadius: '12px', width: '600px', maxHeight: '80vh', padding: '24px', color: '#fff', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Servidores</h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#A0A0A0', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <input value={placeId} onChange={(e) => setPlaceId(e.target.value)} placeholder="Place ID"
              style={{ flex: 1, background: '#0D0D0D', border: '1px solid #2A2A2A', borderRadius: '6px', color: '#fff', padding: '8px 12px' }} />
            <button onClick={() => onSearch(placeId)} disabled={!placeId.trim()}
              style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', background: placeId.trim() ? '#DE350D' : '#2A2A2A', color: '#fff', cursor: placeId.trim() ? 'pointer' : 'not-allowed' }}>Buscar</button>
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {servers.length === 0 ? (
              <p style={{ color: '#A0A0A0', textAlign: 'center', padding: '2rem' }}>No hay servidores. Busca un Place ID.</p>
            ) : (
              servers.map((server, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#1E1E1E', borderRadius: '6px', marginBottom: '8px' }}>
                  <div>
                    <span style={{ color: '#fff' }}>{server.players}/{server.maxPlayers} jugadores</span>
                    <span style={{ color: '#A0A0A0', marginLeft: '8px' }}>{server.ping}ms</span>
                  </div>
                  <button onClick={() => onJoin(selectedAccountId, placeId, server.id)}
                    style={{ padding: '6px 16px', borderRadius: '6px', border: 'none', background: '#DE350D', color: '#fff', cursor: 'pointer' }}>Unirse</button>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}