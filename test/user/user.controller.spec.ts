import request from 'supertest';
import { app } from '../../src/app.ts';
import { users } from "../../src/data.ts";
import { v4 as uuidv4 } from 'uuid'

type TestUserData = {
  username: any,
  age: any,
  hobbies: any
}
describe('User API', () => {
  beforeEach(() => {
    users.length = 0
  })

  afterAll(() => {
    app.close();
  })

  it('should create a new user', async () => {
    const userData = {
      username: 'TestUser',
      age: 20,
      hobbies: ["test"]
    };

    const {response} = await createUser(userData);

    expect(response.status).toBe(201);

    const createdUser = users.find(user => user.username === userData.username);
    expect(createdUser).toBeDefined();
    expect(createdUser?.username).toBe(userData.username);
    expect(createdUser?.age).toBe(userData.age);
    expect(createdUser?.hobbies).toEqual(userData.hobbies);
  });

  const createUserInvalidInput = [
    {username: null, age: 20, hobbies: [], expectedErrorMessage: 'Username is not provided or not a string.'},
    {username: 'TestUser', age: '20', hobbies: [], expectedErrorMessage: 'Age is not provided or not a number.'},
    {username: 'TestUser', age: 20, hobbies: null, expectedErrorMessage: 'Hobbies is not provided or not an array.'},
    {username: 'TestUser', age: 20, hobbies: [1], expectedErrorMessage: 'Element of hobbies array must be a string.'},
  ];
  it.each(createUserInvalidInput)('create user should show invalid input error', async (testData) => {
    const userData: TestUserData = {
      username: testData.username,
      age: testData.age,
      hobbies: testData.hobbies,
    };

    const {response} = await createUser(userData);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(testData.expectedErrorMessage);
  });

  it('get user by id should return created user', async () => {
    const userData = {
      username: 'TestUser',
      age: 20,
      hobbies: ["test"]
    };

    const {userId} = await createUser(userData);

    const response = await request(app)
      .get(`/api/users/${userId}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: userId,
      username: userData.username,
      age: userData.age,
      hobbies: userData.hobbies
    });
  });

  it('get user should show invalid id error', async () => {
    const response = await request(app)
      .get(`/api/users/invalid_user_id`);

    expect(response.status).toBe(400);
    expect(response.body.error).toEqual('User id is not UUID.');
  });

  it('get user should show not found error', async () => {
    const notExistentUserId = uuidv4()

    const response = await request(app)
      .get(`/api/users/${notExistentUserId}`);

    expect(response.status).toBe(404);
    expect(response.body.error).toEqual('User is not found.');
  });

  it('get all users should get existing users', async () => {
    const userData1 = {
      username: 'TestUser1',
      age: 20,
      hobbies: ["test"]
    };

    const userData2 = {
      username: 'TestUser2',
      age: 20,
      hobbies: ["test"]
    };

    const createdUser1 = await createUser(userData1);
    const createdUser2 = await createUser(userData2)


    const response = await request(app)
      .get(`/api/users`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        id: createdUser1.userId,
        username: userData1.username,
        age: userData1.age,
        hobbies: userData1.hobbies,
      },
      {
        id: createdUser2.userId,
        username: userData2.username,
        age: userData2.age,
        hobbies: userData2.hobbies,
      }
    ]);
  });

  it('should update created user', async () => {
    const createUserData = {
      username: 'TestUser',
      age: 20,
      hobbies: ["test"]
    };

    const {userId} = await createUser(createUserData);

    const updateUserData = {
      username: 'TestUserUpdated',
      age: 30,
      hobbies: ["testUpdated"]
    };

    const updateResponse = await request(app)
      .put(`/api/users/${userId}`)
      .send(updateUserData)
      .set('Accept', 'application/json');

    expect(updateResponse.status).toBe(200);

    const updatedUser = users.find(user => user.username === updateUserData.username);
    expect(updatedUser).toBeDefined();
    expect(updatedUser?.username).toBe(updateUserData.username);
    expect(updatedUser?.age).toBe(updateUserData.age);
    expect(updatedUser?.hobbies).toEqual(updateUserData.hobbies);
  });

  it('update user should show invalid id error', async () => {
    const updateUserData = {
      username: 'TestUserUpdated',
      age: 30,
      hobbies: ["testUpdated"]
    };

    const response = await request(app)
      .put(`/api/users/invalid_user_id`)
      .send(updateUserData)
      .set('Accept', 'application/json');

    expect(response.status).toBe(400);
    expect(response.body.error).toEqual('User id is not UUID.');
  });

  it('update user should show not found error', async () => {
    const notExistentUserId = uuidv4()
    const updateUserData = {
      username: 'TestUserUpdated',
      age: 30,
      hobbies: ["testUpdated"]
    };

    const response = await request(app)
      .put(`/api/users/${notExistentUserId}`)
      .send(updateUserData)
      .set('Accept', 'application/json');

    expect(response.status).toBe(404);
    expect(response.body.error).toEqual('User is not found.');
  });

  it('should update created user', async () => {
    const userDataForDelete = {
      username: 'TestUser',
      age: 20,
      hobbies: ["test"]
    };

    const {userId} = await createUser(userDataForDelete);

    const response = await request(app)
      .delete(`/api/users/${userId}`);

    expect(response.status).toBe(204);

    const updatedUser = users.find(user => user.username === userDataForDelete.username);
    expect(updatedUser).not.toBeDefined();
  });

  it('delete user should show invalid id error', async () => {
    const response = await request(app)
      .delete(`/api/users/invalid_user_id`);

    expect(response.status).toBe(400);
    expect(response.body.error).toEqual('User id is not UUID.');
  });

  it('delete user should show not found error', async () => {
    const notExistentUserId = uuidv4()

    const response = await request(app)
      .delete(`/api/users/${notExistentUserId}`);

    expect(response.status).toBe(404);
    expect(response.body.error).toEqual('User is not found.');
  });

  it('invalid url request should show not found error', async () => {
    const response = await request(app)
      .get(`/some/invalid/url`);

    expect(response.status).toBe(404);
    expect(response.body.error).toEqual('Not Found');
  });

  async function createUser(userData: TestUserData): Promise<{response: any, userId: string | undefined}> {
   const response = await request(app)
      .post('/api/users')
      .send(userData)
      .set('Accept', 'application/json');

    const createdUser = users.find(user => user.username === userData.username);
    const userId = createdUser?.id;

    return {response, userId};
  }
});
