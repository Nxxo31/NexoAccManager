// Application View: SettingsView — theme color picker, webserver, devmode — Mantine v7

import { useState, useEffect } from 'react';
import { useMantineColorScheme } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Group, Stack, Text, Switch, Accordion, TextInput, Button, ColorPicker, ColorSwatch, Badge } from '@mantine/core';
import { Moon, Sun, Server, Code, Palette, Globe } from 'lucide-react';

export function SettingsView(): JSX.Element {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const [devmode, setDevmode] = useState(false);
  const [autoRejoin, setAutoRejoin] = useState(false);
  const [apiRunning, setApiRunning] = useState(false);
  const [apiPort, setApiPort] = useState('31415');
  const [primaryColor, setPrimaryColor] = useState('#1d8eff');

  useEffect(() => {
    // Load saved settings
    window.api.settings.get('devmode').then((r) => { if (r.success) setDevmode(Boolean(r.data)); });
    window.api.settings.get('autoRejoin').then((r) => { if (r.success) setAutoRejoin(Boolean(r.data)); });
    window.api.settings.get('primaryColor').then((r) => { if (r.success && r.data) setPrimaryColor(String(r.data)); });
  }, []);

  const handleToggleDevmode = async (val: boolean) => {
    setDevmode(val);
    await window.api.settings.set('devmode', val);
    notifications.show({ message: val ? 'Modo desarrollador activado' : 'Modo desarrollador desactivado', color: 'blue' });
  };

  const handleToggleAutoRejoin = async (val: boolean) => {
    setAutoRejoin(val);
    await window.api.settings.set('autoRejoin', val);
    notifications.show({ message: 'Auto-rejoin ' + (val ? 'activado' : 'desactivado'), color: 'blue' });
  };

  const savePrimaryColor = async (color: string) => {
    setPrimaryColor(color);
    await window.api.settings.set('primaryColor', color);
  };

  const colors = [
    '#1d8eff', // blue (default)
    '#16a34a', // green
    '#dc2626', // red
    '#9333ea', // purple
    '#ea580c', // orange
    '#0891b2', // cyan
    '#db2777', // pink
    '#facc15', // yellow
  ];

  return (
    <Stack gap="md" p="md" h="100%">
      <Text size="lg" fw={600}>Ajustes</Text>

      <Accordion variant="separated">
        {/* Appearance */}
        <Accordion.Item value="appearance">
          <Accordion.Control>
            <Group gap="sm">
              <Palette size={16} />
              <Text size="sm" fw={500}>Apariencia</Text>
            </Group>
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

              {/* Custom primary color */}
              <div>
                <Text size="sm" fw={500} mb="xs">Color principal de NAM</Text>
                <Group gap="xs" mb="sm">
                  {colors.map((c) => (
                    <ColorSwatch
                      key={c}
                      color={c}
                      onClick={() => savePrimaryColor(c)}
                      style={{ cursor: 'pointer', border: primaryColor === c ? '2px solid white' : 'none' }}
                    />
                  ))}
                </Group>
                <ColorPicker
                  value={primaryColor}
                  onChange={savePrimaryColor}
                  format="hex"
                  size="sm"
                />
                <Group gap="xs" mt="sm" align="center">
                  <Text size="xs" c="dimmed">Color seleccionado:</Text>
                  <Badge variant="filled" style={{ backgroundColor: primaryColor }}>{primaryColor}</Badge>
                </Group>
              </div>
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>

        {/* WebServer */}
        <Accordion.Item value="webserver">
          <Accordion.Control>
            <Group gap="sm">
              <Server size={16} />
              <Text size="sm" fw={500}>Servidor web local</Text>
            </Group>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack gap="md" p="xs">
              <Group gap="sm" align="center">
                <Globe size={16} />
                <TextInput
                  placeholder="Puerto"
                  value={apiPort}
                  onChange={(e) => setApiPort(e.currentTarget.value)}
                  size="sm"
                  style={{ width: 100 }}
                />
                <Button
                  variant={apiRunning ? 'light' : 'filled'}
                  color={apiRunning ? 'red' : 'primary'}
                  size="sm"
                  onClick={async () => {
                    if (apiRunning) {
                      const r = await window.api.advanced.localApiStop();
                      if (r.success) { setApiRunning(false); notifications.show({ message: 'Servidor detenido', color: 'green' }); }
                    } else {
                      const r = await window.api.advanced.localApiStart(parseInt(apiPort, 10) || 31415);
                      if (r.success) { setApiRunning(true); notifications.show({ message: `Servidor en http://localhost:${apiPort}`, color: 'green' }); }
                    }
                  }}
                >
                  {apiRunning ? 'Detener' : 'Iniciar'}
                </Button>
              </Group>
              <Text size="xs" c="dimmed">
                API HTTP local para integraciones externas. Lee cuentas directamente de la base de datos local.
              </Text>
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>

        {/* Advanced */}
        <Accordion.Item value="advanced">
          <Accordion.Control>
            <Group gap="sm">
              <Code size={16} />
              <Text size="sm" fw={500}>Avanzado</Text>
            </Group>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack gap="md" p="xs">
              <Group justify="space-between" align="center">
                <Text size="sm">Modo desarrollador</Text>
                <Switch checked={devmode} onChange={(e) => handleToggleDevmode(e.currentTarget.checked)} />
              </Group>
              <Group justify="space-between" align="center">
                <Text size="sm">Auto-rejoin</Text>
                <Switch checked={autoRejoin} onChange={(e) => handleToggleAutoRejoin(e.currentTarget.checked)} />
              </Group>
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </Stack>
  );
}
