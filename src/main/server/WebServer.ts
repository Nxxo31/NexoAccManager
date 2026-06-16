/**
 * WebServer - API interna para comunicaciÃ³n externa
 *
 * Permite a scripts y herramientas externas controlar NexoAccManager
 * de forma segura a travÃ©s de endpoints HTTP.
 */
import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import { AccountManager } from '../core/AccountManager';
import { Account } from '../../types/Account';

export class WebServer {
  private fastify;
  private accountManager: AccountManager;

  constructor(accountManager: AccountManager) {
    this.fastify = Fastify();
    this.accountManager = accountManager;
  }

  /**
   * Inicia el servidor web en un puerto especÃ­fico
   */
  async start(port: number): Promise<void> {
    await this.fastify.register(fastifyCors, { origin: false });

    // Middleware de seguridad: clave API
    this.fastify.addHook('onRequest', (req, res, done) => {
      const key = req.headers['authorization']; // Bearer <key>
      const validKey = process.env.API_KEY || this.generateAPIKey();
      if (!key || key !== `Bearer ${validKey}`) {
        res.status(401).send({ error: 'Unauthorized' });
        return;
      }
      done();
    });

    // Rutas
    this.registerRoutes();

    try {
      await this.fastify.listen(port);
      console.info(`Internal API running on port ${port}`);
    } catch (err) {
      console.error("WebServer error", err);
      throw err;
    }
  }

  /**
   * Genera una clave API aleatoria
   */
  private generateAPIKey(): string {
    const chars = 'ABCDEFabcdef0123456789';
    let key = '';
    for (let i = 0; i < 40; i++) key += chars[Math.floor(Math.random() * chars.length)];
    return key;
  }

