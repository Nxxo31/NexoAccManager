import * as React from 'react';
import { Server } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ServerBrowser from '../server-browser/ServerBrowser';

export const ServerView: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Server className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold">{t('views.servers.title', 'Servidores')}</h2>
      </div>
      <ServerBrowser />
    </div>
  );
};

ServerView.displayName = 'ServerView';
