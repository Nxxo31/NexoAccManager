// Application Layout: TopBar — search + add + theme toggle with Mantine v7

import { Search, Plus, Moon, Sun } from 'lucide-react';
import { Group, TextInput, Button, ActionIcon, useMantineColorScheme } from '@mantine/core';
import type { PageKey } from '../../config/constants';
import { t } from '../../config/i18n';

interface TopBarProps {
  onAddAccount: () => void;
  searchQuery: string;
  onSearch: (q: string) => void;
  activeView: PageKey;
}

export function TopBar({ onAddAccount, searchQuery, onSearch, activeView }: TopBarProps): JSX.Element {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  return (
    <Group h={48} px="md" gap="sm" align="center" style={{ flexShrink: 0 }}>
      {/* U-004: Hide search when activeView !== 'accounts' */}
      {activeView === 'accounts' && (
        <TextInput
          leftSection={<Search size={14} />}
          placeholder={t('topbar.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
          size="sm"
          style={{ maxWidth: 300, flex: 1 }}
          aria-label={t('topbar.searchAria')}
        />
      )}
      <div style={{ flex: 1 }} />
      <Button variant="filled" color="primary" size="sm" leftSection={<Plus size={14} />} onClick={onAddAccount}>
        {t('topbar.add')}
      </Button>
      <ActionIcon variant="subtle" color={colorScheme === 'dark' ? 'yellow' : 'gray'} onClick={toggleColorScheme} aria-label={t('topbar.toggleTheme')}>
        {colorScheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      </ActionIcon>
    </Group>
  );
}
