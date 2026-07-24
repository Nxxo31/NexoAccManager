// Application Layout: Sidebar — Mantine v7

import { useState } from 'react';
import { Users, Globe, Gamepad2, Mail, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import { PAGES, type PageKey, MAX_ACCOUNTS } from '../../config/constants';
import { Box, Text, ActionIcon, Group, NavLink, useMantineTheme } from '@mantine/core';
import { t } from '../../config/i18n';

const NAV: { key: PageKey; icon: typeof Users; labelKey: string }[] = [
  { key: PAGES.ACCOUNTS, icon: Users, labelKey: 'nav.accounts' },
  { key: PAGES.SERVERS, icon: Globe, labelKey: 'nav.servers' },
  { key: PAGES.GAMES, icon: Gamepad2, labelKey: 'nav.games' },
  { key: PAGES.FRIENDS, icon: Mail, labelKey: 'nav.friends' },
  { key: PAGES.SETTINGS, icon: Settings, labelKey: 'nav.settings' },
];

export function Sidebar({ accountCount }: { accountCount: number }): JSX.Element {
  const activeView = useUIStore((s) => s.activeView);
  const setView = useUIStore((s) => s.setView);
  const [collapsed, setCollapsed] = useState(false);
  const theme = useMantineTheme();

  return (
    <Box
      style={{
        width: collapsed ? 64 : 208,
        height: '100%',
        flexShrink: 0,
        backgroundColor: theme.colors.dark[0],
        borderRight: `1px solid ${theme.colors.gray[3]}`,
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 150ms ease',
      }}
    >
      {/* Logo */}
      <Group h={48} px="sm" justify="space-between" style={{ borderBottom: `1px solid ${theme.colors.gray[3]}` }}>
        {!collapsed && <Text size="sm" fw={600} c="white">NX-Manager</Text>}
        <ActionIcon onClick={() => setCollapsed(!collapsed)} variant="subtle" color="gray" size="sm" aria-label={collapsed ? t('sidebar.expand') : t('sidebar.collapse')}>
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </ActionIcon>
      </Group>

      {/* Nav */}
      <Box style={{ flex: 1, padding: '8px 0' }}>
        {NAV.map(({ key, icon: Icon, labelKey }) => (
          <NavLink
            key={key}
            active={activeView === key}
            onClick={() => setView(key)}
            label={collapsed ? '' : t(labelKey)}
            leftSection={<Icon size={18} />}
            style={{ height: 40, margin: '0 6px', borderRadius: 6 }}
            // A-005: Mantener aria-label cuando label=""
            aria-label={t(labelKey)}
          />
        ))}
      </Box>

      {/* Counter */}
      <Box px="sm" py="xs" style={{ borderTop: `1px solid ${theme.colors.gray[3]}` }}>
        <Text size="xs" c="dimmed" ta={collapsed ? 'center' : 'left'}>
          {collapsed ? accountCount : t('sidebar.count', { count: accountCount, max: MAX_ACCOUNTS })}
        </Text>
      </Box>
    </Box>
  );
}
