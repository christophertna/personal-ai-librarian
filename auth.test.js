// application needs to be up and running before running the test file

const request = require('supertest');

const BASE_URL = 'http://localhost:3000';

// store token to reuse in protected route tests
let token;
const testUsername = `testuser_${Date.now()}`;
const testPassword = 'testpassword123';

// ===================== REGISTRATION TEST CASES =====================
describe('POST /api/auth/register', () => {

    // ======================= NEW USER REGISTRATION SUCCESS =======================
    it('registers new user successfully (new unique username)', async () => { // notice the async
        const response = await request(BASE_URL)
        .post('/api/auth/register')
        .send({ username: testUsername, password: testPassword }); // successful credentials

        expect(response.status).toBe(201);
        expect(response.body.message).toBe('User created successfully');
    });

    // ===================== SAME USERNAME REGISTER =====================
    it('fails if username already exists during registration', async () => {

        // register same user from above again, but already exists
        const response = await request(BASE_URL)
        .post('/api/auth/register')
        .send({ username: testUsername, password: testPassword });

        expect(response.status).toBe(400); // 'Username already exists'
    });

    // ===================== USERNAME MISSING REGISTER =====================
    it('fails if username is missing during registration', async () => {

        const response = await request(BASE_URL)
        .post('/api/auth/register')
        .send({ password: testPassword }); // no username inputted

        expect(response.status).toBe(400); // 'Username and password are required'
    });

    // ===================== PASSWORD MISSING REGISTER =====================
    it('fails if password is missing during registration', async () => {

        const response = await request(BASE_URL)
        .post('/api/auth/register')
        .send({ username: 'testUsername2' }); // unique username so error not thrown by same username

        expect(response.status).toBe(400); // 'Username and password are required'
    });
});

// ===================== LOGIN TEST CASES =====================
describe('POST /api/auth/login', () => {

    // ===================== SUCCESSFUL LOGIN TEST =====================
    it('successful login & returns a token', async () => {

        const response = await request(BASE_URL)
        .post ('/api/auth/login')
        .send({ username: testUsername, password: testPassword}); // same as the first registration

        expect(response.status).toBe(200); // not sure why 200 yet

        expect(response.body.token).toBeDefined(); // token exists + defined

        expect(response.body.username).toBe(testUsername); // token's username matches

        // save token for protected routes for next test cases
        token = response.body.token;
    });

    // ===================== BAD PASSWORD LOGIN =====================
    it('wrong password during login', async () => {

        // valid username but bad password
        const response = await request(BASE_URL)
        .post('/api/auth/login')
        .send({ username: testUsername, password: 'wrongpassword123'});

        expect(response.status).toBe(401); // 'Invalid credentials'
    });

    // ===================== NON-EXISTENT USERNAME (but correct pwd) LOGIN =====================
    it('non-existent username (but correct pwd) during login', async () => {

        // non-valid username but good password
        const response = await request(BASE_URL)
        .post('/api/auth/login')
        .send({ username: 'nobody123', password: testPassword});

        expect(response.status).toBe(401); // 'Invalid credentials'
    });
});

// get api documents section
describe ('GET /api/documents', () => {

    it('returns document list with valid token', async () => {

        const response = await request(BASE_URL)
        .get('/api/documents')
        .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);

    });

    it('fails without a token', async () => {

        const response = await request(BASE_URL)
        .get('/api/documents');

        expect(response.status).toBe(401);
    });

    it('fails with an invalid token', async () => {

        const response = await request(BASE_URL)
        .get('/api/documents')
        .set('Authorization', 'Bearer faketoken123');

        expect(response.status).toBe(401);
    });
});

// cleanup
afterAll(async () => {
  await request(BASE_URL)
    .delete('/api/auth/user')
    .set('Authorization', `Bearer ${token}`);

    /*
    Only deletes users created in the test file:
    It uses req.user.id which comes from the JWT token, and that token was generated when testUsername logged in. 
    So it only ever knows about and deletes the user attached to that specific token.
    It has no way to reach other users because it doesn't loop through all users or delete by anything other than the logged-in user's ID.
    */
});
