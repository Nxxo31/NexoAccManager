import * as React from 'react';
import { motion } from 'framer-motion';
import { Palette, Globe, Shield, Trash2, Download, AlertTriangle, Eraser } from 'lucide-react';
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
    { id: 'dark', label: 'Oscuro' },
    { id: 'light', label: 'Claro' },
    { id: 'roblox-classic', label: 'Roblox Classic' },
    { id: 'custom', label: 'Personalizado' },
  ];

  const languages = [
    { id: 'es', label: 'Español' },
    { id: 'en', label: 'English' },
    { id: 'pt', label: 'Português' },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-6 pt-6 pb-4 border-b border-border/30">
        <h2 className="text-xl font-bold text-foreground">Ajustes</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Personaliza tu experiencia</p>
      </div>

      <div className="px-6 py-6 max-w-3xl space-y-6">
        {/* Appearance */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-6 space-y-5 border-border">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary/10">
                <Palette className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Apariencia</h3>
            </div>

            {/* Theme selector */}
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2.5 block">Tema</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onThemeChange({ theme: t.id })}
                    className={`px-3 py-2.5 rounded-md text-sm font-medium border transition-all ${
                      theme === t.id
                        ? 'border-primary bg-primary/10 text-primary shadow-sm'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted/30 hover:border-border-light'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom colors */}
            {theme === 'custom' && (
              <div className="grid grid-cols-2 gap-4 animate-fade-in">
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1.5 block">Color Primario</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => onThemeChange({ primaryColor: e.target.value })}
                      className="h-10 w-16 rounded-md border border-border cursor-pointer bg-transparent"
                    />
                    <span className="text-sm text-muted-foreground font-mono-data">{primaryColor}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1.5 block">Color Acento</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => onThemeChange({ accentColor: e.target.value })}
                      className="h-10 w-16 rounded-md border border-border cursor-pointer bg-transparent"
                    />
                    <span className="text-sm text-muted-foreground font-mono-data">{accentColor}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Font Size */}
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2.5 block">Tamaño de Fuente</label>
              <div className="flex gap-2">
                {(['small', 'medium', 'large'] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => onThemeChange({ fontSize: size })}
                    className={`px-4 py-1.5 rounded-md text-sm capitalize border transition-all ${
                      fontSize === size
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted/30'
                    }`}
                  >
                    {size === 'small' ? 'Pequeño' : size === 'medium' ? 'Mediano' : 'Grande'}
                  </button>
                ))}
              </div>
            </div>

            {/* UI Density */}
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2.5 block">Densidad UI</label>
              <div className="flex gap-2">
                {(['compact', 'normal', 'spacious'] as const).map((density) => (
                  <button
                    key={density}
                    onClick={() => onThemeChange({ uiDensity: density })}
                    className={`px-4 py-1.5 rounded-md text-sm capitalize border transition-all ${
                      uiDensity === density
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted/30'
                    }`}
                  >
                    {density === 'compact' ? 'Compacta' : density === 'normal' ? 'Normal' : 'Espaciosa'}
                  </button>
                ))}
              </div>
            </div>

            {/* Animations toggle */}
            <div className="flex items-center justify-between pt-1">
              <label className="text-sm font-medium text-foreground">Animaciones</label>
              <button
                onClick={() => onThemeChange({ animationsEnabled: !animationsEnabled })}
                aria-label={animationsEnabled ? 'Desactivar animaciones' : 'Activar animaciones'}
                role="switch"
                aria-checked={animationsEnabled}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  animationsEnabled ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform shadow-sm ${
                    animationsEnabled ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>
          </Card>
        </motion.div>

        {/* Language */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="p-6 space-y-4 border-border">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary/10">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Idioma</h3>
            </div>
            <div className="flex gap-2">
              {languages.map((lng) => (
                <button
                  key={lng.id}
                  onClick={() => onLanguageChange(lng.id)}
                  className={`px-4 py-2 rounded-md text-sm font-medium border transition-all ${
                    language === lng.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:bg-muted/30'
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
          <Card className="p-6 space-y-4 border-border">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Gestión de Datos</h3>
            </div>

            <div className="space-y-3">
              <Button variant="outline" size="sm" onClick={onExportData}>
                <Download className="mr-2 h-4 w-4" />
                Exportar Datos
              </Button>

              <Button variant="outline" size="sm" onClick={onClearCache}>
                <Eraser className="mr-2 h-4 w-4" />
                Limpiar Caché
              </Button>

              {!confirmDelete ? (
                <Button variant="destructive" size="sm" onClick={() => setConfirmDelete(true)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar Todas las Cuentas
                </Button>
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-md bg-destructive/10 border border-destructive/30 animate-fade-in">
                  <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
                  <span className="text-sm text-foreground">¿Estás seguro? Esto no se puede deshacer.</span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      onDeleteAllAccounts();
                      setConfirmDelete(false);
                    }}
                  >
                    Confirmar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)}>
                    Cancelar
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default SettingsPanel;
