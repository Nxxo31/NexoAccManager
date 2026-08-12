// Application View: SettingsView — Mantine v7 segmented by use-flow tabs
// 4 tabs: Cuentas | Roblox | Integraciones | General
import { useState, useCallback } from 'react';
import { Group, Stack, Text, Accordion, Tabs, Button, Switch, ScrollArea } from '@mantine/core';
import {
  Palette, Code as CodeIcon, Zap, Server, Flag, Package, Activity,
  Clock, Gamepad2, Trash, BookOpen, Download, Layers,
} from 'lucide-react';
import { notifications } from '@mantine/notifications';
import { t } from '../../config/i18n';
import { SettingsAppearance } from '../components/settings/SettingsAppearance';
import { SettingsGeneral } from '../components/settings/SettingsGeneral';
import { SettingsBotting } from '../components/settings/SettingsBotting';
import { SettingsWebServer } from '../components/settings/SettingsWebServer';
import { SettingsFastFlags } from '../components/settings/SettingsFastFlags';
import { SettingsContentMods } from '../components/settings/SettingsContentMods';
import { SettingsDiscordRPC } from '../components/settings/SettingsDiscordRPC';
import { SettingsPlaytime } from '../components/settings/SettingsPlaytime';
import { SettingsLaunchPresets } from '../components/settings/SettingsLaunchPresets';
import { SettingsCache } from '../components/settings/SettingsCache';
import { SettingsLogs } from '../components/settings/SettingsLogs';
import { SettingsData } from '../components/settings/SettingsData';

