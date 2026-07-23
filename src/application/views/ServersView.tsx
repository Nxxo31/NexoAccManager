// Application View: ServersView — server browser with region + ping, no Job ID — Mantine v7

import { useState } from 'react';
import { useAccountStore } from '../store/accountStore';
import { notifications } from '@mantine/notifications';
import { Group, Stack, Text, Badge, Button, Select, TextInput, Card, Progress, ScrollArea, Skeleton, Tooltip } from '@mantine/core';
import { Search, Globe, Wifi } from 'lucide-react';

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
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [placeId, setPlaceId] = useState('');
  const [servers, setServers] = useState<ServerInfo[]>([]);
  const [region, setRegion] = useState<RegionInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const searchServers = async () => {
    if (!placeId || !selectedAccountId) return;
    setLoading(true);
    setRegion(null);
    try {
      const [serversResult, regionResult] = await Promise.all([
        window.api.byAccount.serversList(placeId, selectedAccountId, 'Public'),
        window.api.byAccount.serverRegion(placeId, selectedAccountId),
      ]);
      if (serversResult.success) setServers(Array.isArray(serversResult.data) ? serversResult.data : []);
      else { notifications.show({ message: serversResult.error ?? 'Error', color: 'red' }); setServers([]); }
      if (regionResult.success && regionResult.data) setRegion(regionResult.data as RegionInfo);
    } catch {
      notifications.show({ message: 'Error al buscar servidores', color: 'red' });
      setServers([]);
    }
    setLoading(false);
  };

  const handleJoin = async (jobId: string) => {
    const result = await window.api.roblox.serversJoin(selectedAccountId, placeId, jobId);
    if (result.success) notifications.show({ message: 'Uniendose al servidor...', color: 'green' });
    else notifications.show({ message: result.error ?? 'Error', color: 'red' });
  };

  if (accounts.length === 0) {
    return (<Stack align="center" justify="center" h="100%"><Text c="dimmed">Agrega una cuenta primero.</Text></Stack>);
  }

  return (
    <Stack gap="md" p="md" h="100%">
      <Text size="lg" fw={600}>Servidores</Text>

      <Select
        placeholder="Seleccionar cuenta..."
        value={selectedAccountId}
        onChange={(val) => setSelectedAccountId(val ?? '')}
        data={accounts.map((acc) => ({ value: acc.id, label: acc.username }))}
        size="sm"
        searchable
      />

      <Group gap="sm">
        <TextInput
          placeholder="Place ID..."
          value={placeId}
          onChange={(e) => setPlaceId(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') searchServers(); }}
          leftSection={<Search size={14} />}
          size="sm"
          style={{ flex: 1 }}
        />
        <Button variant="filled" color="primary" size="sm" onClick={searchServers}>Buscar</Button>
      </Group>

      {/* Region + ping info */}
      {region && (
        <Card withBorder padding="sm" radius="md">
          <Group gap="sm" align="center">
            <Globe size={16} />
            <Text size="sm" fw={500}>Region: {region.region}</Text>
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
        {loading && (<Stack gap="sm"><Skeleton height={80} radius="md" /><Skeleton height={80} radius="md" /><Skeleton height={80} radius="md" /></Stack>)}

        {!loading && !selectedAccountId && (<Text c="dimmed" ta="center" pt="xl">Selecciona una cuenta para buscar servidores.</Text>)}

        {!loading && selectedAccountId && placeId && servers.length === 0 && (
          <Text c="dimmed" ta="center" pt="xl">No se encontraron servidores. Verifica el Place ID.</Text>
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
                  <Badge size="xs" variant="light" color={s.ping < 100 ? 'green' : s.ping < 200 ? 'yellow' : 'red'}>
                    {s.ping}ms
                  </Badge>
                </Group>
                <Group justify="space-between" mb="xs">
                  <Text size="sm" c="dimmed">{s.currentPlayers}/{s.maxPlayers} jugadores</Text>
                  <Text size="xs" c="dimmed">{s.fps} FPS</Text>
                </Group>
                <Progress
                  value={(s.currentPlayers / s.maxPlayers) * 100}
                  size="sm"
                  color="primary"
                  mb="sm"
                />
                <Button variant="filled" color="primary" size="xs" fullWidth onClick={() => handleJoin(s.id)}>
                  Unirse
                </Button>
              </Card>
            ))}
          </Stack>
        )}
      </ScrollArea>
    </Stack>
  );
}
