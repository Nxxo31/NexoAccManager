// Application Component: AccountCard — individual account display (Mantine v7)
// Extracted from AccountsView for performance — React.memo prevents unnecessary re-renders.
// P-001: extracted to its own file so React.memo works; parent passes memoized callbacks.
// Multi-select: checkbox visible when isMultiSelectMode is active.

import { memo } from 'react';
import { Star, Pencil, Trash2, Shirt } from 'lucide-react';
import { Card, Group, Stack, Text, Badge, Avatar, ActionIcon, Checkbox, Tooltip } from '@mantine/core';
import type { Account } from '../../../domain/entities/Account';
import { t } from '../../../config/i18n';

interface AccountCardProps {
  account: Account;
  selected: boolean;
  onSelect: (account: Account) => void;
  onRemove: (account: Account) => void;
  onToggleFavorite: (account: Account) => void;
  onEdit: (account: Account) => void;
  onSkinEdit?: (account: Account) => void;
  isRemoving?: boolean;
  isTogglingFavorite?: boolean;
  isMultiSelectMode?: boolean;
  isBulkSelected?: boolean;
  onToggleBulkSelect?: (id: string) => void;
}

function AccountCardComponent({
  account,
  selected,
  onSelect,
  onRemove,
  onToggleFavorite,
  onEdit,
  onSkinEdit,
  isRemoving = false,
  isTogglingFavorite = false,
  isMultiSelectMode = false,
  isBulkSelected = false,
  onToggleBulkSelect,
}: AccountCardProps): JSX.Element {
  return (
    <Card
      withBorder
      radius="md"
      padding="sm"
      style={{
        cursor: 'pointer',
        borderColor: isBulkSelected ? 'var(--mantine-color-primary-5)' : selected ? 'var(--mantine-color-primary-5)' : undefined,
        borderWidth: isBulkSelected || selected ? 2 : 1,
        backgroundColor: isBulkSelected ? 'var(--mantine-color-primary-1)' : undefined,
      }}
      onClick={() => {
        if (isMultiSelectMode && onToggleBulkSelect) {
          onToggleBulkSelect(account.id);
        } else {
          onSelect(account);
        }
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (isMultiSelectMode && onToggleBulkSelect) {
            onToggleBulkSelect(account.id);
          } else {
            onSelect(account);
          }
        }
      }}
    >
      <Group justify="space-between" align="center">
        <Group gap="sm" align="center">
          {isMultiSelectMode && (
            <Checkbox
              checked={isBulkSelected}
              onChange={() => onToggleBulkSelect?.(account.id)}
              onClick={(e) => e.stopPropagation()}
              aria-label={t('accounts.selectAccount', { name: account.username })}
              size="sm"
            />
          )}
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
          {!isMultiSelectMode && (
            <>
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
              {onSkinEdit && (
                <Tooltip label={t('accounts.skinEditor')} position="bottom">
                  <ActionIcon
                    variant="subtle"
                    color="grape"
                    onClick={(e) => { e.stopPropagation(); onSkinEdit(account); }}
                    aria-label={t('accounts.skinEditor')}
                  >
                    <Shirt size={14} />
                  </ActionIcon>
                </Tooltip>
              )}
              <ActionIcon
                variant="subtle"
                color="red"
                onClick={(e) => { e.stopPropagation(); onRemove(account); }}
                disabled={isRemoving}
                aria-label={t('accounts.deleteAccount')}
              >
                <Trash2 size={14} />
              </ActionIcon>
            </>
          )}
        </Group>
      </Group>
    </Card>
  );
}

export const AccountCard = memo(AccountCardComponent);
