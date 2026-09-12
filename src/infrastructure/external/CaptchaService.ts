import axios from 'axios';
import { SettingsRepositoryImpl } from '../database/SettingsRepositoryImpl';

const settingsRepo = new SettingsRepositoryImpl();

const CAPTCHA_API_KEY_SETTING = 'captcha.apiKey';
const POLL_INTERVAL_MS = 500;
const DEFAULT_TIMEOUT_MS = 30000;

/**
 * Lee la API key de Nopecha desde settings. Si no esta configurada lanza error.
 */
export function getCaptchaApiKey(): string | null {
  const key = settingsRepo.get(CAPTCHA_API_KEY_SETTING);
  return typeof key === 'string' && key.length >= 16 ? key : null;
}

/**
 * Configura la API key de Nopecha. Validacion: 16-128 chars, alphanumeric + dashes.
 */
export function setCaptchaApiKey(apiKey: string): void {
  if (typeof apiKey !== 'string') {
    throw new Error('apiKey debe ser string');
  }
  if (!/^[A-Za-z0-9_-]{16,128}$/.test(apiKey)) {
    throw new Error('apiKey invalido (16-128 chars, alphanumeric/dashes/underscores)');
  }
  settingsRepo.set(CAPTCHA_API_KEY_SETTING, apiKey);
}

/**
 * Solves a captcha using the Nopecha API.
 * @param imageBase64 - Base64 encoded image
 * @param apiKey - Nopecha API key (si no se pasa, lee de settings)
 * @param timeoutMs - Timeout en ms (default 30000)
 */
export async function solveCaptcha(
  imageBase64: string,
  apiKey?: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<string> {
  if (typeof imageBase64 !== 'string' || imageBase64.length === 0) {
    throw new Error('imageBase64 requerido');
  }
  // Fallback chain: param explicito → settings → error
  const key = apiKey ?? getCaptchaApiKey();
  if (!key) {
    throw new Error('Nopecha API key no configurada. Usa captcha:setApiKey en settings.');
  }

  // Step 1: Create the task
  const createResponse = await axios.post('https://api.nopecha.com/task', {
    type: 'image',
    key,
    image: imageBase64,
  }, { timeout: 10_000 });

  if (!createResponse.data || !createResponse.data.id) {
    throw new Error('Failed to create captcha task');
  }

  const taskId = createResponse.data.id;

  // Step 2: Poll for the result
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    const pollResponse = await axios.get(`https://api.nopecha.com/task?key=${key}&id=${taskId}`, { timeout: 5_000 });
    if (pollResponse.data?.status === 'ready') {
      return pollResponse.data.solution;
    }
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error('CAPTCHA solving timed out');
}