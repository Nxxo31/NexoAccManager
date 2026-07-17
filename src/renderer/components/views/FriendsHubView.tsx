import * as React from 'react';
import { User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const FriendsHubView: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <User className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold">{t('views.friends.title', 'Amigos')}</h2>
      </div>
      <p className="text-muted-foreground mb-4">
        {t('views.friends.comingSoon', 'Funcionalidad de amigos en desarrollo')}
      </p>
    </div>
  );
};

FriendsHubView.displayName = 'FriendsHubView';