// Application View: SettingsView — full settings with all features — Mantine v7

import { useState, useEffect } from 'react';
import { useMantineColorScheme } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import {
  Group, Stack, Text, Switch, Accordion, TextInput, Button, ColorPicker, ColorSwatch, Badge,
  Select, ScrollArea, Card, ActionIcon, NumberInput, Checkbox,
} from '@mantine/core';
import {
  Moon, Sun, Server, Code as CodeIcon, Palette, Globe, Flag, Package, Activity,
  Trash, Clock, Zap, Download, Upload, BookOpen, Gamepad2, Languages,
} from 'lucide-react';
import { useAccountStore } from '../store/accountStore';
import { t, setLang, getLang, type LangId } from '../../config/i18n';

export function SettingsView(): JSX.Element {
 const { colorScheme, toggleColorScheme } = useMantineColorScheme();
 const accounts = useAccountStore((s) => s.accounts);

 // Language
 const [lang, setLangState] = useState<LangId>(getLang());

 // General settings
 const [devmode, setDevmode] = useState(false);
 const [autoRejoin, setAutoRejoin] = useState(false);
 const [savePasswords, setSavePasswords] = useState(false);
 const [bottingEnabled, setBottingEnabled] = useState(false);
 const [bottingInterval, setBottingInterval] = useState(5);
 const [apiRunning, setApiRunning] = useState(false);
 const [apiPort, setApiPort] = useState('31415');
 const [primaryColor, setPrimaryColor] = useState('#1d8eff');

 // Force re-render when lang changes
 const [, forceUpdate] = useState(0);
 const applyLang = (newLang: LangId) => {
 setLang(newLang);
 setLangState(newLang);
 window.api.settings.set('lang', newLang);
 forceUpdate(n => n + 1);
 };

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
 Promise.allSettled([
   window.api.settings.get('devmode'),
   window.api.settings.get('autoRejoin'),
   window.api.settings.get('savePasswords'),
   window.api.settings.get('bottingEnabled'),
   window.api.settings.get('bottingInterval'),
   window.api.settings.get('primaryColor'),
   window.api.settings.get('lang'),
 ]).then((results) => {
   const [devmodeR, autoRejoinR, savePasswordsR, bottingEnabledR, bottingIntervalR, primaryColorR, langR] = results;
   if (devmodeR.status === 'fulfilled' && devmodeR.value.success) setDevmode(Boolean(devmodeR.value.data));
   if (autoRejoinR.status === 'fulfilled' && autoRejoinR.value.success) setAutoRejoin(Boolean(autoRejoinR.value.data));
   if (savePasswordsR.status === 'fulfilled' && savePasswordsR.value.success) setSavePasswords(Boolean(savePasswordsR.value.data));
   if (bottingEnabledR.status === 'fulfilled' && bottingEnabledR.value.success) setBottingEnabled(Boolean(bottingEnabledR.value.data));
   if (bottingIntervalR.status === 'fulfilled' && bottingIntervalR.value.success && bottingIntervalR.value.data) setBottingInterval(Number(bottingIntervalR.value.data));
   if (primaryColorR.status === 'fulfilled' && primaryColorR.value.success && primaryColorR.value.data) setPrimaryColor(String(primaryColorR.value.data));
   if (langR.status === 'fulfilled' && langR.value.success && langR.value.data) {
     const stored = String(langR.value.data) as LangId;
     if (['es', 'en', 'pt'].includes(stored)) applyLang(stored);
   }
 }).catch(() => { /* settings load failed — defaults remain */ });
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
 const langOptions = [
 { value: 'es', label: 'Español' },
 { value: 'en', label: 'English' },
 { value: 'pt', label: 'Português' },
 ];

 // === Handlers ===

 const handleToggleDevmode = async (val: boolean) => {
 setDevmode(val);
 await window.api.settings.set('devmode', val);
 await window.api.advanced.devMode(val);
 notifications.show({ message: val ? t('settings.devmodeActivated') : t('settings.devmodeDeactivated'), color: 'blue' });
 };

 const handleToggleSavePasswords = async (val: boolean) => {
 setSavePasswords(val);
 await window.api.settings.set('savePasswords', val);
 notifications.show({ message: val ? t('settings.savePasswordsEnabled') : t('settings.savePasswordsDisabled'), color: 'blue' });
 };

 const handleToggleBotting = async (val: boolean) => {
 setBottingEnabled(val);
 await window.api.settings.set('bottingEnabled', val);
 if (!val) await window.api.botting.stop();
 notifications.show({ message: val ? t('settings.bottingEnabled') : t('settings.bottingDisabled'), color: 'blue' });
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
 notifications.show({ message: t('settings.flagSaved'), color: 'green' });
 setFflagKey(''); setFflagValue('');
 loadFflags();
 } else notifications.show({ message: r.error ?? t('common.error'), color: 'red' });
 };

 const deleteFflag = async (key: string) => {
 const r = await window.api.byAccount.fflagsDeleteFlag(fflagsAccountId, key);
 if (r.success) { notifications.show({ message: t('settings.flagDeleted'), color: 'green' }); loadFflags(); }
 else notifications.show({ message: r.error ?? t('common.error'), color: 'red' });
 };

 const exportFflags = async () => {
 if (!fflagsAccountId) return;
 const r = await window.api.byAccount.fflagsExportFlags(fflagsAccountId);
 if (r.success) notifications.show({ message: t('settings.flagsExported'), color: 'green' });
 else notifications.show({ message: r.error ?? t('common.error'), color: 'red' });
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
 if (r.success) { setModsInstalled(new Set([...modsInstalled].filter(m => m !== modName))); notifications.show({ message: t('settings.modUninstalled', { name: modName }), color: 'green' }); }
 else notifications.show({ message: r.error ?? t('common.error'), color: 'red' });
 } else {
 const r = await window.api.byAccount.modsInstallMod(modName);
 if (r.success) { setModsInstalled(new Set([...modsInstalled, modName])); notifications.show({ message: t('settings.modInstalled', { name: modName }), color: 'green' }); }
 else notifications.show({ message: r.error ?? t('common.error'), color: 'red' });
 }
 };

 const backupMods = async () => {
 const r = await window.api.byAccount.modsBackupOriginals();
 if (r.success) notifications.show({ message: t('settings.originalsBackedUp'), color: 'green' });
 else notifications.show({ message: r.error ?? t('common.error'), color: 'red' });
 };

 const restoreMods = async () => {
 const r = await window.api.byAccount.modsRestoreOriginals();
 if (r.success) { notifications.show({ message: t('settings.originalsRestored'), color: 'green' }); loadMods(); }
 else notifications.show({ message: r.error ?? t('common.error'), color: 'red' });
 };

 // Discord RPC
 const toggleDiscord = async () => {
 if (discordRunning) {
 await window.api.byAccount.discordShutdown();
 setDiscordRunning(false);
 notifications.show({ message: t('settings.discordDisconnected'), color: 'blue' });
 } else {
 const r = await window.api.byAccount.discordInitialize();
 if (r.success) {
 setDiscordRunning(true);
 await window.api.byAccount.discordUpdatePresence(discordDetails, discordState, 'nam-logo', undefined, Date.now());
 notifications.show({ message: t('settings.discordConnected'), color: 'green' });
 } else notifications.show({ message: r.error ?? t('common.error'), color: 'red' });
 }
 };

 const updateDiscordPresence = async () => {
 const r = await window.api.byAccount.discordUpdatePresence(discordDetails, discordState, 'nam-logo', undefined, Date.now());
 if (r.success) notifications.show({ message: t('settings.presenceUpdated'), color: 'green' });
 else notifications.show({ message: r.error ?? t('common.error'), color: 'red' });
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
 if (r.success) { notifications.show({ message: t('settings.historyCleared'), color: 'green' }); loadPlaytime(); }
 else notifications.show({ message: r.error ?? t('common.error'), color: 'red' });
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
 notifications.show({ message: t('settings.presetSaved'), color: 'green' });
 setPresetName(''); setPresetPlaceId('');
 loadPresets();
 } else notifications.show({ message: r.error ?? t('common.error'), color: 'red' });
 };

 const launchPreset = async (id: string) => {
 const r = await window.api.byAccount.presetsLaunchPreset(id);
 if (r.success) notifications.show({ message: t('settings.presetLaunched'), color: 'green' });
 else notifications.show({ message: r.error ?? t('common.error'), color: 'red' });
 };

 const deletePreset = async (id: string) => {
 const r = await window.api.byAccount.presetsDeletePreset(id);
 if (r.success) { notifications.show({ message: t('settings.presetDeleted'), color: 'green' }); loadPresets(); }
 else notifications.show({ message: r.error ?? t('common.error'), color: 'red' });
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
 if (r.success) { notifications.show({ message: t('settings.cacheCleaned'), color: 'green' }); loadCacheAnalysis(); }
 else notifications.show({ message: r.error ?? t('common.error'), color: 'red' });
 };

 // Logs
 const loadRecentLogs = async () => {
 const r = await window.api.byAccount.logsGetRecent(1, 50);
 if (r.success && Array.isArray(r.data)) setLogEntries(r.data as { timestamp: string; level: string; message: string }[]);
 };

 const clearOldLogs = async () => {
 const r = await window.api.byAccount.logsClearOld(7);
 if (r.success) { notifications.show({ message: t('settings.oldLogsCleared'), color: 'green' }); loadRecentLogs(); }
 else notifications.show({ message: r.error ?? t('common.error'), color: 'red' });
 };

 // U-001: Mantine modal for delete confirmation
 const confirmDeleteAllAccounts = () => {
 modals.openConfirmModal({
 title: t('accounts.deleteConfirmTitle'),
 children: (
 <Stack gap="sm">
 <Text size="sm">
 {t('settings.deleteAllConfirm')}
 </Text>
 <Checkbox label={t('settings.deleteAllAccounts')} />
 </Stack>
 ),
 labels: { confirm: t('accounts.delete'), cancel: t('accounts.cancel') },
 confirmProps: { color: 'red' },
 onConfirm: async () => {
 const r = await window.api.advanced.deleteAllAccounts();
 if (r.success) notifications.show({ message: t('settings.allAccountsDeleted'), color: 'green' });
 else notifications.show({ message: r.error ?? t('common.error'), color: 'red' });
 },
 });
 };

 const accountData = accounts.map((acc) => ({ value: acc.id, label: acc.username }));

 return (
 <Stack gap="md" p="md" h="100%">
 <Text size="lg" fw={600}>{t('settings.title')}</Text>

 <Accordion variant="separated">
 {/* Appearance */}
 <Accordion.Item value="appearance">
 <Accordion.Control>
 <Group gap="sm"><Palette size={16} /><Text size="sm" fw={500}>{t('settings.appearance')}</Text></Group>
 </Accordion.Control>
 <Accordion.Panel>
 <Stack gap="md" p="xs">
 <Group justify="space-between" align="center">
 <Group gap="sm" align="center">
 {colorScheme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
 <Text size="sm">{t('settings.darkTheme')}</Text>
 </Group>
 <Switch checked={colorScheme === 'dark'} onChange={() => toggleColorScheme()} />
 </Group>
 <div>
 <Text size="sm" fw={500} mb="xs">{t('settings.primaryColor')}</Text>
 <Group gap="xs" mb="sm">
 {colors.map((c) => (
 <ColorSwatch key={c} color={c} onClick={() => savePrimaryColor(c)}
 style={{ cursor: 'pointer', border: primaryColor === c ? '2px solid white' : 'none' }} />
 ))}
 </Group>
 <ColorPicker value={primaryColor} onChange={savePrimaryColor} format="hex" size="sm" />
 <Group gap="xs" mt="sm" align="center">
 <Text size="xs" c="dimmed">{t('settings.color')}</Text>
 <Badge variant="filled" style={{ backgroundColor: primaryColor }}>{primaryColor}</Badge>
 </Group>
 </div>
 {/* Language selector */}
 <Group justify="space-between" align="center">
 <Group gap="sm" align="center">
 <Languages size={16} />
 <Text size="sm">{t('settings.language')}</Text>
 </Group>
 <Select
 value={lang}
 onChange={(val) => val && applyLang(val as LangId)}
 data={langOptions}
 size="sm"
 w={140}
 />
 </Group>
 </Stack>
 </Accordion.Panel>
 </Accordion.Item>

 {/* General */}
 <Accordion.Item value="general">
 <Accordion.Control>
 <Group gap="sm"><CodeIcon size={16} /><Text size="sm" fw={500}>{t('settings.general')}</Text></Group>
 </Accordion.Control>
 <Accordion.Panel>
 <Stack gap="md" p="xs">
 <Group justify="space-between" align="center">
 <Text size="sm">{t('settings.developerMode')}</Text>
 <Switch checked={devmode} onChange={(e) => handleToggleDevmode(e.currentTarget.checked)} />
 </Group>
 <Group justify="space-between" align="center">
 <Text size="sm">{t('settings.savePasswords')}</Text>
 <Switch checked={savePasswords} onChange={(e) => handleToggleSavePasswords(e.currentTarget.checked)} />
 </Group>
 <Group justify="space-between" align="center">
 <Text size="sm">{t('settings.autoRejoin')}</Text>
 <Switch checked={autoRejoin} onChange={(e) => { setAutoRejoin(e.currentTarget.checked); window.api.settings.set('autoRejoin', e.currentTarget.checked); }} />
 </Group>
 </Stack>
 </Accordion.Panel>
 </Accordion.Item>

 {/* Botting */}
 <Accordion.Item value="botting">
 <Accordion.Control>
 <Group gap="sm"><Zap size={16} /><Text size="sm" fw={500}>{t('settings.botting')}</Text></Group>
 </Accordion.Control>
 <Accordion.Panel>
 <Stack gap="md" p="xs">
 <Group justify="space-between" align="center">
 <Text size="sm">{t('settings.enableBotting')}</Text>
 <Switch checked={bottingEnabled} onChange={(e) => handleToggleBotting(e.currentTarget.checked)} />
 </Group>
 {bottingEnabled && (
 <Group gap="sm" align="center">
 <Text size="sm">{t('settings.interval')}</Text>
 <NumberInput value={bottingInterval} onChange={(val) => saveBottingInterval(Number(val) || 5)} min={1} max={60} size="sm" w={80} />
 </Group>
 )}
 <Text size="xs" c="red">{t('settings.bottingWarning')}</Text>
 </Stack>
 </Accordion.Panel>
 </Accordion.Item>

 {/* WebServer */}
 <Accordion.Item value="webserver">
 <Accordion.Control>
 <Group gap="sm"><Server size={16} /><Text size="sm" fw={500}>{t('settings.webServer')}</Text></Group>
 </Accordion.Control>
 <Accordion.Panel>
 <Stack gap="md" p="xs">
 <Group gap="sm" align="center">
 <Globe size={16} />
 <TextInput placeholder={t('settings.port')} value={apiPort} onChange={(e) => setApiPort(e.currentTarget.value)} size="sm" style={{ width: 100 }} />
 <Button variant={apiRunning ? 'light' : 'filled'} color={apiRunning ? 'red' : 'primary'} size="sm"
 onClick={async () => {
 if (apiRunning) {
 const r = await window.api.advanced.localApiStop();
 if (r.success) { setApiRunning(false); notifications.show({ message: t('settings.serverStopped'), color: 'green' }); }
 } else {
 const r = await window.api.advanced.localApiStart(parseInt(apiPort, 10) || 31415);
 if (r.success) { setApiRunning(true); notifications.show({ message: t('settings.serverRunning', { port: apiPort }), color: 'green' }); }
 }
 }}>
 {apiRunning ? t('settings.stop') : t('settings.start')}
 </Button>
 </Group>
 <Text size="xs" c="dimmed">{t('settings.webApiDescription')}</Text>
 </Stack>
 </Accordion.Panel>
 </Accordion.Item>

 {/* FastFlags */}
 <Accordion.Item value="fflags">
 <Accordion.Control>
 <Group gap="sm"><Flag size={16} /><Text size="sm" fw={500}>{t('settings.fastFlags')}</Text></Group>
 </Accordion.Control>
 <Accordion.Panel>
 <Stack gap="md" p="xs">
 <Select placeholder={t('servers.selectAccount')} value={fflagsAccountId} onChange={(val) => setFflagsAccountId(val ?? '')} data={accountData} size="sm" searchable />
 {fflagsAccountId && (
 <>
 <Group gap="xs">
 <TextInput placeholder={t('settings.flagNamePlaceholder')} value={fflagKey} onChange={(e) => setFflagKey(e.currentTarget.value)} size="sm" style={{ flex: 1 }} />
 <TextInput placeholder={t('settings.value')} value={fflagValue} onChange={(e) => setFflagValue(e.currentTarget.value)} size="sm" w={120} />
 <Button size="sm" variant="filled" color="primary" onClick={setFflag}>{t('settings.set')}</Button>
 <Button size="sm" variant="light" onClick={exportFflags}><Download size={14} /></Button>
 </Group>
 <ScrollArea style={{ maxHeight: 250 }}>
 <Stack gap="xs">
 {Object.entries(fflags).length === 0 ? (
 <Text size="xs" c="dimmed" ta="center">{t('settings.noFlags')}</Text>
 ) : (
 Object.entries(fflags).map(([key, val]) => (
 <Card key={key} withBorder padding="xs" radius="sm">
 <Group justify="space-between" align="center">
 <Stack gap={2}>
 <Text size="xs" ff="monospace" fw={500}>{key}</Text>
 <Text size="xs" c="dimmed">= {String(val)}</Text>
 </Stack>
 <ActionIcon variant="subtle" color="red" size="sm" onClick={() => deleteFflag(key)} aria-label={t('settings.flagDeleted')}>
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
 <Group gap="sm"><Package size={16} /><Text size="sm" fw={500}>{t('settings.contentModding')}</Text></Group>
 </Accordion.Control>
 <Accordion.Panel>
 <Stack gap="md" p="xs">
 <Group gap="xs">
 <Button size="sm" variant="light" onClick={backupMods}><Download size={14} /> {t('settings.backupOriginals')}</Button>
 <Button size="sm" variant="light" onClick={restoreMods}><Upload size={14} /> {t('settings.restoreOriginals')}</Button>
 </Group>
 <Stack gap="xs">
 {modsAvailable.length === 0 ? (
 <Text size="xs" c="dimmed" ta="center">{t('settings.noMods')}</Text>
 ) : (
 modsAvailable.map((mod) => (
 <Card key={mod} withBorder padding="xs" radius="sm">
 <Group justify="space-between" align="center">
 <Text size="sm" ff="monospace">{mod}</Text>
 <Group gap="xs">
 {modsInstalled.has(mod) && <Badge size="xs" variant="light" color="green">{t('settings.installed')}</Badge>}
 <Button size="xs" variant={modsInstalled.has(mod) ? 'light' : 'filled'} color={modsInstalled.has(mod) ? 'red' : 'primary'}
 onClick={() => toggleMod(mod)}>
 {modsInstalled.has(mod) ? t('settings.uninstall') : t('settings.install')}
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
 <Group gap="sm"><Activity size={16} /><Text size="sm" fw={500}>{t('settings.discordRpc')}</Text></Group>
 </Accordion.Control>
 <Accordion.Panel>
 <Stack gap="md" p="xs">
 <Group justify="space-between" align="center">
 <Text size="sm">{t('settings.enableDiscordRpc')}</Text>
 <Switch checked={discordRunning} onChange={() => toggleDiscord()} />
 </Group>
 {discordRunning && (
 <>
 <TextInput label={t('settings.discordDetails')} placeholder="Playing Roblox" value={discordDetails} onChange={(e) => setDiscordDetails(e.currentTarget.value)} size="sm" />
 <TextInput label={t('settings.discordState')} placeholder="NexoAccManager" value={discordState} onChange={(e) => setDiscordState(e.currentTarget.value)} size="sm" />
 <Button size="sm" variant="light" onClick={updateDiscordPresence}>{t('settings.updatePresence')}</Button>
 </>
 )}
 </Stack>
 </Accordion.Panel>
 </Accordion.Item>

 {/* Playtime Tracking */}
 <Accordion.Item value="playtime">
 <Accordion.Control>
 <Group gap="sm"><Clock size={16} /><Text size="sm" fw={500}>{t('settings.playtimeTracking')}</Text></Group>
 </Accordion.Control>
 <Accordion.Panel>
 <Stack gap="md" p="xs">
 <Select placeholder={t('servers.selectAccount')} value={playtimeAccountId} onChange={(val) => setPlaytimeAccountId(val ?? '')} data={accountData} size="sm" searchable />
 {playtimeAccountId && (
 <>
 <Group justify="space-between" align="center">
 <Text size="sm" fw={500}>{t('settings.totalPlaytime', { hours: (totalPlaytime / 60).toFixed(1) })}</Text>
 <Button size="xs" variant="light" color="red" onClick={clearPlaytime}><Trash size={12} /> {t('settings.clearHistory')}</Button>
 </Group>
 <ScrollArea style={{ maxHeight: 200 }}>
 <Stack gap="xs">
 {playtimeHistory.length === 0 ? (
 <Text size="xs" c="dimmed" ta="center">{t('settings.noSessions')}</Text>
 ) : (
 playtimeHistory.map((entry, i) => (
 <Card key={`${entry.startTime}-${entry.placeName}-${i}`} withBorder padding="xs" radius="sm">
 <Group justify="space-between">
 <Stack gap={2}>
 <Text size="sm" fw={500}>{entry.placeName || t('settings.unknownGame')}</Text>
 <Text size="xs" c="dimmed">{new Date(entry.startTime).toLocaleDateString()}</Text>
 </Stack>
 <Badge size="sm" variant="light">{t('settings.minutes', { minutes: String(entry.durationMinutes) })}</Badge>
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
 <Group gap="sm"><Gamepad2 size={16} /><Text size="sm" fw={500}>{t('settings.launchPresets')}</Text></Group>
 </Accordion.Control>
 <Accordion.Panel>
 <Stack gap="md" p="xs">
 <Group gap="xs">
 <TextInput placeholder={t('settings.presetNamePlaceholder')} value={presetName} onChange={(e) => setPresetName(e.currentTarget.value)} size="sm" style={{ flex: 1 }} />
 <TextInput placeholder={t('accounts.placeId')} value={presetPlaceId} onChange={(e) => setPresetPlaceId(e.currentTarget.value)} size="sm" w={140} />
 <Button size="sm" variant="filled" color="primary" onClick={savePreset}>{t('common.save')}</Button>
 </Group>
 <Stack gap="xs">
 {presets.length === 0 ? (
 <Text size="xs" c="dimmed" ta="center">{t('settings.noPresets')}</Text>
 ) : (
 presets.map((preset) => (
 <Card key={preset.id} withBorder padding="xs" radius="sm">
 <Group justify="space-between" align="center">
 <Stack gap={2}>
 <Text size="sm" fw={500}>{preset.name}</Text>
 <Text size="xs" c="dimmed">{t('settings.presetAccounts', { placeId: preset.placeId, count: String(preset.accountIds.length) })}</Text>
 </Stack>
 <Group gap="xs">
 <Button size="xs" variant="filled" color="primary" onClick={() => launchPreset(preset.id)}>{t('settings.launch')}</Button>
 <ActionIcon size="sm" variant="subtle" color="red" onClick={() => deletePreset(preset.id)} aria-label={t('settings.presetDeleted')}><Trash size={14} /></ActionIcon>
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
 <Group gap="sm"><Trash size={16} /><Text size="sm" fw={500}>{t('settings.cacheCleaner')}</Text></Group>
 </Accordion.Control>
 <Accordion.Panel>
 <Stack gap="md" p="xs">
 <Group justify="space-between" align="center">
 <Text size="sm">{t('settings.cacheSize', { size: cacheSize || t('settings.calculating') })}</Text>
 <Button size="sm" variant="filled" color="red" onClick={cleanCache}><Trash size={14} /> {t('settings.clearCache')}</Button>
 </Group>
 <Text size="xs" c="dimmed">{t('settings.cacheDescription')}</Text>
 </Stack>
 </Accordion.Panel>
 </Accordion.Item>

 {/* Roblox Logs */}
 <Accordion.Item value="logs">
 <Accordion.Control>
 <Group gap="sm"><BookOpen size={16} /><Text size="sm" fw={500}>{t('settings.robloxLogs')}</Text></Group>
 </Accordion.Control>
 <Accordion.Panel>
 <Stack gap="md" p="xs">
 <Group justify="space-between" align="center">
 <Text size="sm">{t('settings.recentEntries', { count: String(logEntries.length) })}</Text>
 <Button size="xs" variant="light" color="red" onClick={clearOldLogs}>{t('settings.clearOldLogs')}</Button>
 </Group>
 <ScrollArea style={{ maxHeight: 250 }}>
 <Stack gap="xs">
 {logEntries.length === 0 ? (
 <Text size="xs" c="dimmed" ta="center">{t('settings.noLogs')}</Text>
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
 <Group gap="sm"><Download size={16} /><Text size="sm" fw={500}>{t('settings.data')}</Text></Group>
 </Accordion.Control>
 <Accordion.Panel>
 <Stack gap="md" p="xs">
 <Button size="sm" variant="light" onClick={async () => {
 const r = await window.api.advanced.exportData();
 if (r.success) notifications.show({ message: t('settings.dataExported'), color: 'green' });
 else notifications.show({ message: r.error ?? t('common.error'), color: 'red' });
 }}><Download size={14} /> {t('settings.exportData')}</Button>
 <Button size="sm" variant="light" color="red" onClick={confirmDeleteAllAccounts}><Trash size={14} /> {t('settings.deleteAllAccounts')}</Button>
 </Stack>
 </Accordion.Panel>
 </Accordion.Item>
 </Accordion>
 </Stack>
 );
}
