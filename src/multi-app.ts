import cluster from 'node:cluster';
import * as http from 'node:http';
import * as os from 'node:os';
import * as dotenv from 'dotenv';
import {users} from "./data.ts";

dotenv.config();

const BASE_PORT = parseInt(process.env.PORT || '') || 4000;
const numCPUs = os.cpus().length;
let current = 0;

if (cluster.isPrimary) {
  let workers = [];

  for (let i = 0; i < numCPUs; i++) {
    const currentWorker = cluster.fork({ WORKER_INDEX: i + 1 });
    workers.push(currentWorker);

    currentWorker.on('message', (message) => {
      if (message.type === 'sync') {
        users.length = 0;
        users.push(...message.data);
      }

      for (const worker of workers) {
        if (worker !== currentWorker) {
          worker.send({
            type: 'sync',
            data: users,
          });
        }
      }
    });
  }

  const server = http.createServer((req, res) => {
    const workerPort = BASE_PORT + (current + 1);
    current = (current + 1) % numCPUs;

    const options = {
      hostname: 'localhost',
      port: workerPort,
      path: req.url,
      method: req.method,
      headers: req.headers,
    };

    const proxy = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    });

    req.pipe(proxy, { end: true });
  });

  server.listen(BASE_PORT, () => {
    console.log(`Load balancer listening on http://localhost:${BASE_PORT}`);
  });

} else {
  (async () => {
    await import('./app-worker.ts');
  })();
}
