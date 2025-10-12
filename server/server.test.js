const request = require('supertest');
const app = require('./app');

describe('Server functionality', () => {
	test('GET / should respond with status 200', async () => {
		const response = await request(app).get('/');
		expect(response.statusCode).toBe(200);
	});

	test('POST /api/users should create a new user', async () => {
		const response = await request(app)
			.post('/api/users')
			.send({ username: 'testuser', password: 'password' });
		expect(response.statusCode).toBe(201);
		expect(response.body.username).toBe('testuser');
	});
});