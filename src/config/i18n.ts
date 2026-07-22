// Config: i18n translations (ES/EN/PT) — minimal inline

export type LangId = 'es' | 'en' | 'pt';

export const translations: Record<LangId, Record<string, string>> = {
  es: {
    'nav.accounts': 'Cuentas',
    'nav.servers': 'Servidores',
    'nav.games': 'Juegos',
    'nav.friends': 'Amigos',
    'nav.settings': 'Ajustes',
    'accounts.empty': 'No hay cuentas agregadas',
    'accounts.add': 'Iniciar sesión',
    'accounts.count': '{count} / 50 cuentas',
    'accounts.addcookie': 'Agregar cookie',
    'accounts.loginbrowser': 'Login browser',
    'servers.placeid': 'Place ID',
    'servers.search': 'Buscar',
    'games.search': 'Buscar juego...',
    'friends.friends': 'Amigos',
    'friends.requests': 'Solicitudes',
    'friends.followers': 'Seguidores',
    'settings.general': 'General',
    'settings.savepasswords': 'Guardar contraseñas (cifrado AES-256)',
    'settings.botting': 'Botting',
    'settings.enablebotting': 'Activar modo botting',
    'settings.interval': 'Intervalo (minutos)',
    'settings.advanced': 'Avanzado',
    'settings.export': 'Exportar datos',
    'settings.deleteall': 'Borrar todo',
    'settings.clearcache': 'Limpiar cache',
  },
  en: {
    'nav.accounts': 'Accounts',
    'nav.servers': 'Servers',
    'nav.games': 'Games',
    'nav.friends': 'Friends',
    'nav.settings': 'Settings',
    'accounts.empty': 'No accounts added',
    'accounts.add': 'Sign in',
    'accounts.count': '{count} / 50 accounts',
    'accounts.addcookie': 'Add cookie',
    'accounts.loginbrowser': 'Login browser',
    'servers.placeid': 'Place ID',
    'servers.search': 'Search',
    'games.search': 'Search games...',
    'friends.friends': 'Friends',
    'friends.requests': 'Requests',
    'friends.followers': 'Followers',
    'settings.general': 'General',
    'settings.savepasswords': 'Save passwords (AES-256 encrypted)',
    'settings.botting': 'Botting',
    'settings.enablebotting': 'Enable botting mode',
    'settings.interval': 'Interval (minutes)',
    'settings.advanced': 'Advanced',
    'settings.export': 'Export data',
    'settings.deleteall': 'Delete all',
    'settings.clearcache': 'Clear cache',
  },
  pt: {
    'nav.accounts': 'Contas',
    'nav.servers': 'Servidores',
    'nav.games': 'Jogos',
    'nav.friends': 'Amigos',
    'nav.settings': 'Configurações',
    'accounts.empty': 'Nenhuma conta adicionada',
    'accounts.add': 'Entrar',
    'accounts.count': '{count} / 50 contas',
    'accounts.addcookie': 'Adicionar cookie',
    'accounts.loginbrowser': 'Login browser',
    'servers.placeid': 'Place ID',
    'servers.search': 'Buscar',
    'games.search': 'Buscar jogos...',
    'friends.friends': 'Amigos',
    'friends.requests': 'Solicitações',
    'friends.followers': 'Seguidores',
    'settings.general': 'Geral',
    'settings.savepasswords': 'Salvar senhas (criptografia AES-256)',
    'settings.botting': 'Botting',
    'settings.enablebotting': 'Ativar modo botting',
    'settings.interval': 'Intervalo (minutos)',
    'settings.advanced': 'Avançado',
    'settings.export': 'Exportar dados',
    'settings.deleteall': 'Apagar tudo',
    'settings.clearcache': 'Limpar cache',
  },
};

let currentLang: LangId = 'es';

export function setLang(lang: LangId): void { currentLang = lang; }
export function getLang(): LangId { return currentLang; }

export function t(key: string, vars?: Record<string, string | number>): string {
  let str = translations[currentLang][key] ?? translations.es[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(`{${k}}`, String(v));
    }
  }
  return str;
}
