// Application Component: AccountDetailPanel — slide-in detail with Mantine v7

import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Shield, Cookie, Gamepad2, Users, LogOut } from 'lucide-react';
import type { Account } from '../../domain/entities/Account';
import { Box, Group, Text, ActionIcon, Avatar, Badge, Button, useMantineTheme, Anchor, Stack } from '@mantine/core';

interface AccountDetailPanelProps {
  account: Account | null;
  onClose: () => void;
  onLaunch: () => void;
  onRefreshCookie: () => void;
  onLogoutAll: () => void;
}

export function AccountDetailPanel({ account, onClose, onLaunch, onRefreshCookie, onLogoutAll }: AccountDetailPanelProps): JSX.Element {
  const theme = useMantineTheme();

  return (
    <AnimatePresence>
      {account && (
        <motion.div
          style={{
            position: 'fixed', right: 0, top: 0, bottom: 0, width: 320,
            backgroundColor: theme.colors.dark[0], borderLeft: `1px solid ${theme.colors.gray[3]}`,
            zIndex: 1000, display: 'flex', flexDirection: 'column',
          }}
          initial={{ x: 320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 320, opacity: 0 }}
          transition={{ duration: 0.15, ease: 'easeInOut' }}
        >
          <Group h={48} px="md" justify="space-between" align="center" style={{ borderBottom: `1px solid ${theme.colors.gray[3]}` }}>
            <Group gap="xs" align="center">
              <Avatar size="sm" style={{ backgroundColor: theme.colors.gray[4], color: theme.colors.gray[6] }}>
                {account.username.charAt(0).toUpperCase()}
              </Avatar>
              <Text size="sm" fw={500} c="white">{account.username}</Text>
            </Group>
            <ActionIcon onClick={onClose} variant="subtle" color="gray" size="sm">
              <X size={16} />
            </ActionIcon>
          </Group>

          <Box style={{ flex: 1, overflowY: 'auto' }} p="md">
            <Stack gap="md">
              <Group gap="xs">
                <Badge variant="light" color="blue">{account.group}</Badge>
                {account.isFavorite && <Badge variant="light" color="yellow">★</Badge>}
              </Group>

              {account.description && <Text size="xs" c="dimmed">{account.description}</Text>}

              <Group gap="xs">
                <Cookie size={14} style={{ color: theme.colors.gray[6] }} />
                <Text size="xs" c="dimmed">Estado de cookie</Text>
              </Group>
              <Badge variant={account.cookieExpiresAt ? 'filled' : 'light'} color={account.cookieExpiresAt ? 'green' : 'red'}>
                {account.cookieExpiresAt ? 'Valida' : 'Desconocida'}
              </Badge>

              <Button variant="filled" color="primary" onClick={onLaunch} leftSection={<Gamepad2 size={14} />}>
                Jugar
              </Button>

              <Group gap="xs">
                <Button variant="outline" color="gray" size="xs" onClick={onRefreshCookie} leftSection={<Cookie size={12} />}>Refresh</Button>
                <Button variant="outline" color="gray" size="xs" onClick={onLogoutAll} leftSection={<LogOut size={12} />}>Logout All</Button>
              </Group>

              <Anchor href={`https://www.roblox.com/users/${account.robloxUserId}/profile`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" color="gray" size="xs" leftSection={<ExternalLink size={12} />}>Ver perfil</Button>
              </Anchor>

              <Box style={{ borderTop: `1px solid ${theme.colors.gray[3]}` }} pt="md">
                <Group gap="xs" mb="xs">
                  <Shield size={14} style={{ color: theme.colors.gray[6] }} />
                  <Text size="xs" c="dimmed">Seguridad</Text>
                </Group>
                <Button variant="outline" color="gray" size="xs" leftSection={<Users size={12} />}>Sesiones activas</Button>
              </Box>
            </Stack>
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