export function SettingsView(): JSX.Element {
  const api = typeof window !== 'undefined' ? window.api : undefined;
  const [activeTab, setActiveTab] = useState<string | null>('accounts');
  const [multiRoblox, setMultiRoblox] = useState(false);

  // Load multiRoblox setting on mount
  useState(() => {
    if (api) {
      api.settings.get('multiRoblox').then((r) => {
        if (r.success && r.data) setMultiRoblox(Boolean(r.data));
      }).catch(() => {});
    }
  });

  const handleSave = useCallback(() => {
    notifications.show({ message: t('settings.saved'), color: 'green', autoClose: 2000 });
  }, []);

  return (
    <Stack gap="md" p="md" h="100%">
      <Group justify="space-between" align="center">
        <Text size="lg" fw={600}>{t('settings.title')}</Text>
        <Button variant="filled" size="sm" onClick={handleSave}>{t('settings.save')}</Button>
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Tabs.List>
          <Tabs.Tab value="accounts">{t('settings.tabAccounts')}</Tabs.Tab>
          <Tabs.Tab value="roblox">{t('settings.tabRoblox')}</Tabs.Tab>
          <Tabs.Tab value="integrations">{t('settings.tabIntegrations')}</Tabs.Tab>
          <Tabs.Tab value="general">{t('settings.tabGeneral')}</Tabs.Tab>
        </Tabs.List>

        {/* TAB: Cuentas — cookie management + profile/privacy/security/control config */}
        <Tabs.Panel value="accounts" pt="md" style={{ flex: 1, overflow: 'hidden' }}>
          <ScrollArea h="100%">
            <Stack gap="md">
              <Text size="sm" c="dimmed">{t('settings.cookieManagementDesc')}</Text>
              <Accordion variant="separated">
                <Accordion.Item value="profile-config">
                  <Accordion.Control>
                    <Group gap="sm"><Palette size={16} /><Text size="sm" fw={500}>{t('settings.profileConfig')}</Text></Group>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Stack gap="xs">
                      <Text size="xs" c="dimmed">{t('settings.profileConfigDesc')}</Text>
                      <Text size="xs" c="dimmed">{t('settings.comingSoon')}</Text>
                    </Stack>
                  </Accordion.Panel>
                </Accordion.Item>

                <Accordion.Item value="privacy-config">
                  <Accordion.Control>
                    <Group gap="sm"><CodeIcon size={16} /><Text size="sm" fw={500}>{t('settings.privacyConfig')}</Text></Group>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Stack gap="xs">
                      <Text size="xs" c="dimmed">{t('settings.privacyConfigDesc')}</Text>
                      <Text size="xs" c="dimmed">{t('settings.comingSoon')}</Text>
                    </Stack>
                  </Accordion.Panel>
                </Accordion.Item>

                <Accordion.Item value="security-config">
                  <Accordion.Control>
                    <Group gap="sm"><Zap size={16} /><Text size="sm" fw={500}>{t('settings.securityConfig')}</Text></Group>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Stack gap="xs">
                      <Text size="xs" c="dimmed">{t('settings.securityConfigDesc')}</Text>
                      <Text size="xs" c="dimmed">{t('settings.comingSoon')}</Text>
                    </Stack>
                  </Accordion.Panel>
                </Accordion.Item>

                <Accordion.Item value="control-config">
                  <Accordion.Control>
                    <Group gap="sm"><Activity size={16} /><Text size="sm" fw={500}>{t('settings.controlConfig')}</Text></Group>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Stack gap="xs">
                      <Text size="xs" c="dimmed">{t('settings.controlConfigDesc')}</Text>
                      <Text size="xs" c="dimmed">{t('settings.comingSoon')}</Text>
                    </Stack>
                  </Accordion.Panel>
                </Accordion.Item>
              </Accordion>
            </Stack>
          </ScrollArea>
        </Tabs.Panel>

        {/* TAB: Roblox — FastFlags, Launch Presets, Content Mods, Logs, Cache */}
        <Tabs.Panel value="roblox" pt="md" style={{ flex: 1, overflow: 'hidden' }}>
          <ScrollArea h="100%">
            <Accordion variant="separated">
              <Accordion.Item value="fflags">
                <Accordion.Control>
                  <Group gap="sm"><Flag size={16} /><Text size="sm" fw={500}>{t('settings.fastFlags')}</Text></Group>
                </Accordion.Control>
                <Accordion.Panel><SettingsFastFlags /></Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="presets">
                <Accordion.Control>
                  <Group gap="sm"><Gamepad2 size={16} /><Text size="sm" fw={500}>{t('settings.launchPresets')}</Text></Group>
                </Accordion.Control>
                <Accordion.Panel><SettingsLaunchPresets /></Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="mods">
                <Accordion.Control>
                  <Group gap="sm"><Package size={16} /><Text size="sm" fw={500}>{t('settings.contentModding')}</Text></Group>
                </Accordion.Control>
                <Accordion.Panel><SettingsContentMods /></Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="logs">
                <Accordion.Control>
                  <Group gap="sm"><BookOpen size={16} /><Text size="sm" fw={500}>{t('settings.robloxLogs')}</Text></Group>
                </Accordion.Control>
                <Accordion.Panel><SettingsLogs /></Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="cache">
                <Accordion.Control>
                  <Group gap="sm"><Trash size={16} /><Text size="sm" fw={500}>{t('settings.cacheCleaner')}</Text></Group>
                </Accordion.Control>
                <Accordion.Panel><SettingsCache /></Accordion.Panel>
              </Accordion.Item>
            </Accordion>
          </ScrollArea>
        </Tabs.Panel>

        {/* TAB: Integraciones — Botting, WebServer, Discord RPC, Playtime */}
        <Tabs.Panel value="integrations" pt="md" style={{ flex: 1, overflow: 'hidden' }}>
          <ScrollArea h="100%">
            <Accordion variant="separated">
              <Accordion.Item value="botting">
                <Accordion.Control>
                  <Group gap="sm"><Zap size={16} /><Text size="sm" fw={500}>{t('settings.botting')}</Text></Group>
                </Accordion.Control>
                <Accordion.Panel><SettingsBotting /></Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="webserver">
                <Accordion.Control>
                  <Group gap="sm"><Server size={16} /><Text size="sm" fw={500}>{t('settings.webServer')}</Text></Group>
                </Accordion.Control>
                <Accordion.Panel><SettingsWebServer /></Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="discord">
                <Accordion.Control>
                  <Group gap="sm"><Activity size={16} /><Text size="sm" fw={500}>{t('settings.discordRpc')}</Text></Group>
                </Accordion.Control>
                <Accordion.Panel><SettingsDiscordRPC /></Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="playtime">
                <Accordion.Control>
                  <Group gap="sm"><Clock size={16} /><Text size="sm" fw={500}>{t('settings.playtimeTracking')}</Text></Group>
                </Accordion.Control>
                <Accordion.Panel><SettingsPlaytime /></Accordion.Panel>
              </Accordion.Item>
            </Accordion>
          </ScrollArea>
        </Tabs.Panel>

        {/* TAB: General — MultiRoblox, Appearance, General settings, Data */}
        <Tabs.Panel value="general" pt="md" style={{ flex: 1, overflow: 'hidden' }}>
          <ScrollArea h="100%">
            <Accordion variant="separated">
              {/* MultiRoblox — moved here per user request */}
              <Accordion.Item value="multi-roblox">
                <Accordion.Control>
                  <Group gap="sm"><Layers size={16} /><Text size="sm" fw={500}>{t('settings.multiRoblox')}</Text></Group>
                </Accordion.Control>
                <Accordion.Panel>
                  <Stack gap="md" p="xs">
                    <Group justify="space-between" align="center">
                      <Stack gap={2}>
                        <Text size="sm">{t('settings.multiRobloxToggle')}</Text>
                        <Text size="xs" c="dimmed">{t('settings.multiRobloxDesc')}</Text>
                      </Stack>
                      <Switch
                        checked={multiRoblox}
                        onChange={async (e) => {
                          setMultiRoblox(e.currentTarget.checked);
                          if (api) await api.settings.set('multiRoblox', e.currentTarget.checked);
                        }}
                      />
                    </Group>
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="appearance">
                <Accordion.Control>
                  <Group gap="sm"><Palette size={16} /><Text size="sm" fw={500}>{t('settings.appearance')}</Text></Group>
                </Accordion.Control>
                <Accordion.Panel><SettingsAppearance /></Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="general">
                <Accordion.Control>
                  <Group gap="sm"><CodeIcon size={16} /><Text size="sm" fw={500}>{t('settings.general')}</Text></Group>
                </Accordion.Control>
                <Accordion.Panel><SettingsGeneral /></Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="data">
                <Accordion.Control>
                  <Group gap="sm"><Download size={16} /><Text size="sm" fw={500}>{t('settings.data')}</Text></Group>
                </Accordion.Control>
                <Accordion.Panel><SettingsData /></Accordion.Panel>
              </Accordion.Item>
            </Accordion>
          </ScrollArea>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
