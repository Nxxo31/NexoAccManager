import { useState } from 'react';
import ProfilePanel from './ProfilePanel';
import SecurityPanel from './SecurityPanel';
import PrivacyPanel from './PrivacyPanel';
import FriendsPanel from './FriendsPanel';
import NotificationsPanel from './NotificationsPanel';

interface Account {
  id: string;
  username: string;
  displayName?: string;
  group: string;
  description?: string;
  lastUsed: Date;
  createdAt: Date;
  robloxUserId?: number;
}

interface AccountControlPanelProps {
  account: Account;
  onClose: () => void;
}

type Tab = 'profile' | 'security' | 'privacy' | 'friends' | 'notifications';

export default function AccountControlPanel({ account, onClose }: AccountControlPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2A2A] bg-[#161616]">
          <div>
            <h2 className="text-base font-semibold text-white">
              Account Control Panel
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {account.displayName || account.username} · @{account.username}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#2A2A2A] text-gray-500 hover:text-white transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 px-6 pt-4 bg-[#161616]">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-medium transition-all border-b-2 ${
              activeTab === 'profile'
                ? 'text-[#DE350D] border-[#DE350D] bg-[#1E1E1E]'
                : 'text-gray-500 border-transparent hover:text-gray-300'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Perfil
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-medium transition-all border-b-2 ${
              activeTab === 'security'
                ? 'text-[#DE350D] border-[#DE350D] bg-[#1E1E1E]'
                : 'text-gray-500 border-transparent hover:text-gray-300'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Seguridad
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-medium transition-all border-b-2 ${
              activeTab === 'privacy'
                ? 'text-[#DE350D] border-[#DE350D] bg-[#1E1E1E]'
                : 'text-gray-500 border-transparent hover:text-gray-300'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Privacidad
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-medium transition-all border-b-2 ${
              activeTab === 'friends'
                ? 'text-[#DE350D] border-[#DE350D] bg-[#1E1E1E]'
                : 'text-gray-500 border-transparent hover:text-gray-300'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Amigos
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-medium transition-all border-b-2 ${
              activeTab === 'notifications'
                ? 'text-[#DE350D] border-[#DE350D] bg-[#1E1E1E]'
                : 'text-gray-500 border-transparent hover:text-gray-300'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            Notificaciones
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'profile' && (
            <ProfilePanel
              accountId={account.id}
              robloxUserId={account.robloxUserId}
            />
          )}
          {activeTab === 'security' && (
            <SecurityPanel accountId={account.id} />
          )}
          {activeTab === 'privacy' && (
            <PrivacyPanel accountId={account.id} />
          )}
          {activeTab === 'friends' && (
            <FriendsPanel accountId={account.id} />
          )}
          {activeTab === 'notifications' && (
            <NotificationsPanel accountId={account.id} />
          )}
        </div>
      </div>
    </div>
  );
}