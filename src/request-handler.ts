import { IncomingMessage, ServerResponse } from 'http';
import { executeUsersOperation } from "./user/user.controller.ts";
import { User } from "./user/user.type.ts";
import { validateUser } from "./user/user.validator.ts";
import cluster from "node:cluster";
import {users} from "./data.ts";

type ParsedUrlType = {
  controller: string | null,
  entityId: string | null
}

export type Response = {
  status: number,
  body: string | undefined,
}

type ExceptionType = {
  name: string,
  message: string,
  statusCode: number,
}

export async function handleRequest(req: IncomingMessage, res: ServerResponse) {
  const parsedUrl = getParsedUrl(req.url || '');
  const method = req.method || '';

  try {
    switch (parsedUrl.controller) {
      case 'users':
        let requestBody = null;

        if (method === 'POST' || method === 'PUT') {
          requestBody = await parseBody<User>(req, validateUser);
        }

        const response = await executeUsersOperation(method, parsedUrl.entityId, requestBody);

        res.writeHead(response.status, { 'Content-Type': 'application/json' });
        res.end(response.body);

        syncDb(method)

        break;
      default:
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({error: 'Not Found'}))
    }
  } catch (err) {
    if ((err as ExceptionType).name === 'InvalidRequestException' ||
      (err as ExceptionType).name === 'NotFoundRequestException'
    ) {
      res.writeHead((err as ExceptionType).statusCode, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: (err as ExceptionType).message }));
    } else {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({error: (err as Error).message}));
    }
  }
}

function getParsedUrl(url: string): ParsedUrlType {
  let parsedUrl: ParsedUrlType = {
    controller: null,
    entityId: null
  }

  const match = url?.match(/api\/(\w+)(?:\/([\w-]+))?$/);

  if (match) {
    parsedUrl.controller = match[1] ?? null;
    parsedUrl.entityId = match[2] ?? null;
  }

  return parsedUrl;
}

function parseBody<T = any> (req: IncomingMessage, validate: (obj: any) => string | null): Promise<T> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      try {
        const parsedBody = JSON.parse(body) as T;

        const validationError = validate(parsedBody);
        if (validationError) {
          reject(createInvalidRequestException(validationError));
        }

        resolve(parsedBody);
      } catch (err) {
        reject(err);
      }
    });
  });
}

export function createInvalidRequestException(message: string): ExceptionType {
  return {
    name: 'InvalidRequestException',
    message,
    statusCode: 400
  };
}

export function createNotFoundRequestException(message: string): ExceptionType {
  return {
    name: 'NotFoundRequestException',
    message,
    statusCode: 404
  };
}

function syncDb(method: string) {
  if (cluster.isWorker && ['POST', 'PUT', 'DELETE'].includes(method)) {
    process.send?.({
      type: 'sync',
      data: users,
    });
  }
}
