// tests/auth.test.js

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

// Define las credenciales de un usuario de prueba para las pruebas
const testUser = {
    correo: 'dan2@gmail.com',
    contraseña: '123'
};

describe('Pruebas de Integración para la API de Autenticación', () => {

    it('Debería retornar 404 al intentar acceder con GET a la ruta de login', async () => {
        const res = await request(app).get('/api/auth/login');
        expect(res.statusCode).toBe(404);
    });

    it('Debería retornar 200 y un token con credenciales correctas', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send(testUser);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body.usuario.nombre).toBe('Danny 2');
    });
    
    it('Debería retornar 401 y un mensaje de error con contraseña incorrecta', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ ...testUser, contraseña: 'contraseña_incorrecta' });

        expect(res.statusCode).toBe(401);
        expect(res.body.mensaje).toBe('Contraseña incorrecta');
    });

    it('Debería retornar 401 y un mensaje de error con usuario no encontrado', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ correo: 'no_existe@tukuy.com', contraseña: '123' });

        expect(res.statusCode).toBe(401);
        expect(res.body.mensaje).toBe('Usuario no encontrado');
    });

    it('Debería retornar 401 al intentar login sin credenciales', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({});

        expect(res.statusCode).toBe(401);
    });
});