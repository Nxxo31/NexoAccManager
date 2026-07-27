// Application Component: AccountCard — individual account display (Mantine v7)
// Extracted from AccountsView for performance — React.memo prevents unnecessary re-renders.
// P-001: extracted to its own file so React.memo works; parent passes memoized callbacks.

import { memo } from 'react';
import { Star, Pencil, Trash2 } from 'lucide-react';
import { Card, Group, Stack, Text, Badge, Avatar, ActionIcon } from '@mantine/core';
import type { Account } from '../../../domain/entities/Account';
import { t } from '../../../config/i18n';

interface AccountCardProps {
  account: Account;
  selected: boolean;
  onSelect: (account: Account) => void;
  onRemove: (account: Account) => void;
  onToggleFavorite: (account: Account) => void;
  onEdit: (account: Account) => void;
  isRemoving?: boolean;
  isTogglingFavorite?: boolean;
}

function AccountCardComponent({
  account,
  selected,
  onSelect,
  onRemove,
  onToggleFavorite,
  onEdit,
  isRemoving = false,
  isTogglingFavorite = false,
}: AccountCardProps): JSX.Element {
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
      onClick={() => onSelect(account)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(account);
        }
      }}
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
          {/* A-003: Color como unico indicador - anadir texto a badge cookie */}
          <Badge size="xs" variant="light" color={account.cookieExpiresAt ? 'green' : 'red'}>
            {account.cookieExpiresAt ? t('accounts.cookieValid') : t('accounts.cookieExpired')}
          </Badge>
          <ActionIcon
            variant="subtle"
            color={account.isFavorite ? 'yellow' : 'gray'}
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(account); }}
            disabled={isTogglingFavorite}
            aria-label={account.isFavorite ? t('accounts.removeFavorite') : t('accounts.addFavorite')}
          >
            <Star size={14} fill={account.isFavorite ? 'currentColor' : 'none'} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={(e) => { e.stopPropagation(); onEdit(account); }}
            aria-label={t('accounts.editAccount')}
          >
            <Pencil size={14} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="red"
            onClick={(e) => { e.stopPropagation(); onRemove(account); }}
            disabled={isRemoving}
            aria-label={t('accounts.deleteAccount')}
          >
            <Trash2 size={14} />
          </ActionIcon>
        </Group>
      </Group>
    </Card>
  );
}

export const AccountCard = memo(AccountCardComponent);
