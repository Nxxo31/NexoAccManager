/**
 * BottingService — Relanza cuentas de Roblox en un intervalo configurable.
 *
 * Caso de uso: farming. El usuario quiere que sus cuentas salgan y reentrada
 * automáticamente a un juego cada N minutos para maximizarczas在线.
 *
 * RIESGO: Esto puede violar los ToS de Roblox. El usuario asume el riesgo de ban.
 * El servicio es opt-in con disclaimer explícito en la UI.
 */
import { AccountManager } from '../core/AccountManager';
import { PresenceService } from './PresenceService';

export class BottingService {
  private timer: NodeJS.Timeout | null = null;
  private accountIds: string[] = [];
  private placeId: string | null = null;
  private jobId: string | null = null;
  private intervalMinutes: number = 5;
  private running = false;

  constructor(
    private accountManager: AccountManager,
    private presenceService?: PresenceService
  ) {}

  isRunning(): boolean {
    return this.running;
  }

  getStatus(): {
    running: boolean;
    intervalMinutes: number;
    accountIds: string[];
    placeId: string | null;
    jobId: string | null;
  } {
    return {
      running: this.running,
      intervalMinutes: this.intervalMinutes,
      accountIds: [...this.accountIds],
      placeId: this.placeId,
      jobId: this.jobId,
    };
  }

  /**
   * Inicia el modo botting.
   * @param accountIds IDs de cuentas a relanzar
   * @param intervalMinutes Intervalo en minutos entre relaunches
   * @param placeId Place ID al que relanzar (opcional, usa saved si null)
   * @param jobId Job ID al que relanzar (opcional)
   */
  start(
    accountIds: string[],
    intervalMinutes: number,
    placeId?: string,
    jobId?: string
  ): void {
    if (this.running) this.stop();

    this.accountIds = [...accountIds];
    this.intervalMinutes = Math.max(1, intervalMinutes);
    this.placeId = placeId || null;
    this.jobId = jobId || null;
    this.running = true;

    // Lanzar inmediatamente
    this.relaunchAll();

    // Configurar timer
    const intervalMs = this.intervalMinutes * 60 * 1000;
    this.timer = setInterval(() => {
      this.relaunchAll();
    }, intervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.running = false;
    this.accountIds = [];
    this.placeId = null;
    this.jobId = null;
  }

  /**
   * Actualiza el intervalo sin reiniciar el servicio.
   */
  setInterval(intervalMinutes: number): void {
    this.intervalMinutes = Math.max(1, intervalMinutes);
    if (this.running && this.timer) {
      clearInterval(this.timer);
      const intervalMs = this.intervalMinutes * 60 * 1000;
      this.timer = setInterval(() => {
        this.relaunchAll();
      }, intervalMs);
    }
  }

  /**
   * Relanza todas las cuentas configuradas.
   * Verifica presencia: solo relanza cuentas que no estén ya en el juego.
   */
  private async relaunchAll(): Promise<void> {
    for (const accountId of this.accountIds) {
      try {
        // Verificar si la cuenta ya está en el juego (status = 'in-game')
        let shouldLaunch = true;
        if (this.presenceService) {
          try {
            const presences = await this.presenceService.getPresence([accountId]);
            const presence = presences?.[0];
            // status: 'online' | 'in-game' | 'offline'
            if (presence?.status === 'in-game') {
              shouldLaunch = false; // Ya está en juego, no relanzar
            }
          } catch {
            // Si no podemos verificar presencia, lanzar igual
          }
        }

        if (shouldLaunch) {
          // Primero kill la instancia existente si hay
          // Luego relanzar
          await this.accountManager.launchRoblox(
            accountId,
            this.placeId || undefined,
            this.jobId || undefined
          );
        }
      } catch (e) {
        console.error(`[BottingService] Error relanzando cuenta ${accountId}:`, e);
      }
    }
  }
}
