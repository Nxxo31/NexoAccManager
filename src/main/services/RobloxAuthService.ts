/**
 * RobloxAuthService - Login con username/password de Roblox
 *
 * Permite a los usuarios iniciar sesión con sus credenciales de Roblox
 * en lugar de copiar/pegar manualmente la cookie .ROBLOSECURITY.
 *
 * Flujo:
 * 1. POST a auth.roblox.com/v2/logout para obtener X-CSRF-Token
 * 2. POST a auth.roblox.com/v2/login con username/password
 * 3. Capturar cookie .ROBLOSECURITY del Set-Cookie header
 * 4. Verificar la cookie contra users.roblox.com/v1/users/authenticated
 * 5. Devolver { cookie, userId, username }
 *
 * Seguridad:
 * - Las credenciales se envían solo a roblox.com via HTTPS
 * - No se almacenan — solo se usa la cookie resultante
 * - El proceso es 100% local
 */

import axios, { AxiosError } from 'axios';

export interface RobloxLoginResult {
  cookie: string;
  userId: number;
  username: string;
}

export interface RobloxLoginError {
  message: string;
  requires2FA?: boolean;
  requiresCaptcha?: boolean;
}

export class RobloxAuthService {
  /**
   * Inicia sesión en Roblox con username y password.
   * Devuelve la cookie .ROBLOSECURITY + info del usuario.
   */
  async login(username: string, password: string): Promise<RobloxLoginResult> {
    if (!username || !password) {
      throw new Error('Username y password son requeridos');
    }

    // Paso 1: Obtener X-CSRF-Token
    const csrfToken = await this.getCsrfToken();

    // Paso 2: Login con credenciales
    let cookie: string;
    let userId: number;
    let robloxUsername: string;

    try {
      const response = await axios.post(
        'https://auth.roblox.com/v2/login',
        {
          username: username.trim(),
          password: password,
          captcha: null,
          captchaToken: null,
          captchaProvider: 'PROVIDER_ARKOSE_LABS',
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': csrfToken,
          },
          validateStatus: () => true,
          maxRedirects: 0,
          timeout: 15000,
        }
      );

      // Check for 2FA
      if (response.status === 403 && response.data?.errors?.[0]?.code === 0) {
        const err: RobloxLoginError = {
          message: 'Esta cuenta requiere verificación en dos pasos (2FA). Por favor usa el método de cookie.',
          requires2FA: true,
        };
        throw Object.assign(new Error(err.message), err);
      }

      // Check for captcha
      if (response.status === 403 && response.data?.errors?.[0]?.code === 1) {
        const err: RobloxLoginError = {
          message: 'Roblox requiere un captcha. Por favor usa el método de cookie.',
          requiresCaptcha: true,
        };
        throw Object.assign(new Error(err.message), err);
      }

      if (response.status !== 200) {
        const errMsg = response.data?.errors?.[0]?.message || `Login fallido (HTTP ${response.status})`;
        throw new Error(errMsg);
      }

      // Extraer cookie del Set-Cookie header
      const setCookieHeader = response.headers['set-cookie'];
      if (!setCookieHeader) {
        throw new Error('No se recibió cookie de Roblox en la respuesta');
      }

      // Buscar .ROBLOSECURITY en los cookies
      const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
      const robloxCookieRaw = cookies.find((c: string) => c.includes('.ROBLOSECURITY='));
      if (!robloxCookieRaw) {
        throw new Error('No se encontró .ROBLOSECURITY en la respuesta de login');
      }

      // Extraer el valor de la cookie
      const match = robloxCookieRaw.match(/\.ROBLOSECURITY=([^;]+)/);
      if (!match) {
        throw new Error('Formato de cookie inválido en respuesta de login');
      }
      cookie = match[1];

      // Obtener userId del body de respuesta
      userId = response.data?.user?.id || 0;
      robloxUsername = response.data?.user?.name || username;

      if (!userId) {
        // Si el body no trae userId, verificar con la cookie
        const userInfo = await this.getUserInfo(cookie);
        userId = userInfo.id;
        robloxUsername = userInfo.username;
      }
    } catch (error) {
      if (error instanceof Error && 'requires2FA' in error) {
        throw error;
      }
      if (error instanceof Error && 'requiresCaptcha' in error) {
        throw error;
      }
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        const errData = axiosError.response.data as any;
        const errMsg = errData?.errors?.[0]?.message || `Error de login (HTTP ${axiosError.response.status})`;
        throw new Error(errMsg);
      }
      throw new Error(`Error de red al iniciar sesión: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Validar que la cookie tenga el formato correcto
    if (!cookie.startsWith('_|WARNING:-DO-NOT-SHARE|_')) {
      // Algunas cuentas devuelven cookies sin el prefijo de warning
      // pero siguen siendo válidas. Lo intentamos verificar.
      const verified = await this.verifyCookie(cookie);
      if (!verified) {
        throw new Error('La cookie recibida no es válida');
      }
    }

    return { cookie, userId, username: robloxUsername };
  }

  /**
   * Obtiene el X-CSRF-Token haciendo POST a auth.roblox.com/v2/logout
   * Roblox devuelve el token en el header x-csrf-token de la respuesta 403
   */
  private async getCsrfToken(): Promise<string> {
    try {
      await axios.post('https://auth.roblox.com/v2/logout', {}, {
        headers: { 'Content-Type': 'application/json' },
        validateStatus: () => true,
        timeout: 10000,
      });
      // Si el POST exita (status 200), no hay CSRF token
      // Esto no debería pasar — Roblox siempre devuelve 403 con el token
      // pero lo manejamos por si acaso
      return '';
    } catch (error: any) {
      if (error.response?.headers?.['x-csrf-token']) {
        return error.response.headers['x-csrf-token'] as string;
      }
      throw new Error('No se pudo obtener el X-CSRF-Token de Roblox');
    }
  }

  /**
   * Verifica que una cookie sea válida consultando users.roblox.com
   */
  private async verifyCookie(cookie: string): Promise<boolean> {
    try {
      const response = await axios.get('https://users.roblox.com/v1/users/authenticated', {
        headers: { Cookie: `.ROBLOSECURITY=${cookie}` },
        validateStatus: (status) => status === 200,
        timeout: 10000,
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  /**
   * Obtiene información del usuario autenticado
   */
  private async getUserInfo(cookie: string): Promise<{ id: number; username: string }> {
    try {
      const response = await axios.get('https://users.roblox.com/v1/users/authenticated', {
        headers: { Cookie: `.ROBLOSECURITY=${cookie}` },
        timeout: 10000,
      });
      return {
        id: response.data.id,
        username: response.data.name,
      };
    } catch {
      throw new Error('No se pudo obtener información del usuario');
    }
  }
}
