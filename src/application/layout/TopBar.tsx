// Application Layout: TopBar — search + add + theme toggle with Tailwind

import { Search, Plus, Moon, Sun } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { useUIStore } from '../store/uiStore';

interface TopBarProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onAddAccount: () => void;
  searchQuery: string;
  onSearch: (q: string) => void;
}

export function TopBar({ theme, onToggleTheme, onAddAccount, searchQuery, onSearch }: TopBarProps): JSX.Element {
  return (
    <div className="flex items-center h-12 border-b px-4 gap-3 flex-shrink-0"
      style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
      {/* Search */}
      <div className="relative flex-1 max-w-xs">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
        <Input value={searchQuery} onChange={(e) => onSearch(e.target.value)} placeholder="Buscar cuentas..." className="pl-8 h-8 text-xs" />
      </div>
      <div className="flex-1" />
      {/* Add */}
      <Button variant="primary" size="sm" onClick={onAddAccount}>
        <Plus size={14} /> Agregar
      </Button>
      {/* Theme toggle */}
      <Button variant="ghost" size="icon" onClick={onToggleTheme} aria-label="Cambiar tema">
        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      </Button>
    </div>
  );
}
