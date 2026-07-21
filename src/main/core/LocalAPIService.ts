import http from 'http';

export class LocalAPIService {
  private server: http.Server | null = null;

  constructor() {}

  async start(port: number): Promise<void> {
    // Stub: creates Express server (using http natively)
    return new Promise((resolve) => {
      this.server = http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Local API is running');
      });
      this.server.listen(port, () => {
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.server) {
        this.server.close((err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}