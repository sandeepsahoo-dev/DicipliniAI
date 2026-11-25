
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('Discipline OS Authentication API', () => {

    it('should register a new user', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Test User',
                email: 'test@example.com',
                password: 'Test@12345'
            });

        expect(response.status).toBe(201);
        expect(response.body.token).toBeDefined();
        expect(response.body.user.email).toBe('test@example.com');
    });

    it('should reject duplicate email registration', async () => {
        await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Test User',
                email: 'duplicate@example.com',
                password: 'Test@12345'
            });

        const response = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Another User',
                email: 'duplicate@example.com',
                password: 'Test@12345'
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('User already exists');
    });

    it('should login with correct credentials', async () => {
        await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Login User',
                email: 'login@example.com',
                password: 'Test@12345'
            });

        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'login@example.com',
                password: 'Test@12345'
            });

        expect(response.status).toBe(200);
        expect(response.body.token).toBeDefined();
    });

    it('should reject incorrect password', async () => {
        await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Wrong Password User',
                email: 'wrong@example.com',
                password: 'Test@12345'
            });

        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'wrong@example.com',
                password: 'WrongPassword'
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Invalid credentials');
    });

});
