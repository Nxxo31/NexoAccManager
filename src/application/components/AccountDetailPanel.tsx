import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  cookie: string;
  userId: number;
  onClose: () => void;
}

const TABS = ['profile', 'security', 'privacy', 'friends', 'notifications'] as const;
type Tab = typeof TABS[number];

export function AccountDetailPanel({ cookie, userId, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('profile');

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
          style={{ background: '#161616', borderRadius: '12px', width: '640px', maxHeight: '80vh', padding: '24px', color: '#fff' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Control de Cuenta</h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#A0A0A0', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
          </div>
          <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeTab === tab ? '#DE350D' : '#1E1E1E',
                  color: activeTab === tab ? '#fff' : '#A0A0A0',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  textTransform: 'capitalize',
                }}
              >
                {tab}
              </button>
            ))}
          </div>
          <div style={{ overflowY: 'auto', maxHeight: '50vh' }}>
            {activeTab === 'profile' && <div>Profile settings for user {userId}</div>}
            {activeTab === 'security' && <div>Security settings</div>}
            {activeTab === 'privacy' && <div>Privacy settings</div>}
            {activeTab === 'friends' && <div>Friends list</div>}
            {activeTab === 'notifications' && <div>Notification preferences</div>}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}