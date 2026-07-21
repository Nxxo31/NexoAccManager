import { ServersService } from './ServersService';
import { RobloxServerUser } from './ServersService';

export type GameServerUser = {
  userId: number;
  username: string;
  displayName: string;
  presenceType: string;
};

export class PlayerFinderService {
  constructor() {}

  async searchPlayer(username: string, placeId: string, cookie: string): Promise<GameServerUser[]> {
    // Use ServersService to iterate servers and search by username
    // Stub implementation
    return [];
  }
}