import * as React from 'react';
import { motion } from 'framer-motion';
import { Palette, Globe, Shield, Trash2, Download, AlertTriangle } from 'lucide-react';
import { Card } from '@renderer/components/ui/card';
import { Button } from '@renderer/components/ui/button';

interface SettingsPanelProps {
  theme: string;
  primaryColor: string;
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large';
  uiDensity: 'compact' | 'normal' | 'spacious';
  animationsEnabled: boolean;
  language: string;
  onThemeChange: (settings: Partial<{
    theme: string;
    primaryColor: string;
    accentColor: string;
    fontSize: 'small' | 'medium' | 'large';
    uiDensity: 'compact' | 'normal' | 'spacious';
    animationsEnabled: boolean;
  }>) => void;
  onLanguageChange: (lang: string) => void;
  onExportData: () => void;
  onDeleteAllAccounts: () => void;
  onClearCache: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  theme,
  primaryColor,
  accentColor,
  fontSize,
  uiDensity,
  animationsEnabled,
  language,
  onThemeChange,
  onLanguageChange,
  onExportData,
  onDeleteAllAccounts,
  onClearCache,
}) => {
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  const themes = [
    { id: 'dark', label: 'Dark' },
    { id: 'light', label: 'Light' },
    { id: 'roblox-classic', label: 'Roblox Classic' },
    { id: 'custom', label: 'Custom' },
  ];

  const languages = [
    { id: 'es', label: 'Español' },
    { id: 'en', label: 'English' },
    { id: 'pt', label: 'Português' },
  ];

  return (
    <div className="space-y-6 p-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">Customize your experience</p>
      </div>

      {/* Appearance */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Palette className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Appearance</h3>
          </div>

          {/* Theme selector */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Theme</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onThemeChange({ theme: t.id })}
                  className={`px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
                    theme === t.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom colors */}
          {theme === 'custom' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Primary Color</label>
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => onThemeChange({ primaryColor: e.target.value })}
                  className="h-10 w-full rounded-md border border-border cursor-pointer"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Accent Color</label>
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => onThemeChange({ accentColor: e.target.value })}
                  className="h-10 w-full rounded-md border border-border cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Font Size */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Font Size</label>
            <div className="flex gap-2">
              {(['small', 'medium', 'large'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => onThemeChange({ fontSize: size })}
                  className={`px-3 py-1.5 rounded-md text-sm capitalize border transition-colors ${
                    fontSize === size
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* UI Density */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">UI Density</label>
            <div className="flex gap-2">
              {(['compact', 'normal', 'spacious'] as const).map((density) => (
                <button
                  key={density}
                  onClick={() => onThemeChange({ uiDensity: density })}
                  className={`px-3 py-1.5 rounded-md text-sm capitalize border transition-colors ${
                    uiDensity === density
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {density}
                </button>
              ))}
            </div>
          </div>

          {/* Animations */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Enable Animations</label>
            <button
              onClick={() => onThemeChange({ animationsEnabled: !animationsEnabled })}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                animationsEnabled ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                  animationsEnabled ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>
        </Card>
      </motion.div>

      {/* Language */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Language</h3>
          </div>
          <div className="flex gap-2">
            {languages.map((lng) => (
              <button
                key={lng.id}
                onClick={() => onLanguageChange(lng.id)}
                className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
                  language === lng.id
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted'
                }`}
              >
                {lng.label}
              </button>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Data Management */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Data Management</h3>
          </div>

          <div className="space-y-3">
            <Button variant="outline" size="sm" onClick={onExportData}>
              <Download className="mr-2 h-4 w-4" />
              Export Account Data
            </Button>

            <Button variant="outline" size="sm" onClick={onClearCache}>
              Clear Cache
            </Button>

            {!confirmDelete ? (
              <Button variant="destructive" size="sm" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete All Accounts
              </Button>
            ) : (
              <div className="flex items-center gap-3 p-3 rounded-md bg-destructive/10 border border-destructive">
                <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
                <span className="text-sm text-foreground">Are you sure? This cannot be undone.</span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    onDeleteAllAccounts();
                    setConfirmDelete(false);
                  }}
                >
                  Confirm
                </Button>
                <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)}>
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default SettingsPanel;