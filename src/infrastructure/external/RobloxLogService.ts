// Infrastructure: RobloxLogService — Parsea logs de Roblox para joins, leaves y chat
// Lee %localappdata%\Roblox\logs\*.log
// Retorna eventos estructurados

import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { randomUUID as cryptoRandomUUID } from 'crypto';

export interface RobloxLogEvent {
  id: string;
  type: RobloxLogEventType;
  timestamp: Date;
  rawLine: string;
  data: Record<string, unknown>;
}

export enum RobloxLogEventType {
  PLAYER_JOIN = 'PLAYER_JOIN',
  PLAYER_LEAVE = 'PLAYER_LEAVE',
  CHAT_MESSAGE = 'CHAT_MESSAGE',
}

/**
 * Obtiene el directorio de logs de Roblox
 * %localappdata%\Roblox\logs
 * @returns Ruta al directorio de logs o null si no se encuentra
 */
function getRobloxLogsDir(): string | null {
  try {
    const localAppData = process.env.LOCALAPPDATA || (process.env.HOME && `${process.env.HOME}/AppData/Local`);
    if (!localAppData) return null;

    const logsDir = path.join(localAppData, 'Roblox', 'logs');
    if (!fs.existsSync(logsDir)) return null;
    return logsDir;
  } catch (error) {
    console.error('Error finding Roblox logs directory:', error);
    return null;
  }
}

/**
 * Obtiene la lista de archivos de log en el directorio de logs
 * @returns Array de rutas completas a los archivos de log
 */
function getLogFiles(): string[] {
  const logsDir = getRobloxLogsDir();
  if (!logsDir) return [];

  try {
    const files = fs.readdirSync(logsDir);
    return files
      .filter((file) => file.endsWith('.log'))
      .map((file) => path.join(logsDir, file));
  } catch (error) {
    console.error('Error reading log files directory:', error);
    return [];
  }
}

/**
 * Extrae un timestamp de una línea de log si está presente
 * Formato esperado: [HH:MM:SS] o similar al inicio de la línea
 * @param line Línea de log
 * @returns Fecha extraída o null si no se encuentra
 */
function extractTimestampFromLine(line: string): Date | null {
  // Intentar capturar [HH:MM:SS] o HH:MM:SS al inicio
  const timeMatch = line.match(/^\[?(\d{2}:\d{2}:\d{2})\]?/);
  if (timeMatch) {
    const [, timeStr] = timeMatch;
    const now = new Date();
    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, seconds, 0);
    return date;
  }
  return null;
}

/**
 * Parsea una línea de log y devuelve un evento si coincide con algún patrón
 * @param line Línea de log a parsear
 * @param timestampFromLine Timestamp extraído de la línea (si está disponible)
 * @returns Evento parseado o null si no coincide con ningún patrón
 */
function parseLogLine(line: string, timestampFromLine?: Date | null): RobloxLogEvent | null {
  const timestamp = timestampFromLine ?? new Date();

  // Patrón para unir jugador: "Joining player <username> (ID: <userId>)"
  const joinMatch = line.match(/Joining player ([^)]+) \(ID: (\d+)\)/);
  if (joinMatch) {
    return {
      id: cryptoRandomUUID(),
      type: RobloxLogEventType.PLAYER_JOIN,
      timestamp,
      rawLine: line,
      data: {
        username: joinMatch[1],
        userId: parseInt(joinMatch[2], 10),
      },
    };
  }

  // Patrón para abandonar jugador: podría ser "Player <username> left the game" o similar
  const leavePatterns = [
    /Player ([^ ]+) left the game/,
    /([^ ]+) has left the game/,
    /player ([^ ]+) disconnected/i,
  ];

  for (const pattern of leavePatterns) {
    const leaveMatch = line.match(pattern);
    if (leaveMatch) {
      return {
        id: cryptoRandomUUID(),
        type: RobloxLogEventType.PLAYER_LEAVE,
        timestamp,
        rawLine: line,
        data: {
          username: leaveMatch[1],
        },
      };
    }
  }

  // Patrón para chat: "[timestamp] Chat: <username>: <message>" o similar
  const chatMatch = line.match(/(?:Chat:|CHAT:)\s*([^:]+):\s*(.+)/i);
  if (chatMatch) {
    return {
      id: cryptoRandomUUID(),
      type: RobloxLogEventType.CHAT_MESSAGE,
      timestamp,
      rawLine: line,
      data: {
        username: chatMatch[1].trim(),
        message: chatMatch[2].trim(),
      },
    };
  }

  // Otro patrón de chat común: "<username> dice: <message>"
  const chatSayMatch = line.match(/([^:]+)\s+dice:\s*(.+)/i);
  if (chatSayMatch) {
    return {
      id: cryptoRandomUUID(),
      type: RobloxLogEventType.CHAT_MESSAGE,
      timestamp,
      rawLine: line,
      data: {
        username: chatSayMatch[1].trim(),
        message: chatSayMatch[2].trim(),
      },
    };
  }

  return null;
}

