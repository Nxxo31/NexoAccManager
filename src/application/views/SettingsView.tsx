// Application View: SettingsView — UI settings only (theme, etc.) — Mantine v7

import { useEffect, useState } from 'react';
import { useUIStore } from '../store/uiStore';
import { Group, Stack, Text, Switch, TextInput, NumberInput, Button, Accordion, AccordionItem, AccordionControl, AccordionPanel } from '@mantine/core';
import { Moon, Sun, Globe, Shield, Server, Code, Terminal, Lock, Check } from 'lucide-react';
import { notifications } from '@mantine/notifications';

export function SettingsView(): JSX.Element {
  const { theme: currentTheme, toggleTheme } = useUIStore((s) => s);
  const [webServerPort, setWebServerPort] = useState(3000);
  const [webServerEnabled, setWebServerEnabled] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const [autoRejoin, setAutoRejoin] = useState(false);
  const [password, setPassword] = useState('');

  // Note: For persistence of non-UI settings (web server, dev mode, etc.),
  // these would need to be saved via IPC to settings repo.
  // This MVP version focuses on UI-state persistence via zustand.

  const handleSave = async () => {
    // In a full implementation, these would be saved via IPC to settings repository
    // For now, we show a toast indicating they'd be saved
    notifications.show({ message: 'Ajustes guardados (simulado)', color: 'blue' });
  };

  return (
    <Stack gap="md" p="md" h="100%">
      <Group justify="space-between" align="center" h={12} px="md">
        <Text size="lg" fw={600}>Ajustes</Text>
        <Button variant="filled" color="primary" size="sm" onClick={handleSave}>Guardar</Button>
      </Group>

      <Accordion variant="separated">
        {/* Apariencia */}
        <AccordionItem value="appearance">
          <AccordionControl>
            <Text size="sm" fw={500}>Apariencia</Text>
          </AccordionControl>
          <AccordionPanel p="md">
            <Stack gap="xs">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'xs' }}>
                <Moon size={16} />
                <Switch checked={currentTheme === 'dark'} onChange={toggleTheme} />
                <span>Tema oscuro</span>
              </div>
              <Text size="xs" c="dimmed" mt="xs">
                Reinicia la aplicacion para aplicar el tema en todas las areas.
              </Text>
            </Stack>
          </AccordionPanel>
        </AccordionItem>

        {/* Servidor web */}
        <AccordionItem value="webserver">
          <AccordionControl>
            <Text size="sm" fw={500}>Servidor web</Text>
          </AccordionControl>
          <AccordionPanel p="md">
            <Stack gap="xs">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'xs' }}>
                <Server size={16} />
                <Switch checked={webServerEnabled} onChange={(e) => setWebServerEnabled(e.target.checked)} />
                <span>Habilitar servidor web</span>
              </div>
              {webServerEnabled && (
                <Stack gap="xs" mt="sm">
                  <TextInput
                    label="Puerto"
                    placeholder="Ej: 3000"
                    value={webServerPort}
                    onChange={(e) => setWebServerPort(Number(e.target.value) || 3000)}
                    type="number"
                    min={1}
                    max={65535}
                    size="sm"
                    style={{ width: 100 }}
                  />
                  <Text size="xs" c="dimmed" mt="xs">
                    Accede a http://localhost:{webServerPort} desde tu navegador
                  </Text>
                </Stack>
              )}
            </Stack>
          </AccordionPanel>
        </AccordionItem>

        {/* Avanzado */}
        <AccordionItem value="advanced">
          <AccordionControl>
            <Text size="sm" fw={500}>Avanzado</Text>
          </AccordionControl>
          <AccordionPanel p="md">
            <Stack gap="xs">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'xs' }}>
                <Code size={16} />
                <Switch checked={devMode} onChange={(e) => setDevMode(e.target.checked)} />
                <span>Modo desarrollador</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'xs' }}>
                <Terminal size={16} />
                <Switch checked={autoRejoin} onChange={(e) => setAutoRejoin(e.target.checked)} />
                <span>Auto-rejoin al perder conexión</span>
              </div>
              <Group mt="sm">
                <TextInput
                  label="Password de cifrado (opcional)"
                  placeholder="Dejar vacío para usar solo sal"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  size="sm"
                />
                <Text size="xs" c="dimmed" mt="xs">
                  Protege las cuentas almacenadas con AES-256-GCM
                </Text>
              </Group>
            </Stack>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </Stack>
  );
}