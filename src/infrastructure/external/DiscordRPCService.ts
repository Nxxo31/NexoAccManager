// Infrastructure: DiscordRPCService — Discord Rich Presence integration
import RPC from 'discord-rpc';

const CLIENT_ID = '1274925610645274655'; // NAM Discord app placeholder

let client: RPC.Client | null = null;
let connected = false;

export async function initializeDiscordRPC(clientId?: string): Promise<void> {
  const id = clientId ?? CLIENT_ID;
  if (client && connected) return;
  RPC.register(id);
  client = new RPC.Client({ transport: 'ipc' });
  await client.login({ clientId: id });
  connected = true;
}

export async function updateDiscordPresence(opts: {
  details?: string;
  state?: string;
  largeImageKey?: string;
  smallImageKey?: string;
  startTimestamp?: number;
}): Promise<void> {
  if (!client || !connected) return;
  await client.setActivity({
    details: opts.details,
    state: opts.state,
    largeImageKey: opts.largeImageKey ?? 'nam-logo',
    smallImageKey: opts.smallImageKey,
    startTimestamp: opts.startTimestamp,
    instance: false,
  });
}

export async function clearDiscordPresence(): Promise<void> {
  if (!client || !connected) return;
  await client.clearActivity();
}

export async function shutdownDiscordRPC(): Promise<void> {
  if (!client) return;
  await client.destroy();
  client = null;
  connected = false;
}