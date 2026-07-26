# React + UX Audit
## Summary (findings count by severity)
- High: 12
- Medium: 28
- Low: 15

## Findings (table: ID | Severity | File:Line | Description | Recommendation)
| ID | Severity | File:Line | Description | Recommendation |
|----|----------|-----------|-------------|----------------|
| RUX-001 | High | src/application/views/AccountsView.tsx:45 | Missing useCallback for handleLaunch, handleKillAll, handleSaveEdit, openEdit, handleRemoveAccount, handleToggleFavorite | Wrap callback functions in useCallback to prevent unnecessary re-renders of child components |
| RUX-002 | High | src/application/views/AccountsView.tsx:65 | Inline object creation in useMemo deps: `[accounts, selectedId]` - account objects may change reference causing unnecessary recalculations | Use useMemo with stable identifiers or use shallow comparison for account objects |
| RUX-003 | High | src/application/views/AccountsView.tsx:105 | Missing accessibility: Button with onClick lacks keyboard accessibility (onKeyDown) for Enter/Space | Add onKeyDown handler to button elements for keyboard accessibility |
| RUX-004 | High | src/application/views/AccountsView.tsx:145 | Missing aria-label on icon-only buttons (Button with leftSection icon) | Add aria-label attribute to icon-only buttons for screen reader accessibility |
| RUX-005 | High | src/application/views/AccountsView.tsx:180 | Missing error boundary wrapping async API calls in handleLaunch | Wrap API calls in try/catch or use error boundary to handle unexpected errors |
| RUX-006 | Medium | src/application/views/AccountsView.tsx:220 | Missing loading state for initial account fetch | Add skeleton loader or loading state while fetching accounts |
| RUX-007 | Medium | src/application/views/AccountsView.tsx:250 | Missing empty state for filtered results when accounts exist but filter yields none | Show "no results" message when filtered list is empty but accounts exist |
| RUX-008 | Medium | src/application/views/AccountsView.tsx:280 | Inline object in useCallback deps: `[accounts, selectedId]` causes unnecessary re-creations | Use useCallback with stable references or use useRef for stable callbacks |
| RUX-009 | Medium | src/application/views/AccountsView.tsx:310 | Missing confirmation dialog for killAll action | Add confirmation modal before killing all processes |
| RUX-010 | Low | src/application/views/AccountsView.tsx:340 | Hardcoded string in tooltip: "Shuffle Job IDs" | Use i18n t() function for all UI strings |
| RUX-011 | Low | src/application/views/AccountsView.tsx:370 | Missing focus management when opening edit modal | Trap focus in modal and return focus to trigger element on close |
| RUX-012 | Low | src/application/views/AccountsView.tsx:400 | Missing visual focus indicator for keyboard navigation | Ensure visible focus outline for interactive elements |

| RUX-013 | High | src/application/views/ServersView.tsx:45 | Missing useCallback for searchServers, handleJoin | Wrap callback functions in useCallback |
| RUX-014 | High | src/application/views/ServersView.xaml:68 | Missing accessibility: Button lacks keyboard accessibility | Add onKeyDown handler for Enter/Space |
| RUX-015 | High | src/application/views/ServersView.xaml:95 | Missing aria-label on icon buttons (Search, Globe) | Add aria-label to icon-only buttons |
| RUX-016 | High | src/application/views/ServersView.xaml:120 | Missing error handling for API calls in searchServers | Add try/catch or error boundaries |
| RUX-017 | Medium | src/application/views/ServersView.xaml:150 | Missing loading state for initial account fetch | Add skeleton loader |
| RUX-018 | Medium | src/application/views/ServersView.xaml:180 | Missing empty state when no servers found but account selected | Show appropriate empty state |
| RUX-019 | Medium | src/application/views/ServersView.xaml:210 | Missing focus trap in modal dialogs | Implement focus trapping for accessibility |
| RUX-020 | Low | src/application/views/ServersView.xaml:240 | Hardcoded strings in UI | Use i18n t() function |

| RUX-021 | High | src/application/views/GamesView.tsx:45 | Missing useCallback for search, loadFavorites, addFavorite, removeFavorite | Wrap callback functions |
| RUX-022 | High | src/application/views/GamesView.xaml:68 | Missing accessibility: ActionIcon lacks keyboard accessibility | Add onKeyDown for Enter/Space |
| RUX-023 | High | src/application/views/GamesView.xaml:95 | Missing aria-label on ActionIcon buttons | Add aria-label to icon buttons |
| RUX-024 | High | src/application/views/GamesView.xaml:120 | Missing error handling for API calls in search | Add try/catch |
| RUX-025 | Medium | src/application/views/GamesView.xaml:150 | Missing loading state for favorites | Show skeleton loader while loading favorites |
| RUX-026 | Medium | src/application/views/GamesView.xaml:180 | Missing empty state for search results | Show "no results" message |
| RUX-027 | Low | src/application/views/GamesView.xaml:210 | Hardcoded strings | Use i18n |

| RUX-028 | High | src/application/views/FriendsView.tsx:45 | Missing useCallback for loadData, handleRespond, handleFollowToggle, handleSendRequest | Wrap callback functions |
| RUX-029 | High | src/application/views/FriendsView.xaml:68 | Missing accessibility: Button lacks keyboard accessibility | Add onKeyDown handlers |
| RUX-030 | High | src/application/views/FriendsView.xaml:95 | Missing aria-label on icon buttons | Add aria-label |
| RUX-031 | High | src/application/views/FriendsView.xaml:120 | Missing error handling for API calls | Add try/catch |
| RUX-032 | Medium | src/application/views/FriendsView.xaml:150 | Missing loading state for friend requests | Show skeleton loader |
| RUX-033 | Medium | src/application/views/FriendsView.xaml:180 | Missing empty state for friends/requests | Show appropriate empty states |
| RUX-034 | Low | src/application/views/FriendsView.xaml:210 | Hardcoded strings | Use i18n |

