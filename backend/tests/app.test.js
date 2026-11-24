
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('Discipline OS API', () => {

    it('should import Express application correctly', () => {
        expect(app).toBeDefined();
        expect(typeof app).toBe('function');
    });

    it('should return API running message', async () => {
        const response = await request(app).get('/');

        expect(response.status).toBe(200);
        expect(response.text).toBe('API is running...');
    });

});
