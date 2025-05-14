import * as http from 'node:http';
import * as dotenv from 'dotenv';
import { handleRequest } from './request-handler';
import {users} from "./data";

dotenv.config();

type SyncMessage = {
  type: 'sync';
  data: typeof users;
}

const BASE_PORT = parseInt(process.env.PORT || '') || 4000;
const WORKER_INDEX = parseInt(process.env.WORKER_INDEX || '') || 1;
const WORKER_PORT = BASE_PORT + WORKER_INDEX;

process.on('message', (msg) => {
  const message= msg as SyncMessage

  if (message.type === 'sync') {
    users.length = 0;
    users.push(...message.data);
  }
});

const server = http.createServer((req, res) => {
  handleRequest(req, res);
});

server.listen(WORKER_PORT, () => {
  console.log(`Worker ${process.pid} listening on http://localhost:${WORKER_PORT}`);
});
