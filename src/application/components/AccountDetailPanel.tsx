// Application Component: AccountDetailPanel — full detail with profile/security/privacy tabs — Mantine v7

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, Shield, User, Bell, Lock, Key, LogOut } from 'lucide-react';
import {
  Group, Stack, Text, Badge, Button, ActionIcon, Card, ScrollArea, Skeleton,
  Image as MantineImage, Avatar, Tabs, TextInput, Textarea, Switch, PasswordInput,
  Divider, Code as CodeIcon,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import type { Account } from '../../domain/entities/Account';

interface Outfit { id: number; name: string; thumbnailUrl?: string; }
interface SessionInfo { id: string; deviceInfo?: string; lastUpdated?: string; }

interface AccountDetailPanelProps {
  account: Account;
  onClose: () => void;
  onLaunch: () => void;
  onRefreshCookie: () => void;
  onLogoutAll: () => void;
}

export function AccountDetailPanel({ account, onClose, onLaunch, onRefreshCookie, onLogoutAll }: AccountDetailPanelProps): JSX.Element {
  const [activeTab, setActiveTab] = useState<string>('outfits');
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loadingOutfits, setLoadingOutfits] = useState(false);

  // Profile state
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Security state
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Privacy state
  const [privacySettings, setPrivacySettings] = useState<Record<string, boolean | string>>({});

  // Notifications state
  const [notifSettings, setNotifSettings] = useState<Record<string, boolean>>({});

  const loadOutfits = async () => {
    setLoadingOutfits(true);
    try {
      const result = await window.api.byAccount.outfits(account.id);
      if (result.success) setOutfits(Array.isArray(result.data) ? result.data : []);
      else setOutfits([]);
    } catch { setOutfits([]); }
    setLoadingOutfits(false);
  };

  const loadProfile = async () => {
    const r = await window.api.account.profile.get(account.id);
    // Note: byAccount returns profile data — we use the generic IPC
    if (r.success && r.data) {
      const p = r.data as { displayName?: string; description?: string };
      setDisplayName(p.displayName ?? account.username);
      setDescription(p.description ?? '');
    }
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    const r = await window.api.account.profile.update(account.id, { displayName, description });
    if (r.success) notifications.show({ message: 'Perfil actualizado', color: 'green' });
    else notifications.show({ message: r.error ?? 'Error', color: 'red' });
    setSavingProfile(false);
  };

  const loadSecurity = async () => {
    const twoFA = await window.api.byAccount.twoFA(account.id);
    if (twoFA.success && twoFA.data) setTwoFAEnabled(Boolean(twoFA.data));
    const sess = await window.api.byAccount.sessions(account.id);
    if (sess.success && Array.isArray(sess.data)) setSessions(sess.data as SessionInfo[]);
  };

  const toggle2FA = async (enable: boolean) => {
    const r = await window.api.byAccount.twoFAToggle(account.id, enable);
    if (r.success) { setTwoFAEnabled(enable); notifications.show({ message: `2FA ${enable ? 'activado' : 'desactivado'}`, color: 'green' }); }
    else notifications.show({ message: r.error ?? 'Error', color: 'red' });
  };

  const changePassword = async () => {
    if (!currentPassword || !newPassword) return;
    setChangingPassword(true);
    const r = await window.api.byAccount.password(account.id, currentPassword, newPassword);
    if (r.success) { notifications.show({ message: 'Contrasena cambiada', color: 'green' }); setCurrentPassword(''); setNewPassword(''); }
    else notifications.show({ message: r.error ?? 'Error al cambiar contrasena', color: 'red' });
    setChangingPassword(false);
  };

  const logoutSession = async (sessionId: string) => {
    const r = await window.api.byAccount.logout(account.id, sessionId);
    if (r.success) { notifications.show({ message: 'Sesion cerrada', color: 'green' }); loadSecurity(); }
    else notifications.show({ message: r.error ?? 'Error', color: 'red' });
  };

  const loadPrivacy = async () => {
    const r = await window.api.byAccount.privacyGet(account.id);
    if (r.success && r.data) setPrivacySettings(r.data as Record<string, boolean | string>);
  };

  const updatePrivacy = async (key: string, value: string | boolean) => {
    const r = await window.api.byAccount.privacyUpdate(account.id, key, value);
    if (r.success) {
      setPrivacySettings(prev => ({ ...prev, [key]: value }));
      notifications.show({ message: 'Privacidad actualizada', color: 'green' });
    } else notifications.show({ message: r.error ?? 'Error', color: 'red' });
  };

  const loadNotifSettings = async () => {
    const r = await window.api.byAccount.notificationsGet(account.id);
    if (r.success && r.data) setNotifSettings(r.data as Record<string, boolean>);
  };

  const updateNotif = async (key: string, value: boolean) => {
    const r = await window.api.byAccount.notificationsUpdate(account.id, key, value);
    if (r.success) {
      setNotifSettings(prev => ({ ...prev, [key]: value }));
      notifications.show({ message: 'Notificacion actualizada', color: 'green' });
    } else notifications.show({ message: r.error ?? 'Error', color: 'red' });
  };

  useEffect(() => { loadOutfits(); }, [account.id]);
  useEffect(() => {
    if (activeTab === 'profile') loadProfile();
    if (activeTab === 'security') loadSecurity();
    if (activeTab === 'privacy') loadPrivacy();
    if (activeTab === 'notifications') loadNotifSettings();
  }, [activeTab, account.id]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 320, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 320, opacity: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          width: 340,
          borderLeft: '1px solid var(--mantine-color-gray-3)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <Group justify="space-between" p="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
          <Group gap="sm">
            <Avatar size="md" radius="xl" style={{ backgroundColor: 'var(--mantine-color-gray-4)' }}>
              {account.username.charAt(0).toUpperCase()}
            </Avatar>
            <Stack gap={2}>
              <Text size="sm" fw={500}>{account.username}</Text>
              {account.group && <Badge size="xs" variant="light" color="blue">{account.group}</Badge>}
            </Stack>
          </Group>
          <ActionIcon variant="subtle" color="gray" onClick={onClose}>
            <X size={16} />
          </ActionIcon>
        </Group>

        {/* Quick actions */}
        <Group gap="xs" p="sm">
          <Button variant="filled" color="primary" size="xs" fullWidth onClick={onLaunch}>Lanzar</Button>
          <Button variant="light" size="xs" fullWidth onClick={onRefreshCookie}>Cookie</Button>
        </Group>

        {/* Tabs */}
        <Tabs value={activeTab} onChange={(v) => setActiveTab(v ?? 'outfits')}>
          <Tabs.List>
            <Tabs.Tab value="outfits" leftSection={<Eye size={14} />}>Atuendos</Tabs.Tab>
            <Tabs.Tab value="profile" leftSection={<User size={14} />}>Perfil</Tabs.Tab>
            <Tabs.Tab value="security" leftSection={<Shield size={14} />}>Seguridad</Tabs.Tab>
            <Tabs.Tab value="privacy" leftSection={<Lock size={14} />}>Privacidad</Tabs.Tab>
            <Tabs.Tab value="notifications" leftSection={<Bell size={14} />}>Notif</Tabs.Tab>
          </Tabs.List>

          <ScrollArea style={{ flex: 1 }} p="sm">
            {/* Outfits Tab */}
            <Tabs.Panel value="outfits">
              <Stack gap="sm">
                {loadingOutfits ? (
                  <Stack gap="xs">
                    <Skeleton height={80} radius="md" />
                    <Skeleton height={80} radius="md" />
                  </Stack>
                ) : outfits.length === 0 ? (
                  <Text size="xs" c="dimmed" ta="center" pt="md">
                    No se pudieron cargar atuendos. La cuenta puede no tener atuendos guardados.
                  </Text>
                ) : (
                  outfits.map((outfit) => (
                    <Card key={outfit.id} withBorder padding="sm" radius="md">
                      <Group gap="sm" align="center">
                        {outfit.thumbnailUrl ? (
                          <MantineImage src={outfit.thumbnailUrl} w={48} h={48} radius="md" fit="cover" />
                        ) : (
                          <div style={{ width: 48, height: 48, borderRadius: 'var(--mantine-radius-md)', backgroundColor: 'var(--mantine-color-gray-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Eye size={20} style={{ opacity: 0.3 }} />
                          </div>
                        )}
                        <Stack gap={2}>
                          <Text size="sm" fw={500}>{outfit.name}</Text>
                          <Text size="xs" c="dimmed">ID: {outfit.id}</Text>
                        </Stack>
                      </Group>
                    </Card>
                  ))
                )}
              </Stack>
            </Tabs.Panel>

            {/* Profile Tab */}
            <Tabs.Panel value="profile">
              <Stack gap="md">
                <TextInput label="Nombre para mostrar" value={displayName} onChange={(e) => setDisplayName(e.currentTarget.value)} size="sm" />
                <Textarea label="Descripcion" value={description} onChange={(e) => setDescription(e.currentTarget.value)} size="sm" autosize minRows={2} maxRows={4} />
                <Button variant="filled" color="primary" size="sm" onClick={saveProfile} loading={savingProfile}>Guardar perfil</Button>
              </Stack>
            </Tabs.Panel>

            {/* Security Tab */}
            <Tabs.Panel value="security">
              <Stack gap="md">
                {/* 2FA */}
                <Group justify="space-between" align="center">
                  <Group gap="sm" align="center">
                    <Key size={14} />
                    <Text size="sm">Autenticacion 2 pasos</Text>
                  </Group>
                  <Switch checked={twoFAEnabled} onChange={(e) => toggle2FA(e.currentTarget.checked)} />
                </Group>

                <Divider />

                {/* Change password */}
                <Stack gap="xs">
                  <Text size="sm" fw={500}>Cambiar contrasena</Text>
                  <PasswordInput placeholder="Contrasena actual" value={currentPassword} onChange={(e) => setCurrentPassword(e.currentTarget.value)} size="sm" />
                  <PasswordInput placeholder="Nueva contrasena" value={newPassword} onChange={(e) => setNewPassword(e.currentTarget.value)} size="sm" />
                  <Button variant="light" size="xs" onClick={changePassword} loading={changingPassword} disabled={!currentPassword || !newPassword}>
                    Cambiar contrasena
                  </Button>
                </Stack>

                <Divider />

                {/* Active sessions */}
                <Stack gap="xs">
                  <Text size="sm" fw={500}>Sesiones activas ({sessions.length})</Text>
                  {sessions.length === 0 ? (
                    <Text size="xs" c="dimmed">Sin sesiones activas.</Text>
                  ) : (
                    sessions.map((s) => (
                      <Card key={s.id} withBorder padding="xs" radius="sm">
                        <Group justify="space-between" align="center">
                          <Stack gap={2}>
                            <Text size="xs" ff="monospace">{s.id.substring(0, 16)}...</Text>
                            {s.deviceInfo && <Text size="xs" c="dimmed">{s.deviceInfo}</Text>}
                            {s.lastUpdated && <Text size="xs" c="dimmed">{new Date(s.lastUpdated).toLocaleDateString()}</Text>}
                          </Stack>
                          <ActionIcon variant="subtle" color="red" size="sm" onClick={() => logoutSession(s.id)}>
                            <LogOut size={12} />
                          </ActionIcon>
                        </Group>
                      </Card>
                    ))
                  )}
                  <Button variant="light" color="red" size="xs" fullWidth onClick={onLogoutAll}>
                    Cerrar todas las sesiones
                  </Button>
                </Stack>
              </Stack>
            </Tabs.Panel>

            {/* Privacy Tab */}
            <Tabs.Panel value="privacy">
              <Stack gap="md">
                {Object.keys(privacySettings).length === 0 ? (
                  <Text size="xs" c="dimmed" ta="center">Cargando configuracion de privacidad...</Text>
                ) : (
                  Object.entries(privacySettings).map(([key, val]) => (
                    <Group key={key} justify="space-between" align="center">
                      <Text size="sm">{key.replace(/_/g, ' ')}</Text>
                      {typeof val === 'boolean' ? (
                        <Switch checked={val} onChange={(e) => updatePrivacy(key, e.currentTarget.checked)} />
                      ) : (
                        <Text size="xs" c="dimmed">{String(val)}</Text>
                      )}
                    </Group>
                  ))
                )}
              </Stack>
            </Tabs.Panel>

            {/* Notifications Tab */}
            <Tabs.Panel value="notifications">
              <Stack gap="md">
                {Object.keys(notifSettings).length === 0 ? (
                  <Text size="xs" c="dimmed" ta="center">Cargando configuracion de notificaciones...</Text>
                ) : (
                  Object.entries(notifSettings).map(([key, val]) => (
                    <Group key={key} justify="space-between" align="center">
                      <Text size="sm">{key.replace(/_/g, ' ')}</Text>
                      <Switch checked={val} onChange={(e) => updateNotif(key, e.currentTarget.checked)} />
                    </Group>
                  ))
                )}
              </Stack>
            </Tabs.Panel>
          </ScrollArea>
        </Tabs>
      </motion.div>
    </AnimatePresence>
  );
}
