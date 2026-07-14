/**
 * LoginBrowserService - Login con ventana de navegador de Roblox
 *
 * Abre un BrowserWindow que carga roblox.com, el usuario inicia sesión normalmente,
 * y capturamos la cookie .ROBLOSECURITY automáticamente del session.cookies.
 *
 * Inspirado en el flujo de RAM Original (ic3w0lf22).
 *
 * Seguridad:
 * - La ventana usa su propia session partition (aislada)
 * - nodeIntegration: false, contextIsolation: true
 * - Solo interceptamos la cookie .ROBLOSECURITY
 * - La cookie se procesa en main process, nunca llega al renderer
 */

import { BrowserWindow, session } from 'electron';
import axios, { AxiosError } from 'axios';
import * as path from 'path';

export interface BrowserLoginResult {
  cookie: string;
  userId: number;
  username: string;
}

export class LoginBrowserService {
  /**
   * Abre una ventana de navegador cargando roblox.com.
   * El usuario inicia sesión normalmente.
   * Cuando se detecta la cookie .ROBLOSECURITY, la ventana se cierra
   * y se devuelve el resultado.
   */
  async loginWithBrowser(): Promise<BrowserLoginResult> {
    return new Promise((resolve, reject) => {
      // Usar una session partition aislada para no contaminar la session principal
      const partitionName = `nexo-login-${Date.now()}`;
      const loginSession = session.fromPartition(partitionName);

      // --- Limpieza centralizada ---
      let cookieListener: ((_event: Electron.Event, cookie: Electron.Cookie, cause: string) => void) | null = null;
      let headersListener: ((details: Electron.OnBeforeSendHeadersListenerDetails, callback: (modified: Electron.BeforeSendResponse) => void) => void) | null = null;
      let windowClosedHandler: (() => void) | null = null;

      const cleanup = () => {
        if (cookieListener) {
          loginSession.cookies.removeListener('changed', cookieListener);
          cookieListener = null;
        }
        if (headersListener) {
          loginSession.webRequest.onBeforeSendHeaders(null as unknown as never, headersListener);
          headersListener = null;
        }
        // Limpiar datos de la session partition
        loginSession.clearStorageData().catch(() => {});
      };

      // Configurar User-Agent realista (evitar que Roblox detecte Electron)
      headersListener = (details, callback) => {
        const headers = { ...details.requestHeaders };
        if (!headers['User-Agent'] || headers['User-Agent'].includes('Electron')) {
          headers['User-Agent'] =
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';
        }
        callback({ requestHeaders: headers });
      };
      loginSession.webRequest.onBeforeSendHeaders(headersListener);

      let cookieCaptured = false;
      let resolved = false;

      const loginWindow = new BrowserWindow({
        width: 800,
        height: 700,
        minWidth: 600,
        minHeight: 500,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: true,
          session: loginSession,
        },
        title: 'Iniciar sesión en Roblox — NexoAccManager',
        icon: path.join(__dirname, '../../public/icon.png'),
        autoHideMenuBar: true,
      });

      loginWindow.loadURL('https://www.roblox.com/login');

      // Timeout de 5 minutos
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          cleanup();
          try { loginWindow.close(); } catch {}
          reject(new Error('Tiempo de espera agotado. Vuelve a intentarlo.'));
        }
      }, 5 * 60 * 1000);

      // Escuchar cambios de cookies
      cookieListener = async (_event, cookie, cause) => {
        if (cookie.name === '.ROBLOSECURITY' && !cookieCaptured && (cause === 'explicit' || cause === 'overwrite')) {
          cookieCaptured = true;

          const cookieValue = cookie.value;
          if (!cookieValue || cookieValue.length < 10) {
            cookieCaptured = false;
            return;
          }

          try {
            const userInfo = await this.getUserInfo(cookieValue);

            resolved = true;
            clearTimeout(timeout);
            cleanup();

            setTimeout(() => {
              try { loginWindow.close(); } catch {}
            }, 500);

            resolve({
              cookie: cookieValue,
              userId: userInfo.id,
              username: userInfo.username,
            });
          } catch {
            cookieCaptured = false;
          }
        }
      };
      loginSession.cookies.on('changed', cookieListener);

      // Si el usuario cierra la ventana manualmente
      windowClosedHandler = () => {
        clearTimeout(timeout);
        if (!resolved) {
          resolved = true;
          cleanup();
          reject(new Error('Ventana cerrada por el usuario antes de completar el login.'));
        }
      };
      loginWindow.on('closed', windowClosedHandler);

      loginWindow.setMenuBarVisibility(false);
    });
  }

  /**
   * Obtiene info del usuario autenticado usando la cookie capturada
   */
  private async getUserInfo(cookie: string): Promise<{ id: number; username: string }> {
    try {
      const response = await axios.get('https://users.roblox.com/v1/users/authenticated', {
        headers: { Cookie: `.ROBLOSECURITY=${cookie}` },
        timeout: 10000,
        validateStatus: (status) => status < 500,
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error('Cookie inválida o expirada');
      }

      if (response.data && typeof response.data.id === 'number' && typeof response.data.name === 'string') {
        return {
          id: response.data.id,
          username: response.data.name,
        };
      }
      throw new Error('Respuesta inválida de Roblox');
    } catch (error) {
      if (error instanceof AxiosError && error.code === 'ECONNABORTED') {
        throw new Error('Tiempo de espera agotado verificando la cookie');
      }
      if (error instanceof Error && error.message.includes('Cookie inválida')) {
        throw error;
      }
      throw new Error('No se pudo verificar la cookie. La sesión podría no ser válida.');
    }
  }
}
