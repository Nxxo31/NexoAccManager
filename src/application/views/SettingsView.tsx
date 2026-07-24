// Application View: SettingsView — full settings with all features — Mantine v7

import { useState, useEffect } from 'react';
import { useMantineColorScheme } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  Group, Stack, Text, Switch, Accordion, TextInput, Button, ColorPicker, ColorSwatch, Badge,
  Select, Code, ScrollArea, Card, ActionIcon, JsonInput, NumberInput, Checkbox, Tooltip,
} from '@mantine/core';
import {
  Moon, Sun, Server, Code as CodeIcon, Palette, Globe, Flag, Package, Activity,
  Trash, Clock, Zap, Download, Upload, BookOpen, Gamepad2,
} from 'lucide-react';
import { useAccountStore } from '../store/accountStore';

export function SettingsView(): JSX.Element {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const accounts = useAccountStore((s) => s.accounts);

  // General settings
  const [devmode, setDevmode] = useState(false);
  const [autoRejoin, setAutoRejoin] = useState(false);
  const [savePasswords, setSavePasswords] = useState(false);
  const [bottingEnabled, setBottingEnabled] = useState(false);
  const [bottingInterval, setBottingInterval] = useState(5);
  const [apiRunning, setApiRunning] = useState(false);
  const [apiPort, setApiPort] = useState('31415');
  const [primaryColor, setPrimaryColor] = useState('#1d8eff');

  // FastFlags
  const [fflagsAccountId, setFflagsAccountId] = useState<string>('');
  const [fflags, setFflags] = useState<Record<string, unknown>>({});
  const [fflagKey, setFflagKey] = useState('');
  const [fflagValue, setFflagValue] = useState('');

  // Content Mods
  const [modsAvailable, setModsAvailable] = useState<string[]>([]);
  const [modsInstalled, setModsInstalled] = useState<Set<string>>(new Set());

  // Discord RPC
  const [discordRunning, setDiscordRunning] = useState(false);
  const [discordDetails, setDiscordDetails] = useState('Playing Roblox');
  const [discordState, setDiscordState] = useState('NexoAccManager');

  // Playtime
  const [playtimeAccountId, setPlaytimeAccountId] = useState<string>('');
  const [totalPlaytime, setTotalPlaytime] = useState<number>(0);
  const [playtimeHistory, setPlaytimeHistory] = useState<{ placeName: string; durationMinutes: number; startTime: string }[]>([]);

  // Launch Presets
  const [presets, setPresets] = useState<{ id: string; name: string; placeId: string; accountIds: string[] }[]>([]);
  const [presetName, setPresetName] = useState('');
  const [presetPlaceId, setPresetPlaceId] = useState('');

  // Cache
  const [cacheSize, setCacheSize] = useState<string>('');

  // Logs
  const [logEntries, setLogEntries] = useState<{ timestamp: string; level: string; message: string }[]>([]);

  useEffect(() => {
    window.api.settings.get('devmode').then((r) => { if (r.success) setDevmode(Boolean(r.data)); });
    window.api.settings.get('autoRejoin').then((r) => { if (r.success) setAutoRejoin(Boolean(r.data)); });
    window.api.settings.get('savePasswords').then((r) => { if (r.success) setSavePasswords(Boolean(r.data)); });
    window.api.settings.get('bottingEnabled').then((r) => { if (r.success) setBottingEnabled(Boolean(r.data)); });
    window.api.settings.get('bottingInterval').then((r) => { if (r.success && r.data) setBottingInterval(Number(r.data)); });
    window.api.settings.get('primaryColor').then((r) => { if (r.success && r.data) setPrimaryColor(String(r.data)); });
    loadMods();
    loadPresets();
    loadCacheAnalysis();
    loadRecentLogs();
  }, []);

  // Auto-load fflags + playtime when account selected
  useEffect(() => {
    if (fflagsAccountId) loadFflags();
  }, [fflagsAccountId]);

  useEffect(() => {
    if (playtimeAccountId) loadPlaytime();
  }, [playtimeAccountId]);

  const colors = ['#1d8eff', '#16a34a', '#dc2626', '#9333ea', '#ea580c', '#0891b2', '#db2777', '#facc15'];

  // === Handlers ===

  const handleToggleDevmode = async (val: boolean) => {
    setDevmode(val);
    await window.api.settings.set('devmode', val);
    await window.api.advanced.devMode(val);
    notifications.show({ message: val ? 'Modo desarrollador activado' : 'Desactivado', color: 'blue' });
  };

  const handleToggleSavePasswords = async (val: boolean) => {
    setSavePasswords(val);
    await window.api.settings.set('savePasswords', val);
    notifications.show({ message: 'Guardado de contrasenas ' + (val ? 'activado' : 'desactivado'), color: 'blue' });
  };

  const handleToggleBotting = async (val: boolean) => {
    setBottingEnabled(val);
    await window.api.settings.set('bottingEnabled', val);
    if (!val) await window.api.botting.stop();
    notifications.show({ message: 'Botting ' + (val ? 'activado' : 'desactivado'), color: 'blue' });
  };

  const saveBottingInterval = async (val: number) => {
    setBottingInterval(val);
    await window.api.settings.set('bottingInterval', val);
  };

  const savePrimaryColor = async (color: string) => {
    setPrimaryColor(color);
    await window.api.settings.set('primaryColor', color);
  };

  // FastFlags
  const loadFflags = async () => {
    const r = await window.api.byAccount.fflagsGetAll(fflagsAccountId);
    if (r.success && r.data) setFflags(r.data as Record<string, unknown>);
    else setFflags({});
  };

  const setFflag = async () => {
    if (!fflagKey.trim() || !fflagsAccountId) return;
    let value: string | number | boolean = fflagValue;
    if (value === 'true') value = true;
    else if (value === 'false') value = false;
    else if (!isNaN(Number(value))) value = Number(value);
    const r = await window.api.byAccount.fflagsSetFlag(fflagsAccountId, fflagKey.trim(), value);
    if (r.success) {
      notifications.show({ message: 'Flag guardada', color: 'green' });
      setFflagKey(''); setFflagValue('');
      loadFflags();
    } else notifications.show({ message: r.error ?? 'Error', color: 'red' });
  };

  const deleteFflag = async (key: string) => {
    const r = await window.api.byAccount.fflagsDeleteFlag(fflagsAccountId, key);
    if (r.success) { notifications.show({ message: 'Flag eliminada', color: 'green' }); loadFflags(); }
    else notifications.show({ message: r.error ?? 'Error', color: 'red' });
  };

  const exportFflags = async () => {
    if (!fflagsAccountId) return;
    const r = await window.api.byAccount.fflagsExportFlags(fflagsAccountId);
    if (r.success) notifications.show({ message: 'Flags exportadas al portapapeles', color: 'green' });
    else notifications.show({ message: r.error ?? 'Error', color: 'red' });
  };

  // Content Mods
  const loadMods = async () => {
    const r = await window.api.byAccount.modsListAvailable();
    if (r.success && Array.isArray(r.data)) {
      setModsAvailable(r.data as string[]);
      const installed = new Set<string>();
      for (const mod of r.data as string[]) {
        const check = await window.api.byAccount.modsIsModInstalled(mod);
        if (check.success && check.data) installed.add(mod);
      }
      setModsInstalled(installed);
    }
  };

  const toggleMod = async (modName: string) => {
    if (modsInstalled.has(modName)) {
      const r = await window.api.byAccount.modsUninstallMod(modName);
      if (r.success) { setModsInstalled(new Set([...modsInstalled].filter(m => m !== modName))); notifications.show({ message: `${modName} desinstalado`, color: 'green' }); }
      else notifications.show({ message: r.error ?? 'Error', color: 'red' });
    } else {
      const r = await window.api.byAccount.modsInstallMod(modName);
      if (r.success) { setModsInstalled(new Set([...modsInstalled, modName])); notifications.show({ message: `${modName} instalado`, color: 'green' }); }
      else notifications.show({ message: r.error ?? 'Error', color: 'red' });
    }
  };

  const backupMods = async () => {
    const r = await window.api.byAccount.modsBackupOriginals();
    if (r.success) notifications.show({ message: 'Originales respaldados', color: 'green' });
    else notifications.show({ message: r.error ?? 'Error', color: 'red' });
  };

  const restoreMods = async () => {
    const r = await window.api.byAccount.modsRestoreOriginals();
    if (r.success) { notifications.show({ message: 'Originales restaurados', color: 'green' }); loadMods(); }
    else notifications.show({ message: r.error ?? 'Error', color: 'red' });
  };

  // Discord RPC
  const toggleDiscord = async () => {
    if (discordRunning) {
      await window.api.byAccount.discordShutdown();
      setDiscordRunning(false);
      notifications.show({ message: 'Discord RPC desconectado', color: 'blue' });
    } else {
      const r = await window.api.byAccount.discordInitialize();
      if (r.success) {
        setDiscordRunning(true);
        await window.api.byAccount.discordUpdatePresence(discordDetails, discordState, 'nam-logo', undefined, Date.now());
        notifications.show({ message: 'Discord RPC activado', color: 'green' });
      } else notifications.show({ message: r.error ?? 'Error', color: 'red' });
    }
  };

  const updateDiscordPresence = async () => {
    const r = await window.api.byAccount.discordUpdatePresence(discordDetails, discordState, 'nam-logo', undefined, Date.now());
    if (r.success) notifications.show({ message: 'Presencia actualizada', color: 'green' });
    else notifications.show({ message: r.error ?? 'Error', color: 'red' });
  };

  // Playtime
  const loadPlaytime = async () => {
    const r = await window.api.byAccount.playtimeGetTotalPlaytime(playtimeAccountId);
    if (r.success && r.data) setTotalPlaytime(Number(r.data));
    const hist = await window.api.byAccount.playtimeGetSessionHistory(playtimeAccountId, 10);
    if (hist.success && Array.isArray(hist.data)) setPlaytimeHistory(hist.data as { placeName: string; durationMinutes: number; startTime: string }[]);
  };

  const clearPlaytime = async () => {
    const r = await window.api.byAccount.playtimeClearHistory(playtimeAccountId);
    if (r.success) { notifications.show({ message: 'Historial borrado', color: 'green' }); loadPlaytime(); }
    else notifications.show({ message: r.error ?? 'Error', color: 'red' });
  };

  // Presets
  const loadPresets = async () => {
    const r = await window.api.byAccount.presetsGetAll();
    if (r.success && Array.isArray(r.data)) setPresets(r.data as { id: string; name: string; placeId: string; accountIds: string[] }[]);
  };

  const savePreset = async () => {
    if (!presetName.trim() || !presetPlaceId.trim()) return;
    const r = await window.api.byAccount.presetsSavePreset({
      name: presetName.trim(),
      placeId: presetPlaceId.trim(),
      accountIds: accounts.map(a => a.id),
      autoShuffle: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Omit<import('../../domain/entities/LaunchPreset').LaunchPreset, 'id'>);
    if (r.success) {
      notifications.show({ message: 'Preset guardado', color: 'green' });
      setPresetName(''); setPresetPlaceId('');
      loadPresets();
    } else notifications.show({ message: r.error ?? 'Error', color: 'red' });
  };

  const launchPreset = async (id: string) => {
    const r = await window.api.byAccount.presetsLaunchPreset(id);
    if (r.success) notifications.show({ message: 'Preset lanzado', color: 'green' });
    else notifications.show({ message: r.error ?? 'Error', color: 'red' });
  };

  const deletePreset = async (id: string) => {
    const r = await window.api.byAccount.presetsDeletePreset(id);
    if (r.success) { notifications.show({ message: 'Preset eliminado', color: 'green' }); loadPresets(); }
    else notifications.show({ message: r.error ?? 'Error', color: 'red' });
  };

  // Cache
  const loadCacheAnalysis = async () => {
    const r = await window.api.byAccount.cacheAnalyze();
    if (r.success && r.data) {
      const d = r.data as { totalSizeMB?: number };
      setCacheSize(d.totalSizeMB ? `${d.totalSizeMB.toFixed(1)} MB` : 'N/A');
    }
  };

  const cleanCache = async () => {
    const r = await window.api.byAccount.cacheClean({ temp: true, logs: true, cache: true });
    if (r.success) { notifications.show({ message: 'Cache limpiada', color: 'green' }); loadCacheAnalysis(); }
    else notifications.show({ message: r.error ?? 'Error', color: 'red' });
  };

  // Logs
  const loadRecentLogs = async () => {
    const r = await window.api.byAccount.logsGetRecent(1, 50);
    if (r.success && Array.isArray(r.data)) setLogEntries(r.data as { timestamp: string; level: string; message: string }[]);
  };

  const clearOldLogs = async () => {
    const r = await window.api.byAccount.logsClearOld(7);
    if (r.success) { notifications.show({ message: 'Logs antiguos limpiados', color: 'green' }); loadRecentLogs(); }
    else notifications.show({ message: r.error ?? 'Error', color: 'red' });
  };

  const accountData = accounts.map((acc) => ({ value: acc.id, label: acc.username }));

  return (
    <Stack gap="md" p="md" h="100%">
      <Text size="lg" fw={600}>Ajustes</Text>

      <Accordion variant="separated">
        {/* Appearance */}
        <Accordion.Item value="appearance">
          <Accordion.Control>
            <Group gap="sm"><Palette size={16} /><Text size="sm" fw={500}>Apariencia</Text></Group>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack gap="md" p="xs">
              <Group justify="space-between" align="center">
                <Group gap="sm" align="center">
                  {colorScheme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                  <Text size="sm">Tema oscuro</Text>
                </Group>
                <Switch checked={colorScheme === 'dark'} onChange={() => toggleColorScheme()} />
              </Group>
              <div>
                <Text size="sm" fw={500} mb="xs">Color principal de NAM</Text>
                <Group gap="xs" mb="sm">
                  {colors.map((c) => (
                    <ColorSwatch key={c} color={c} onClick={() => savePrimaryColor(c)}
                      style={{ cursor: 'pointer', border: primaryColor === c ? '2px solid white' : 'none' }} />
                  ))}
                </Group>
                <ColorPicker value={primaryColor} onChange={savePrimaryColor} format="hex" size="sm" />
                <Group gap="xs" mt="sm" align="center">
                  <Text size="xs" c="dimmed">Color:</Text>
                  <Badge variant="filled" style={{ backgroundColor: primaryColor }}>{primaryColor}</Badge>
                </Group>
              </div>
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>

        {/* General */}
        <Accordion.Item value="general">
          <Accordion.Control>
            <Group gap="sm"><CodeIcon size={16} /><Text size="sm" fw={500}>General</Text></Group>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack gap="md" p="xs">
              <Group justify="space-between" align="center">
                <Text size="sm">Modo desarrollador</Text>
                <Switch checked={devmode} onChange={(e) => handleToggleDevmode(e.currentTarget.checked)} />
              </Group>
              <Group justify="space-between" align="center">
                <Text size="sm">Guardar contrasenas (AES-256)</Text>
                <Switch checked={savePasswords} onChange={(e) => handleToggleSavePasswords(e.currentTarget.checked)} />
              </Group>
              <Group justify="space-between" align="center">
                <Text size="sm">Auto-rejoin al desconectar</Text>
                <Switch checked={autoRejoin} onChange={(e) => { setAutoRejoin(e.currentTarget.checked); window.api.settings.set('autoRejoin', e.currentTarget.checked); }} />
              </Group>
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>

        {/* Botting */}
        <Accordion.Item value="botting">
          <Accordion.Control>
            <Group gap="sm"><Zap size={16} /><Text size="sm" fw={500}>Botting</Text></Group>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack gap="md" p="xs">
              <Group justify="space-between" align="center">
                <Text size="sm">Activar modo botting (riesgo de ban)</Text>
                <Switch checked={bottingEnabled} onChange={(e) => handleToggleBotting(e.currentTarget.checked)} />
              </Group>
              {bottingEnabled && (
                <Group gap="sm" align="center">
                  <Text size="sm">Intervalo (minutos):</Text>
                  <NumberInput value={bottingInterval} onChange={(val) => saveBottingInterval(Number(val) || 5)} min={1} max={60} size="sm" w={80} />
                </Group>
              )}
              <Text size="xs" c="red">Advertencia: el uso de botting viola los Terminos de Servicio de Roblox y puede resultar en ban permanente.</Text>
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>

        {/* WebServer */}
        <Accordion.Item value="webserver">
          <Accordion.Control>
            <Group gap="sm"><Server size={16} /><Text size="sm" fw={500}>Servidor web local</Text></Group>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack gap="md" p="xs">
              <Group gap="sm" align="center">
                <Globe size={16} />
                <TextInput placeholder="Puerto" value={apiPort} onChange={(e) => setApiPort(e.currentTarget.value)} size="sm" style={{ width: 100 }} />
                <Button variant={apiRunning ? 'light' : 'filled'} color={apiRunning ? 'red' : 'primary'} size="sm"
                  onClick={async () => {
                    if (apiRunning) {
                      const r = await window.api.advanced.localApiStop();
                      if (r.success) { setApiRunning(false); notifications.show({ message: 'Servidor detenido', color: 'green' }); }
                    } else {
                      const r = await window.api.advanced.localApiStart(parseInt(apiPort, 10) || 31415);
                      if (r.success) { setApiRunning(true); notifications.show({ message: `Servidor en http://localhost:${apiPort}`, color: 'green' }); }
                    }
                  }}>
                  {apiRunning ? 'Detener' : 'Iniciar'}
                </Button>
              </Group>
              <Text size="xs" c="dimmed">API HTTP local para integraciones externas. Lee cuentas de la base de datos local.</Text>
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>

        {/* FastFlags */}
        <Accordion.Item value="fflags">
          <Accordion.Control>
            <Group gap="sm"><Flag size={16} /><Text size="sm" fw={500}>FastFlags</Text></Group>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack gap="md" p="xs">
              <Select placeholder="Seleccionar cuenta..." value={fflagsAccountId} onChange={(val) => setFflagsAccountId(val ?? '')} data={accountData} size="sm" searchable />
              {fflagsAccountId && (
                <>
                  <Group gap="xs">
                    <TextInput placeholder="Flag name (ej: FFlagDebugGraphicsPreferVulkan)" value={fflagKey} onChange={(e) => setFflagKey(e.currentTarget.value)} size="sm" style={{ flex: 1 }} />
                    <TextInput placeholder="Value" value={fflagValue} onChange={(e) => setFflagValue(e.currentTarget.value)} size="sm" w={120} />
                    <Button size="sm" variant="filled" color="primary" onClick={setFflag}>Set</Button>
                    <Button size="sm" variant="light" onClick={exportFflags}><Download size={14} /></Button>
                  </Group>
                  <ScrollArea style={{ maxHeight: 250 }}>
                    <Stack gap="xs">
                      {Object.entries(fflags).length === 0 ? (
                        <Text size="xs" c="dimmed" ta="center">No hay flags configuradas.</Text>
                      ) : (
                        Object.entries(fflags).map(([key, val]) => (
                          <Card key={key} withBorder padding="xs" radius="sm">
                            <Group justify="space-between" align="center">
                              <Stack gap={2}>
                                <Text size="xs" ff="monospace" fw={500}>{key}</Text>
                                <Text size="xs" c="dimmed">= {String(val)}</Text>
                              </Stack>
                              <ActionIcon variant="subtle" color="red" size="sm" onClick={() => deleteFflag(key)}>
                                <Trash size={12} />
                              </ActionIcon>
                            </Group>
                          </Card>
                        ))
                      )}
                    </Stack>
                  </ScrollArea>
                </>
              )}
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>

        {/* Content Mods */}
        <Accordion.Item value="mods">
          <Accordion.Control>
            <Group gap="sm"><Package size={16} /><Text size="sm" fw={500}>Content Modding</Text></Group>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack gap="md" p="xs">
              <Group gap="xs">
                <Button size="sm" variant="light" onClick={backupMods}><Download size={14} /> Respaldar originales</Button>
                <Button size="sm" variant="light" onClick={restoreMods}><Upload size={14} /> Restaurar originales</Button>
              </Group>
              <Stack gap="xs">
                {modsAvailable.length === 0 ? (
                  <Text size="xs" c="dimmed" ta="center">No hay mods disponibles. Copia mods en la carpeta de contenido de Roblox.</Text>
                ) : (
                  modsAvailable.map((mod) => (
                    <Card key={mod} withBorder padding="xs" radius="sm">
                      <Group justify="space-between" align="center">
                        <Text size="sm" ff="monospace">{mod}</Text>
                        <Group gap="xs">
                          {modsInstalled.has(mod) && <Badge size="xs" variant="light" color="green">Instalado</Badge>}
                          <Button size="xs" variant={modsInstalled.has(mod) ? 'light' : 'filled'} color={modsInstalled.has(mod) ? 'red' : 'primary'}
                            onClick={() => toggleMod(mod)}>
                            {modsInstalled.has(mod) ? 'Desinstalar' : 'Instalar'}
                          </Button>
                        </Group>
                      </Group>
                    </Card>
                  ))
                )}
              </Stack>
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>

        {/* Discord RPC */}
        <Accordion.Item value="discord">
          <Accordion.Control>
            <Group gap="sm"><Activity size={16} /><Text size="sm" fw={500}>Discord Rich Presence</Text></Group>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack gap="md" p="xs">
              <Group justify="space-between" align="center">
                <Text size="sm">Activar Discord RPC</Text>
                <Switch checked={discordRunning} onChange={() => toggleDiscord()} />
              </Group>
              {discordRunning && (
                <>
                  <TextInput label="Details" placeholder="Playing Roblox" value={discordDetails} onChange={(e) => setDiscordDetails(e.currentTarget.value)} size="sm" />
                  <TextInput label="State" placeholder="NexoAccManager" value={discordState} onChange={(e) => setDiscordState(e.currentTarget.value)} size="sm" />
                  <Button size="sm" variant="light" onClick={updateDiscordPresence}>Actualizar presencia</Button>
                </>
              )}
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>

        {/* Playtime Tracking */}
        <Accordion.Item value="playtime">
          <Accordion.Control>
            <Group gap="sm"><Clock size={16} /><Text size="sm" fw={500}>Playtime Tracking</Text></Group>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack gap="md" p="xs">
              <Select placeholder="Seleccionar cuenta..." value={playtimeAccountId} onChange={(val) => setPlaytimeAccountId(val ?? '')} data={accountData} size="sm" searchable />
              {playtimeAccountId && (
                <>
                  <Group justify="space-between" align="center">
                    <Text size="sm" fw={500}>Tiempo total: {(totalPlaytime / 60).toFixed(1)} horas</Text>
                    <Button size="xs" variant="light" color="red" onClick={clearPlaytime}><Trash size={12} /> Borrar historial</Button>
                  </Group>
                  <ScrollArea style={{ maxHeight: 200 }}>
                    <Stack gap="xs">
                      {playtimeHistory.length === 0 ? (
                        <Text size="xs" c="dimmed" ta="center">Sin sesiones registradas.</Text>
                      ) : (
                        playtimeHistory.map((entry, i) => (
                          <Card key={`${entry.startTime}-${entry.placeName}-${i}`} withBorder padding="xs" radius="sm">
                            <Group justify="space-between">
                              <Stack gap={2}>
                                <Text size="sm" fw={500}>{entry.placeName || 'Juego desconocido'}</Text>
                                <Text size="xs" c="dimmed">{new Date(entry.startTime).toLocaleDateString()}</Text>
                              </Stack>
                              <Badge size="sm" variant="light">{entry.durationMinutes} min</Badge>
                            </Group>
                          </Card>
                        ))
                      )}
                    </Stack>
                  </ScrollArea>
                </>
              )}
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>

        {/* Launch Presets */}
        <Accordion.Item value="presets">
          <Accordion.Control>
            <Group gap="sm"><Gamepad2 size={16} /><Text size="sm" fw={500}>Launch Presets</Text></Group>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack gap="md" p="xs">
              <Group gap="xs">
                <TextInput placeholder="Nombre del preset" value={presetName} onChange={(e) => setPresetName(e.currentTarget.value)} size="sm" style={{ flex: 1 }} />
                <TextInput placeholder="Place ID" value={presetPlaceId} onChange={(e) => setPresetPlaceId(e.currentTarget.value)} size="sm" w={140} />
                <Button size="sm" variant="filled" color="primary" onClick={savePreset}>Guardar</Button>
              </Group>
              <Stack gap="xs">
                {presets.length === 0 ? (
                  <Text size="xs" c="dimmed" ta="center">No hay presets guardados.</Text>
                ) : (
                  presets.map((preset) => (
                    <Card key={preset.id} withBorder padding="xs" radius="sm">
                      <Group justify="space-between" align="center">
                        <Stack gap={2}>
                          <Text size="sm" fw={500}>{preset.name}</Text>
                          <Text size="xs" c="dimmed">Place: {preset.placeId} | Cuentas: {preset.accountIds.length}</Text>
                        </Stack>
                        <Group gap="xs">
                          <Button size="xs" variant="filled" color="primary" onClick={() => launchPreset(preset.id)}>Lanzar</Button>
                          <ActionIcon size="sm" variant="subtle" color="red" onClick={() => deletePreset(preset.id)}><Trash size={14} /></ActionIcon>
                        </Group>
                      </Group>
                    </Card>
                  ))
                )}
              </Stack>
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>

        {/* Cache Cleaner */}
        <Accordion.Item value="cache">
          <Accordion.Control>
            <Group gap="sm"><Trash size={16} /><Text size="sm" fw={500}>Cache Cleaner</Text></Group>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack gap="md" p="xs">
              <Group justify="space-between" align="center">
                <Text size="sm">Tamano del cache: {cacheSize || 'Calculando...'}</Text>
                <Button size="sm" variant="filled" color="red" onClick={cleanCache}><Trash size={14} /> Limpiar cache</Button>
              </Group>
              <Text size="xs" c="dimmed">Elimina archivos temporales, logs y cache de Roblox para liberar espacio.</Text>
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>

        {/* Roblox Logs */}
        <Accordion.Item value="logs">
          <Accordion.Control>
            <Group gap="sm"><BookOpen size={16} /><Text size="sm" fw={500}>Roblox Logs</Text></Group>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack gap="md" p="xs">
              <Group justify="space-between" align="center">
                <Text size="sm">{logEntries.length} entradas recientes (ultima hora)</Text>
                <Button size="xs" variant="light" color="red" onClick={clearOldLogs}>Limpiar +7 dias</Button>
              </Group>
              <ScrollArea style={{ maxHeight: 250 }}>
                <Stack gap="xs">
                  {logEntries.length === 0 ? (
                    <Text size="xs" c="dimmed" ta="center">Sin logs recientes.</Text>
                  ) : (
                    logEntries.map((entry, i) => (
                      <Card key={`${entry.timestamp}-${entry.level}-${i}`} withBorder padding="xs" radius="sm">
                        <Group gap="xs" align="start">
                          <Badge size="xs" variant="light" color={entry.level === 'error' ? 'red' : entry.level === 'warning' ? 'yellow' : 'gray'}>{entry.level}</Badge>
                          <Stack gap={2}>
                            <Text size="xs" c="dimmed">{new Date(entry.timestamp).toLocaleTimeString()}</Text>
                            <Text size="xs" ff="monospace">{entry.message}</Text>
                          </Stack>
                        </Group>
                      </Card>
                    ))
                  )}
                </Stack>
              </ScrollArea>
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>

        {/* Data Management */}
        <Accordion.Item value="data">
          <Accordion.Control>
            <Group gap="sm"><Download size={16} /><Text size="sm" fw={500}>Datos</Text></Group>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack gap="md" p="xs">
              <Button size="sm" variant="light" onClick={async () => {
                const r = await window.api.advanced.exportData();
                if (r.success) notifications.show({ message: 'Datos exportados', color: 'green' });
                else notifications.show({ message: r.error ?? 'Error', color: 'red' });
              }}><Download size={14} /> Exportar datos</Button>
              <Button size="sm" variant="light" color="red" onClick={async () => {
                if (confirm('Borrar todas las cuentas? Esta accion no se puede deshacer.')) {
                  const r = await window.api.advanced.deleteAllAccounts();
                  if (r.success) notifications.show({ message: 'Todas las cuentas borradas', color: 'green' });
                  else notifications.show({ message: r.error ?? 'Error', color: 'red' });
                }
              }}><Trash size={14} /> Borrar todas las cuentas</Button>
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </Stack>
  );
}
