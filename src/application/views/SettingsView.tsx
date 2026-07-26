// Application View: SettingsView — Mantine v7 accordion wrapper for 12 sub-components
// DT-6: 713 líneas → ~90 líneas. Cada concern aislado en components/settings/* (SRP)

import { Group, Stack, Text, Accordion } from '@mantine/core';
import {
  Palette, Code as CodeIcon, Zap, Server, Flag, Package, Activity,
  Clock, Gamepad2, Trash, BookOpen, Download,
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

export function SettingsView(): JSX.Element {
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
            <SettingsAppearance />
          </Accordion.Panel>
        </Accordion.Item>

        {/* General */}
        <Accordion.Item value="general">
          <Accordion.Control>
            <Group gap="sm"><CodeIcon size={16} /><Text size="sm" fw={500}>{t('settings.general')}</Text></Group>
          </Accordion.Control>
          <Accordion.Panel>
            <SettingsGeneral />
          </Accordion.Panel>
        </Accordion.Item>

        {/* Botting */}
        <Accordion.Item value="botting">
          <Accordion.Control>
            <Group gap="sm"><Zap size={16} /><Text size="sm" fw={500}>{t('settings.botting')}</Text></Group>
          </Accordion.Control>
          <Accordion.Panel>
            <SettingsBotting />
          </Accordion.Panel>
        </Accordion.Item>

        {/* WebServer */}
        <Accordion.Item value="webserver">
          <Accordion.Control>
            <Group gap="sm"><Server size={16} /><Text size="sm" fw={500}>{t('settings.webServer')}</Text></Group>
          </Accordion.Control>
          <Accordion.Panel>
            <SettingsWebServer />
          </Accordion.Panel>
        </Accordion.Item>

        {/* FastFlags */}
        <Accordion.Item value="fflags">
          <Accordion.Control>
            <Group gap="sm"><Flag size={16} /><Text size="sm" fw={500}>{t('settings.fastFlags')}</Text></Group>
          </Accordion.Control>
          <Accordion.Panel>
            <SettingsFastFlags />
          </Accordion.Panel>
        </Accordion.Item>

        {/* Content Mods */}
        <Accordion.Item value="mods">
          <Accordion.Control>
            <Group gap="sm"><Package size={16} /><Text size="sm" fw={500}>{t('settings.contentModding')}</Text></Group>
          </Accordion.Control>
          <Accordion.Panel>
            <SettingsContentMods />
          </Accordion.Panel>
        </Accordion.Item>

        {/* Discord RPC */}
        <Accordion.Item value="discord">
          <Accordion.Control>
            <Group gap="sm"><Activity size={16} /><Text size="sm" fw={500}>{t('settings.discordRpc')}</Text></Group>
          </Accordion.Control>
          <Accordion.Panel>
            <SettingsDiscordRPC />
          </Accordion.Panel>
        </Accordion.Item>

        {/* Playtime Tracking */}
        <Accordion.Item value="playtime">
          <Accordion.Control>
            <Group gap="sm"><Clock size={16} /><Text size="sm" fw={500}>{t('settings.playtimeTracking')}</Text></Group>
          </Accordion.Control>
          <Accordion.Panel>
            <SettingsPlaytime />
          </Accordion.Panel>
        </Accordion.Item>

        {/* Launch Presets */}
        <Accordion.Item value="presets">
          <Accordion.Control>
            <Group gap="sm"><Gamepad2 size={16} /><Text size="sm" fw={500}>{t('settings.launchPresets')}</Text></Group>
          </Accordion.Control>
          <Accordion.Panel>
            <SettingsLaunchPresets />
          </Accordion.Panel>
        </Accordion.Item>

        {/* Cache Cleaner */}
        <Accordion.Item value="cache">
          <Accordion.Control>
            <Group gap="sm"><Trash size={16} /><Text size="sm" fw={500}>{t('settings.cacheCleaner')}</Text></Group>
          </Accordion.Control>
          <Accordion.Panel>
            <SettingsCache />
          </Accordion.Panel>
        </Accordion.Item>

        {/* Roblox Logs */}
        <Accordion.Item value="logs">
          <Accordion.Control>
            <Group gap="sm"><BookOpen size={16} /><Text size="sm" fw={500}>{t('settings.robloxLogs')}</Text></Group>
          </Accordion.Control>
          <Accordion.Panel>
            <SettingsLogs />
          </Accordion.Panel>
        </Accordion.Item>

        {/* Data Management */}
        <Accordion.Item value="data">
          <Accordion.Control>
            <Group gap="sm"><Download size={16} /><Text size="sm" fw={500}>{t('settings.data')}</Text></Group>
          </Accordion.Control>
          <Accordion.Panel>
            <SettingsData />
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </Stack>
  );
}
