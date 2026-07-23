import http from 'node:http';

let server: http.Server | null = null;

export function start(port: number = 31415): Promise<void> {
  return new Promise((resolve) => {
    server = http.createServer((req, res) => {
      res.setHeader('Content-Type', 'application/json');
      if (req.url === '/health') {
        res.end(JSON.stringify({ status: 'ok' }));
      } else if (req.url === '/accounts') {
        res.end(JSON.stringify({ accounts: [] }));
      } else {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'Not found' }));
      }
    });
    server.listen(port, '127.0.0.1', () => resolve());
  });
}

export function stop(): Promise<void> {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => resolve());
      server = null;
    } else {
      resolve();
    }
  });
}