/**
 * WebServer - API interna para comunicaciÃ³n externa
 *
 * Permite a scripts y herramientas externas controlar NexoAccManager
 * de forma segura a travÃ©s de endpoints HTTP.
 */
import Fastify from 'fastify';
import fastifyCors from 'fastify-cors';
import { AccountManager } from './AccountManager';

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
    // Obtener lista de cuentas
    this.fastify.get('/api/v1/accounts', async (request, reply) => {
      const accounts = this.accountManager.getAllAccounts();
      reply.send(accounts.map(a => ({
        id: a.id,
        username: a.username,
        group: a.group,
      })));
    });

    // Lanzar Roblox mediante PlaceID
    this.fastify.post<{ Params: { accountId: string } }>('/api/v1/accounts/:accountId/launch', async (request, reply) => {
      const { accountId } = request.params;
      const { placeId, jobId } = request.body as { placeId?: string; jobId?: string };

      try {
        const result = await this.accountManager.launchRoblox(accountId, placeId, jobId);
        reply.send({ success: result });
      } catch (error) {
        reply.status(400).send({ error: error.message });
      }
    });

    // Agregar cuenta mediante cookie
    this.fastify.post('/api/v1/accounts/add', async (request, reply) => {
      const { cookie } = request.body as { cookie: string };
      try {
        await this.accountManager.addAccountFromCookie(cookie);
        reply.send({ success: true });
      } catch (error) {
        reply.status(400).send({ error: error.message });
      }
    });
  }

  /**
   * Detiene el servidor
   */
  async stop(): Promise<void> {
    await this.fastify.close();
  }
}