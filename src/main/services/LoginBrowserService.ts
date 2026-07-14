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

import { BrowserWindow, session, app } from 'electron';
import axios from 'axios';
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

      // Configurar User-Agent realista
      loginSession.webRequest.onBeforeSendHeaders((details, callback) => {
        // Clonar headers existentes
        const headers = { ...details.requestHeaders };
        // Asegurar que tenemos un User-Agent de navegador real
        if (!headers['User-Agent'] || headers['User-Agent'].includes('Electron')) {
          headers['User-Agent'] =
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
        }
        callback({ requestHeaders: headers });
      });

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
          // Sin preload — ventana pura de navegador
        },
        title: 'Iniciar sesión en Roblox — NexoAccManager',
        icon: path.join(__dirname, '../../public/icon.png'),
        autoHideMenuBar: true,
      });

      // Cargar Roblox login
      loginWindow.loadURL('https://www.roblox.com/login');

      // Timeout de 5 minutos — si el usuario no completa, rechazar
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          try { loginWindow.close(); } catch {}
          reject(new Error('Tiempo de espera agotado. Vuelve a intentarlo.'));
        }
      }, 5 * 60 * 1000);

      // Escuchar cambios de cookies
      loginSession.cookies.on('changed', async (_event, cookie, cause) => {
        // Solo nos interesa .ROBLOSECURITY cuando se set o updated
        if (cookie.name === '.ROBLOSECURITY' && !cookieCaptured && (cause === 'explicit' || cause === 'overwrite')) {
          cookieCaptured = true;

          const cookieValue = cookie.value;
          if (!cookieValue || cookieValue.length < 20) {
            return; // cookie vacía o inválida, esperar
          }

          try {
            // Verificar la cookie y obtener info del usuario
            const userInfo = await this.getUserInfo(cookieValue);

            resolved = true;
            clearTimeout(timeout);

            // Cerrar la ventana
            setTimeout(() => {
              try { loginWindow.close(); } catch {}
              // Limpiar la session partition
              loginSession.clearStorageData().catch(() => {});
            }, 500);

            resolve({
              cookie: cookieValue,
              userId: userInfo.id,
              username: userInfo.username,
            });
          } catch (err) {
            // La cookie no es válida todavía, seguir esperando
            cookieCaptured = false;
          }
        }
      });

      // Si el usuario cierra la ventana manualmente antes de completar
      loginWindow.on('closed', () => {
        clearTimeout(timeout);
        if (!resolved) {
          reject(new Error('Ventana cerrada por el usuario antes de completar el login.'));
        }
      });

      // Remover la barra de menú
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
      });
      if (response.data && response.data.id && response.data.name) {
        return {
          id: response.data.id,
          username: response.data.name,
        };
      }
      throw new Error('Respuesta inválida de Roblox');
    } catch (error) {
      throw new Error('No se pudo verificar la cookie. La sesión podría no ser válida.');
    }
  }
}
