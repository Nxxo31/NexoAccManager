// Application Layout: TopBar — search + add + theme toggle with Mantine v7

import { Search, Plus, Moon, Sun } from 'lucide-react';
import { Group, TextInput, Button, ActionIcon, useMantineColorScheme } from '@mantine/core';

interface TopBarProps {
  onAddAccount: () => void;
  searchQuery: string;
  onSearch: (q: string) => void;
}

export function TopBar({ onAddAccount, searchQuery, onSearch }: TopBarProps): JSX.Element {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  return (
    <Group h={48} px="md" gap="sm" align="center" style={{ flexShrink: 0 }}>
      <TextInput
        leftSection={<Search size={14} />}
        placeholder="Buscar cuentas..."
        value={searchQuery}
        onChange={(e) => onSearch(e.target.value)}
        size="sm"
        style={{ maxWidth: 300, flex: 1 }}
      />
      <div style={{ flex: 1 }} />
      <Button variant="filled" color="primary" size="sm" leftSection={<Plus size={14} />} onClick={onAddAccount}>
        Agregar
      </Button>
      <ActionIcon variant="subtle" color={colorScheme === 'dark' ? 'yellow' : 'gray'} onClick={toggleColorScheme} aria-label="Cambiar tema">
        {colorScheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      </ActionIcon>
    </Group>
  );
}
