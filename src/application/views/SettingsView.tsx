// Application View: SettingsView — Mantine v7 segmented by use-flow tabs
// Redesigned: 12 accordions → 4 tabbed categories by order of use
// Tabs: Cuentas | Roblox | Integraciones | General

import { useState } from 'react';
import { Group, Stack, Text, Tabs, Accordion } from '@mantine/core';
import {
  Palette, Code as CodeIcon, Zap, Server, Flag, Package, Activity,
  Clock, Gamepad2, Trash, BookOpen, Download, Users, Globe, Plug, Settings as SettingsIcon,
} from 'lucide-react';
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

type SettingsTab = 'accounts' | 'roblox' | 'integrations' | 'general';

export function SettingsView(): JSX.Element {
  const [activeTab, setActiveTab] = useState<SettingsTab>('accounts');

  return (
    <Stack gap="md" p="md" h="100%" style={{ overflow: 'auto' }}>
      <Text size="lg" fw={600}>{t('settings.title')}</Text>

      <Tabs value={activeTab} onChange={(v) => setActiveTab(v as SettingsTab)}>
        <Tabs.List>
          <Tabs.Tab value="accounts" leftSection={<Users size={14} />}>
            {t('settings.tabAccounts')}
          </Tabs.Tab>
          <Tabs.Tab value="roblox" leftSection={<Globe size={14} />}>
            {t('settings.tabRoblox')}
          </Tabs.Tab>
          <Tabs.Tab value="integrations" leftSection={<Plug size={14} />}>
            {t('settings.tabIntegrations')}
          </Tabs.Tab>
          <Tabs.Tab value="general" leftSection={<SettingsIcon size={14} />}>
            {t('settings.tabGeneral')}
          </Tabs.Tab>
        </Tabs.List>

        {/* Tab: Cuentas — cookie management, bulk operations (placeholder for future multi-select config) */}
        <Tabs.Panel value="accounts" pt="md">
          <Accordion variant="separated">
            <Accordion.Item value="cookie-mgmt">
              <Accordion.Control>
                <Group gap="sm"><Users size={16} /><Text size="sm" fw={500}>{t('settings.cookieManagement')}</Text></Group>
              </Accordion.Control>
              <Accordion.Panel>
                <Stack gap="sm">
                  <Text size="xs" c="dimmed">{t('settings.cookieManagementDesc')}</Text>
                  {/* Placeholder — multi-select account config will go here */}
                  <Text size="xs" c="dimmed" fs="italic">{t('settings.comingSoon')}</Text>
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>
        </Tabs.Panel>

        {/* Tab: Roblox — FastFlags, Launch Presets, Content Mods, Logs, Cache */}
        <Tabs.Panel value="roblox" pt="md">
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
        </Tabs.Panel>

        {/* Tab: Integraciones — Discord RPC, Web Server, Botting, Playtime */}
        <Tabs.Panel value="integrations" pt="md">
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
        </Tabs.Panel>

        {/* Tab: General — Appearance, General settings, Data management */}
        <Tabs.Panel value="general" pt="md">
          <Accordion variant="separated">
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
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
