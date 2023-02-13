export class DataProvider {
  id: number;
  name: string;
  image: string;
  description?: string;
  isConnected?: boolean;
  connectUrl?: string;
  disconnectUrl?: string;
  client?: { id: number; clientId: string; secret?: string };
}
