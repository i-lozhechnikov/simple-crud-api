import { User } from "./user.type.ts";
import {createInvalidRequestException, createNotFoundRequestException, Response} from "../request-handler.ts";
import { users } from "../data.ts";
import { v4 as uuidv4, validate as isUuidValid } from 'uuid';

async function getUserById(userId: string): Promise<Response> {
  if (!isUuidValid(userId)) {
    throw createInvalidRequestException('User id is not UUID.')
  }

  const user = users.find(user => user.id === userId);

  if (!user) {
    throw createNotFoundRequestException('User is not found.')
  }

  return {
    status: 200,
    body: JSON.stringify(user)
  };
}

async function getUsers(): Promise<Response> {
  return {
    status: 200,
    body: JSON.stringify(users),
  };
}

async function createUser(userData: User): Promise<Response> {
  userData.id = uuidv4();
  users.push(userData);

  return {
    status: 201,
    body: undefined
  };
}

async function updateUser(userId: string, userData: User): Promise<Response> {
  if (!isUuidValid(userId)) {
    throw createInvalidRequestException('User id is not UUID.')
  }

  const userIndex = users.findIndex(user => user.id === userId);

  if (userIndex === -1) {
    throw createNotFoundRequestException('User is not found.')
  }

  users[userIndex].username = userData.username;
  users[userIndex].age = userData.age;
  users[userIndex].hobbies = userData.hobbies;

  return {
    status: 200,
    body: JSON.stringify(users[userIndex])
  };
}

async function deleteUser(userId: string): Promise<Response> {
  if (!isUuidValid(userId)) {
    throw createInvalidRequestException('User id is not UUID.')
  }

  const userIndex = users.findIndex(user => user.id === userId);

  if (userIndex === -1) {
    throw createNotFoundRequestException('User is not found.')
  }

  users.splice(userIndex, 1);

  return {
    status: 204,
    body: undefined
  };
}

async function failedRequest(): Promise<Response> {
  return {
    status: 400,
    body: 'Failed Users request'
  };
}

export async function executeUsersOperation(
  method: string,
  entityId: string | null,
  userData: User | null
): Promise<Response> {
  if (method === 'GET' && entityId) {
    return getUserById(entityId);
  } else if (method === 'GET' && !entityId) {
    return getUsers();
  } else if (method === 'POST' && !entityId && userData) {
    return createUser(userData);
  } else if (method === 'PUT' && entityId && userData) {
    return updateUser(entityId, userData);
  } else if (method === 'DELETE' && entityId) {
    return deleteUser(entityId);
  }

  return failedRequest();
}