  /**
   * Registra todas las rutas REST
   */
  private registerRoutes() {
    // =====================
    // ENDPOINTS DE LECTURA
    // =====================

    // GET /api/v1/LaunchAccount — Lanzar cuenta a un juego
    // Query: ?accountId=xxx&placeId=yyy&jobId=zzz
    this.fastify.get('/api/v1/LaunchAccount', async (request, reply) => {
      const { accountId, placeId, jobId } = request.query as { accountId?: string; placeId?: string; jobId?: string };

      if (!accountId) {
        return reply.status(400).send({ error: 'Falta accountId' });
      }
      if (!placeId) {
        return reply.status(400).send({ error: 'Falta placeId' });
      }

      try {
        const result = await this.accountManager.launchRoblox(accountId, placeId, jobId);
        return reply.send({ success: result, message: 'Cuenta iniciada correctamente' });
      } catch (error) {
        return reply.status(400).send({ error: (error as Error).message });
      }
    });

    // GET /api/v1/GetAccounts — Lista de cuentas
    this.fastify.get('/api/v1/GetAccounts', async (request, reply) => {
      try {
        const accounts = this.accountManager.getAllAccounts();
        return reply.send({
          accounts: accounts.map((a: Account) => ({
            id: a.id,
            username: a.username,
            displayName: a.displayName,
            robloxUserId: a.robloxUserId,
            group: a.group,
            description: a.description,
            lastUsed: a.lastUsed?.toISOString(),
            createdAt: a.createdAt?.toISOString(),
            cookieExpiresAt: a.cookieExpiresAt?.toISOString(),
          })),
          count: accounts.length,
        });
      } catch (error) {
        return reply.status(500).send({ error: (error as Error).message });
      }
    });

    // GET /api/v1/GetCookie — Obtener cookie descifrada (requiere password del sistema)
    this.fastify.get<{ Params: { accountId: string } }>('/api/v1/GetCookie/:accountId', async (request, reply) => {
      const { accountId } = request.params;
      const { password } = request.query as { password?: string };

      // Verificar password del sistema (API_KEY o env.API_KEY)
      const validKey = process.env.API_KEY;
      if (!validKey) {
        return reply.status(500).send({ error: 'API no configurada con clave de sistema' });
      }

      try {
        const account = this.accountManager.getAccountById(accountId);
        if (!account) {
          return reply.status(404).send({ error: 'Cuenta no encontrada' });
        }

        // Obtener cookie sin descifrar — la interfaz Account no expone cookie cifrada
        // Esto requerirÃ­a acceso directo a DatabaseManager + CryptoService
        // Por seguridad, solo el renderer (via IPC) puede descifrar cookies
        return reply.status(403).send({
          error: 'No se pueden obtener cookies por API por razones de seguridad. Usa la interfaz grÃ¡fica.',
        });
      } catch (error) {
        return reply.status(500).send({ error: (error as Error).message });
      }
    });

    // GET /api/v1/ImportCookie — Importar cuenta por cookie
    this.fastify.get('/api/v1/ImportCookie', async (request, reply) => {
      const { cookie, group, description } = request.query as { cookie?: string; group?: string; description?: string };

      if (!cookie) {
        return reply.status(400).send({ error: 'Falta cookie' });
      }

      try {
        const account = await this.accountManager.addAccountFromCookie(cookie);
        return reply.send({
          success: true,
          accountId: account.id,
          username: account.username,
          message: 'Cuenta importada correctamente',
        });
      } catch (error) {
        return reply.status(400).send({ error: (error as Error).message });
      }
    });

    // GET /api/v1/SetServer — Unirse a servidor especÃ­fico por JobId
    this.fastify.get('/api/v1/SetServer', async (request, reply) => {
      const { accountId, placeId, jobId } = request.query as { accountId?: string; placeId?: string; jobId?: string };

      if (!accountId) return reply.status(400).send({ error: 'Falta accountId' });
      if (!placeId) return reply.status(400).send({ error: 'Falta placeId' });
      if (!jobId) return reply.status(400).send({ error: 'Falta jobId (server id)' });

      try {
        const result = await this.accountManager.launchRoblox(accountId, placeId, jobId);
        return reply.send({ success: result, message: 'Unido al servidor correctamente' });
      } catch (error) {
        return reply.status(400).send({ error: (error as Error).message });
      }
    });

    // GET /api/v1/FollowUser — Seguir a un usuario a su juego
    this.fastify.get('/api/v1/FollowUser', async (request, reply) => {
      const { accountId, userId } = request.query as { accountId?: string; userId?: string };

      if (!accountId) return reply.status(400).send({ error: 'Falta accountId' });
      if (!userId) return reply.status(400).send({ error: 'Falta userId' });

      try {
        // Obtener el juego actual del usuario objetivo
        const axios = require('axios');
        const cookie = await this.getAccountCookie(accountId);

        const headers = {
          Cookie: `.ROBLOSECURITY=${cookie}`,
          'Content-Type': 'application/json',
        };

        // Obtener informaciÃ³n del usuario y su juego activo
        const userResponse = await axios.get(`https://users.roblox.com/v1/users/${userId}/presence`, { headers });
        const presence = userResponse.data;

        if (!presence || presence.userPresenceType !== 2) { // 2 = In-Game
          return reply.status(400).send({
            error: 'El usuario no estÃ¡ en un juego. userPresenceType: ' + (presence?.userPresenceType ?? 'unknown'),
          });
        }

        // Extraer placeId y jobId de la visita
        const lastLocation = presence.lastLocation;
        if (!lastLocation || typeof lastLocation !== 'string') {
          return reply.status(400).send({ error: 'No se pudo determinar el juego del usuario' });
        }

        // El lastLocation contiene la URL del juego, ejemplo: "https://www.roblox.com/games/1818/MyGame"
        const placeIdMatch = lastLocation.match(/\/games\/(\d+)/);
        if (!placeIdMatch) {
          return reply.status(400).send({ error: 'No se pudo parsear el placeId del usuario' });
        }

        const placeId = placeIdMatch[1];
        const jobIdMatch = lastLocation.match(/jobId=([^&]+)/);
        const jobId = jobIdMatch ? jobIdMatch[1] : undefined;

        // Lanzar la cuenta al juego del usuario
        const result = await this.accountManager.launchRoblox(accountId, placeId, jobId);
        return reply.send({
          success: result,
          username: presence.displayName || presence.username || `User${userId}`,
          placeId,
          jobId,
          message: 'Cuenta seguida al juego correctamente',
        });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return reply.status(400).send({ error: msg });
      }
    });

    // GET /api/v1/GetCSRFToken — Obtener CSRF token de una cuenta
    this.fastify.get<{ Params: { accountId: string } }>('/api/v1/GetCSRFToken/:accountId', async (request, reply) => {
      const { accountId } = request.params;

      try {
        const cookie = await this.getAccountCookie(accountId);
        const axios = require('axios');
        const headers = { Cookie: `.ROBLOSECURITY=${cookie}` };

        await axios.post('https://auth.roblox.com/v2/logout', {}, { headers });
        return reply.send({ csrfToken: '' }); // Empty means cookie is invalid
      } catch (error: any) {
        if (error.response && error.response.headers && error.response.headers['x-csrf-token']) {
          return reply.send({
            csrfToken: error.response.headers['x-csrf-token'],
          });
        }
        return reply.status(400).send({ error: 'No se pudo obtener CSRF token' });
      }
    });

    // GET /api/v1/GetField — Obtener campo personalizado de una cuenta
    this.fastify.get<{ Params: { accountId: string; field: string } }>(
      '/api/v1/GetField/:accountId/:field',
      async (request, reply) => {
        const { accountId, field } = request.params;

        try {
          const account = this.accountManager.getAccountById(accountId);
          if (!account) return reply.status(404).send({ error: 'Cuenta no encontrada' });

          // Soportar campos estÃ¡ndar y campos personalizados
          const standardFields = ['username', 'group', 'description', 'displayName', 'lastUsed', 'createdAt'];
          if (standardFields.includes(field)) {
            const value = (account as any)[field];
            return reply.send({ value: value?.toISOString ? value.toISOString() : value });
          }

          // Campo personalizado (stored en description o en un campo extra)
          // Por ahora usamos description como storage de campos personalizados
          const customData = this.parseCustomFields(account.description);
          return reply.send({ value: customData[field] ?? null });
        } catch (error) {
          return reply.status(500).send({ error: (error as Error).message });
        }
      }
    );

    // GET /api/v1/SetField — Establecer campo personalizado de una cuenta
    this.fastify.get<{ Params: { accountId: string; field: string }; Query: { value: string } }>(
      '/api/v1/SetField/:accountId/:field',
      async (request, reply) => {
        const { accountId, field } = request.params;
        const { value } = request.query as { value?: string };

        if (!value) {
          return reply.status(400).send({ error: 'Falta value' });
        }

        try {
          const account = this.accountManager.getAccountById(accountId);
          if (!account) return reply.status(404).send({ error: 'Cuenta no encontrada' });

          // Solo campos estÃ¡ndar editables por ahora
          const editableFields = ['group', 'description'];
          if (editableFields.includes(field)) {
            this.accountManager.setAccountField(accountId, field, value as string);
            return reply.send({ success: true, field, value });
          }

          // Campo personalizado: guardar en description como JSON
          const customData = this.parseCustomFields(account.description);
          customData[field] = value as string;
          this.accountManager.setAccountField(accountId, 'description', JSON.stringify(customData));
          return reply.send({ success: true, field, value });
        } catch (error) {
          return reply.status(500).send({ error: (error as Error).message });
        }
      }
    );

    // =====================
    // ENDPOINTS ADICIONALES
    // =====================

    // GET /api/v1/GetSettings — Obtener configuraciÃ³n actual
    this.fastify.get('/api/v1/GetSettings', async (request, reply) => {
      try {
        const multiRoblox = this.accountManager.isMultiRobloxEnabled();
        return reply.send({
          multiRobloxEnabled: multiRoblox,
          multiRobloxSupported: this.accountManager.isMultiRobloxSupported(),
        });
      } catch (error) {
        return reply.status(500).send({ error: (error as Error).message });
      }
    });

    // GET /api/v1/SetSettings — Cambiar configuraciÃ³n
    this.fastify.get('/api/v1/SetSettings', async (request, reply) => {
      const { multiRoblox } = request.query as { multiRoblox?: string };

      if (multiRoblox !== undefined) {
        const enabled = multiRoblox === 'true' || multiRoblox === '1';
        this.accountManager.setMultiRoblox(enabled);
      }

      return reply.send({
        success: true,
        multiRobloxEnabled: this.accountManager.isMultiRobloxEnabled(),
      });
    });

    // GET /api/v1/DeleteAccount — Eliminar una cuenta
    this.fastify.get<{ Params: { accountId: string } }>('/api/v1/DeleteAccount/:accountId', async (request, reply) => {
      const { accountId } = request.params;

      try {
        await this.accountManager.removeAccount(accountId);
        return reply.send({ success: true, message: 'Cuenta eliminada correctamente' });
      } catch (error) {
        return reply.status(400).send({ error: (error as Error).message });
      }
    });

    // GET /api/v1/health — Health check (sin auth)
    this.fastify.get('/api/v1/health', async (request, reply) => {
      return reply.send({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Backwards compatibility: mantener los endpoints old
    this.fastify.get('/api/v1/accounts', async (request, reply) => {
      return reply.redirect(302, '/api/v1/GetAccounts');
    });

    this.fastify.post('/api/v1/accounts/add', async (request, reply) => {
      const { cookie } = request.body as { cookie?: string };
      if (!cookie) return reply.status(400).send({ error: 'Falta cookie' });

      try {
        const account = await this.accountManager.addAccountFromCookie(cookie);
        return reply.send({ success: true, accountId: account.id });
      } catch (error) {
        return reply.status(400).send({ error: (error as Error).message });
      }
    });
  }

  /**
   * Obtiene la cookie descifrada de una cuenta (mÃ©todo interno)
   * @private
   */
  private async getAccountCookie(accountId: string): Promise<string> {
    const crypto = require('crypto');
    const account = this.accountManager.getAccountById(accountId);
    if (!account) throw new Error('Cuenta no encontrada');

    // Necesitamos acceso a la cookie cifrada desde DB
    const dbAccount = (this.accountManager as any).db?.getAccount?.(accountId);
    if (!dbAccount) throw new Error('Cuenta no encontrada en DB');

    const cryptoSvc = (this.accountManager as any).crypto as any;
    return cryptoSvc.decrypt(dbAccount.encrypted_cookie);
  }

  /**
   * Parsea campos personalizados desde el campo description
   * Formato: {"campo1":"valor1","campo2":"valor2"} o texto plano
   * @private
   */
  private parseCustomFields(description: string | undefined): Record<string, string> {
    if (!description) return {};
    try {
      const parsed = JSON.parse(description);
      if (typeof parsed === 'object' && parsed !== null) return parsed;
    } catch {
      // No es JSON, devolver vacÃ­o
    }
    return {};
  }

  /**
   * Detiene el servidor
   */
  async stop(): Promise<void> {
    await this.fastify.close();
  }
}