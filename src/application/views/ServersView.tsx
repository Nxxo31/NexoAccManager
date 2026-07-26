// Application View: ServersView — server browser with region + ping, no Job ID — Mantine v7

import { useState } from 'react';
import { useAccountStore } from '../store/accountStore';
import { notifications } from '@mantine/notifications';
import { Group, Stack, Text, Badge, Button, Select, TextInput, Card, Progress, ScrollArea, Skeleton } from '@mantine/core';
import { Search, Globe, Wifi } from 'lucide-react';
import { t } from '../../config/i18n';

interface ServerInfo {
  id: string;
  placeId: string;
  currentPlayers: number;
  maxPlayers: number;
  ping: number;
  fps: number;
}

interface RegionInfo {
  region: string;
  ping: number;
}

export function ServersView(): JSX.Element {
  const accounts = useAccountStore((s) => s.accounts);
  const api = typeof window !== 'undefined' ? window.api : undefined;
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [placeId, setPlaceId] = useState('');
  const [servers, setServers] = useState<ServerInfo[]>([]);
  const [region, setRegion] = useState<RegionInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const searchServers = async () => {
    if (!placeId || !selectedAccountId || !api) return;
    setLoading(true);
    setRegion(null);
    try {
      const [serversResult, regionResult] = await Promise.all([
        api.byAccount.serversList(placeId, selectedAccountId, 'Public'),
        api.byAccount.serverRegion(placeId, selectedAccountId),
      ]);
      if (serversResult.success) setServers(Array.isArray(serversResult.data) ? serversResult.data : []);
      else { notifications.show({ message: serversResult.error ?? t('common.error'), color: 'red' }); setServers([]); }
      if (regionResult.success && regionResult.data) setRegion(regionResult.data as RegionInfo);
    } catch {
      notifications.show({ message: t('servers.searchError'), color: 'red' });
      setServers([]);
    }
    setLoading(false);
  };

  const handleJoin = async (jobId: string) => {
    if (!api) return;
    try {
      const result = await api.roblox.serversJoin(selectedAccountId, placeId, jobId);
      if (result.success) notifications.show({ message: t('servers.joining'), color: 'green' });
      else notifications.show({ message: result.error ?? t('common.error'), color: 'red' });
    } catch {
      notifications.show({ message: t('common.error'), color: 'red' });
    }
  };

  if (accounts.length === 0) {
    return (
      <Stack align="center" justify="center" h="100%">
        <Text c="dimmed">{t('servers.addAccountFirst')}</Text>
      </Stack>
    );
  }

  return (
    <Stack gap="md" p="md" h="100%">
      <Text size="lg" fw={600}>{t('servers.title')}</Text>

      <Select
        placeholder={t('servers.selectAccount')}
        value={selectedAccountId}
        onChange={(val) => setSelectedAccountId(val ?? '')}
        data={accounts.map((acc) => ({ value: acc.id, label: acc.username }))}
        size="sm"
        searchable
      />

      <Group gap="sm">
        <TextInput
          placeholder={t('servers.placeIdPlaceholder')}
          value={placeId}
          onChange={(e) => setPlaceId(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') searchServers(); }}
          leftSection={<Search size={14} />}
          size="sm"
          style={{ flex: 1 }}
        />
        <Button variant="filled" color="primary" size="sm" onClick={searchServers}>{t('servers.search')}</Button>
      </Group>

      {/* Region + ping info */}
      {region && (
        <Card withBorder padding="sm" radius="md">
          <Group gap="sm" align="center">
            <Globe size={16} />
            <Text size="sm" fw={500}>{t('servers.region', { region: region.region })}</Text>
            {/* A-003: Color como unico indicador - anadir icono y texto a ping badge */}
            <Badge size="sm" variant="light" color={region.ping < 100 ? 'green' : region.ping < 200 ? 'yellow' : 'red'}>
              <Group gap={4}>
                <Wifi size={12} />
                {region.ping}ms
              </Group>
            </Badge>
          </Group>
        </Card>
      )}

      <ScrollArea style={{ flex: 1 }}>
        {loading && (
          <Stack gap="sm">
            <Skeleton height={80} radius="md" />
            <Skeleton height={80} radius="md" />
            <Skeleton height={80} radius="md" />
          </Stack>
        )}

        {!loading && !selectedAccountId && (
          <Text c="dimmed" ta="center" pt="xl">
            {t('servers.selectToSearch')}
          </Text>
        )}

        {!loading && selectedAccountId && placeId && servers.length === 0 && (
          <Text c="dimmed" ta="center" pt="xl">
            {t('servers.noResults')}
          </Text>
        )}

        {!loading && servers.length > 0 && (
          <Stack gap="sm">
            {servers.map((s) => (
              <Card key={s.id} withBorder padding="sm" radius="md">
                <Group justify="space-between" mb="xs">
                  <Group gap="sm" align="center">
                    <Globe size={14} />
                    <Text size="xs" ff="monospace" c="dimmed">{s.id.substring(0, 12)}...</Text>
                  </Group>
                  {/* A-003: Color como unico indicador - anadir texto a ping badge */}
                  <Badge size="xs" variant="light" color={s.ping < 100 ? 'green' : s.ping < 200 ? 'yellow' : 'red'}>
                    {s.ping}ms
                  </Badge>
                </Group>
                <Group justify="space-between" mb="xs">
                  <Text size="sm" c="dimmed">{t('servers.players', { current: String(s.currentPlayers), max: String(s.maxPlayers) })}</Text>
                  <Text size="xs" c="dimmed">{t('servers.fps', { fps: String(s.fps) })}</Text>
                </Group>
                <Progress
                  value={(s.currentPlayers / s.maxPlayers) * 100}
                  size="sm"
                  color="primary"
                  mb="sm"
                />
                <Button variant="filled" color="primary" size="xs" fullWidth onClick={() => handleJoin(s.id)}>
                  {t('accounts.join')}
                </Button>
              </Card>
            ))}
          </Stack>
        )}
      </ScrollArea>
    </Stack>
  );
}
