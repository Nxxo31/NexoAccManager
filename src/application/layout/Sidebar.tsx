// Application Layout: Sidebar — Mantine v7

import { useState } from 'react';
import { Users, Globe, Gamepad2, Mail, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import { PAGES, type PageKey, MAX_ACCOUNTS } from '../../config/constants';
import { Box, Text, ActionIcon, Group, NavLink, useMantineTheme } from '@mantine/core';

const NAV: { key: PageKey; icon: typeof Users; label: string }[] = [
  { key: PAGES.ACCOUNTS, icon: Users, label: 'Cuentas' },
  { key: PAGES.SERVERS, icon: Globe, label: 'Servidores' },
  { key: PAGES.GAMES, icon: Gamepad2, label: 'Juegos' },
  { key: PAGES.FRIENDS, icon: Mail, label: 'Amigos' },
  { key: PAGES.SETTINGS, icon: Settings, label: 'Ajustes' },
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
        <ActionIcon onClick={() => setCollapsed(!collapsed)} variant="subtle" color="gray" size="sm">
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </ActionIcon>
      </Group>

      {/* Nav */}
      <Box style={{ flex: 1, padding: '8px 0' }}>
        {NAV.map(({ key, icon: Icon, label }) => (
          <NavLink
            key={key}
            active={activeView === key}
            onClick={() => setView(key)}
            label={collapsed ? '' : label}
            leftSection={<Icon size={18} />}
            style={{ height: 40, margin: '0 6px', borderRadius: 6 }}
          />
        ))}
      </Box>

      {/* Counter */}
      <Box px="sm" py="xs" style={{ borderTop: `1px solid ${theme.colors.gray[3]}` }}>
        <Text size="xs" c="dimmed" ta={collapsed ? 'center' : 'left'}>
          {collapsed ? accountCount : `${accountCount} / ${MAX_ACCOUNTS} cuentas`}
        </Text>
      </Box>
    </Box>
  );
}
