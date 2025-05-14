import * as dotenv from 'dotenv';
import * as http from "node:http";
import { handleRequest } from './request-handler';

dotenv.config();

const PORT = process.env.PORT || 4000;

const server = http.createServer((req, res) => {
  handleRequest(req, res);
});

const app = server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export { app };
