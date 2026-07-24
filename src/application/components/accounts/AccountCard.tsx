// Application Component: AccountCard — individual account display (Mantine v7)
// Extracted from AccountsView for performance — React.memo prevents unnecessary re-renders.

import { memo } from 'react';
import { Star, Pencil, Trash2 } from 'lucide-react';
import { Card, Group, Stack, Text, Badge, Avatar, ActionIcon } from '@mantine/core';
import type { Account } from '../../../domain/entities/Account';

interface AccountCardProps {
  account: Account;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onToggleFavorite: () => void;
  onEdit: () => void;
}

function AccountCardComponent({ account, selected, onSelect, onRemove, onToggleFavorite, onEdit }: AccountCardProps): JSX.Element {
  return (
    <Card
      withBorder
      radius="md"
      padding="sm"
      style={{
        cursor: 'pointer',
        borderColor: selected ? 'var(--mantine-color-primary-5)' : undefined,
        borderWidth: selected ? 2 : 1,
      }}
      onClick={onSelect}
    >
      <Group justify="space-between" align="center">
        <Group gap="sm" align="center">
          <Avatar size="sm" radius="xl" style={{ backgroundColor: 'var(--mantine-color-gray-4)' }}>
            {account.username.charAt(0).toUpperCase()}
          </Avatar>
          <Stack gap={2}>
            <Text size="sm" fw={500}>{account.username}</Text>
            {account.group && <Badge size="xs" variant="light" color="blue">{account.group}</Badge>}
            {account.description && <Text size="xs" c="dimmed" lineClamp={1}>{account.description}</Text>}
          </Stack>
        </Group>
        <Group gap="xs">
          <Badge size="xs" variant="light" color={account.cookieExpiresAt ? 'green' : 'red'}>
            {account.cookieExpiresAt ? 'Valida' : 'Expirada'}
          </Badge>
          <ActionIcon variant="subtle" color={account.isFavorite ? 'yellow' : 'gray'} onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}>
            <Star size={14} fill={account.isFavorite ? 'currentColor' : 'none'} />
          </ActionIcon>
          <ActionIcon variant="subtle" color="gray" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
            <Pencil size={14} />
          </ActionIcon>
          <ActionIcon variant="subtle" color="gray" onClick={(e) => { e.stopPropagation(); onRemove(); }}>
            <Trash2 size={14} />
          </ActionIcon>
        </Group>
      </Group>
    </Card>
  );
}

export const AccountCard = memo(AccountCardComponent);