/**
 * Versión síncrona de parseRobloxLogs para usar en IPC (nota: puede bloquear la UI si hay muchos logs)
 * @param sinceTimestamp Solo devolver eventos después de este timestamp (opcional)
 * @param maxLines Máximo número de líneas a procesar por archivo (para evitar sobrecarga)
 * @returns Array de eventos de log parseados
 */
export function parseRobloxLogs(sinceTimestamp?: Date, maxLinesPerFile = 10000): RobloxLogEvent[] {
  const events: RobloxLogEvent[] = [];
  const logFiles = getLogFiles();

  if (logFiles.length === 0) return events;

  for (const file of logFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      let linesProcessed = 0;
      for (const line of lines) {
        if (linesProcessed >= maxLinesPerFile) break;
        linesProcessed++;
        const timestampFromLine = extractTimestampFromLine(line);
        const event = parseLogLine(line, timestampFromLine);
        if (event) {
          if (!sinceTimestamp || event.timestamp >= sinceTimestamp) {
            events.push(event);
          }
        }
      }
    } catch (error) {
      console.error(`Error reading log file ${file}:`, error);
    }
  }

  return events;
}

/**
 * Versión asíncrona de parseRobloxLogs para usar en IPC
 * @param sinceTimestamp Solo devolver eventos después de este timestamp (opcional)
 * @returns Promesa que resuelve con el array de eventos
 */
export async function parseRobloxLogsAsync(sinceTimestamp?: Date): Promise<RobloxLogEvent[]> {
  return new Promise<RobloxLogEvent[]>((resolve) => {
    const events: RobloxLogEvent[] = [];
    const logFiles = getLogFiles();

    if (logFiles.length === 0) {
      resolve(events);
      return;
    }

    let filesProcessed = 0;

    for (const file of logFiles) {
      try {
        const fileStream = fs.createReadStream(file, { encoding: 'utf8' });
        const rl = readline.createInterface({
          input: fileStream,
          crlfDelay: Infinity,
        });

        rl.on('line', (line) => {
          // Intentar extraer timestamp de la línea
          const timestampFromLine = extractTimestampFromLine(line);

          // Parsear la línea
          const event = parseLogLine(line, timestampFromLine);
          if (event) {
            // Filtrar por timestamp si se especificó
            if (!sinceTimestamp || event.timestamp >= sinceTimestamp) {
              events.push(event);
            }
          }
        });

        rl.on('close', () => {
          filesProcessed++;
          if (filesProcessed === logFiles.length) {
            // Ordenar eventos por timestamp (más recientes primero)
            events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
            resolve(events);
          }
        });

        rl.on('error', (error) => {
          console.error(`Error reading log file ${file}:`, error);
          filesProcessed++;
          if (filesProcessed === logFiles.length) {
            // Ordenar eventos por timestamp (más recientes primero)
            events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
            resolve(events);
          }
        });
      } catch (error) {
        console.error(`Error opening log file ${file}:`, error);
        filesProcessed++;
        if (filesProcessed === logFiles.length) {
          // Ordenar eventos por timestamp (más recientes primero)
          events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
          resolve(events);
        }
      }
    }
  });
}