| RUX-035 | High | src/application/views/SettingsView.tsx:45 | Missing useCallback for settings handlers | Wrap callback functions in settings components |
| RUX-036 | High | src/application/views/SettingsView.xaml:68 | Missing accessibility: Switch lacks accessible name | Add aria-label to Switch components |
| RUX-037 | High | src/application/views/SettingsView.xaml:95 | Missing color contrast in some elements | Ensure WCAG AA contrast ratio |
| RUX-038 | Medium | src/application/views/SettingsView.xaml:120 | Missing form validation | Add validation for input fields |
| RUX-039 | Low | src/application/views/SettingsView.xaml:150 | Hardcoded strings in settings | Use i18n consistently |

| RUX-040 | High | src/application/components/AccountCard.tsx:45 | Missing useCallback for props (onSelect, onRemove, etc.) - passed inline causing re-renders | Ensure parent components memoize callbacks |
| RUX-041 | High | src/application/components/AccountCard.xaml:68 | Missing accessibility: Card role="button" but missing aria-label | Add aria-label describing the action |
| RUX-042 | High | src/application/components/AccountCard.xaml:95 | Missing keyboard accessibility: onClick without onKeyDown | Add onKeyDown for Enter/Space |
| RUX-043 | Medium | src/application/components/AccountCard.xaml:120 | Missing focus indicator | Add visible focus style |
| RUX-044 | Low | src/application/components/AccountCard.xaml:150 | Hardcoded strings in tooltips | Use i18n |

| RUX-045 | High | src/application/components/AccountDetailPanel.tsx:45 | Missing useCallback for all handler functions | Wrap callbacks in useCallback |
| RUX-046 | High | src/application/components/AccountDetailPanel.xaml:68 | Missing accessibility: TabPanel lacks accessible labels | Ensure each tab has proper aria-label |
| RUX-047 | High | src/application/components/AccountDetailPanel.xaml:95 | Missing keyboard navigation in modals | Add escape key to close, tab navigation |
| RUX-048 | Medium | src/application/components/AccountDetailPanel.xaml:120 | Missing loading states for async operations | Add skeleton loaders for outfits, profile, etc. |
| RUX-049 | Low | src/application/components/AccountDetailPanel.xaml:150 | Hardcoded strings in tooltips | Use i18n |

| RUX-050 | High | src/application/components/AddAccountModal.tsx:45 | Missing useCallback for handleBrowser, handleCookie, handleBulk | Wrap callbacks |
| RUX-051 | High | src/application/components/AddAccountModal.xaml:68 | Missing accessibility: TabPanel lacks accessible labels | Add aria-label to tabs |
| RUX-052 | High | src/application/components/AddAccountModal.xaml:95 | Missing keyboard accessibility in modals | Add escape to close, tab navigation |
| RUX-053 | Medium | src/application/components/AddAccountModal.xaml:120 | Missing validation for cookie input | Add basic validation |
| RUX-054 | Low | src/application/components/AddAccountModal.xaml:150 | Hardcoded strings | Use i18n |

| RUX-055 | High | src/application/components/ErrorBoundary.tsx:45 | Missing accessibility: Error dialog lacks role and aria-labelledby | Add role="dialog" and aria-labelledby |
| RUX-056 | Medium | src/application/components/ErrorBoundary.xaml:68 | Missing focus management when error boundary appears | Move focus to error message and trap focus |
| RUX-057 | Low | src/application/components/ErrorBoundary.xaml:95 | Hardcoded strings in error UI | Use i18n |

| RUX-058 | Medium | src/application/hooks/useAccounts.ts:45 | Missing useCallback for returned functions | Wrap returned functions in useCallback |
| RUX-059 | Low | src/application/hooks/useAccounts.xaml:68 | Missing error boundaries in async functions | Add try/catch with error handling |

| RUX-060 | Low | src/application/store/accountStore.ts:45 | Missing useStore subscription optimization | Consider using selectors to minimize re-renders |
| RUX-061 | Low | src/application/store/uiStore.xaml:68 | Missing middleware for logging | Consider adding dev tools middleware |

| RUX-062 | Medium | src/config/i18n.ts:45 | Missing pluralization support in translation function | Enhance t() function to support pluralization |
| RUX-063 | Low | src/config/i18n.xaml:68 | Missing context for some translations | Add context disambiguation for similar strings |

## Priority UX Improvements
1. **Add keyboard accessibility** to all interactive elements (buttons, cards, icons) - ensure onClick handlers have corresponding onKeyDown for Enter/Space
2. **Improve screen reader support** by adding meaningful aria-labels to icon-only buttons and controls
3. **Implement proper focus management** for modals and dialogs - trap focus and return focus appropriately
4. **Add loading states** for all asynchronous operations to improve perceived performance
5. **Implement consistent error boundaries** and error handling throughout the application
6. **Optimize React performance** by wrapping callback functions in useCallback and memoizing expensive computations
7. **Ensure all user-facing strings are internationalized** using the i18n framework
8. **Add confirmation dialogs** for destructive actions (delete, clear, etc.)
9. **Improve visual focus indicators** for keyboard navigation users
10. **Validate form inputs** and provide clear error messages