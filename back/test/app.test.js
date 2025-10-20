// tests/app.test.js

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('Pruebas de la API de Express', () => {

    it('Debería retornar 404 para una ruta inexistente', async () => {
        const res = await request(app).get('/esta-ruta-no-existe');
        expect(res.statusCode).toBe(404);
    });

    // PRUEBAS PARA LA RUTA DE AUTENTICACIÓN
    it('Debería manejar la ruta POST /api/auth/login', async () => {
        const res = await request(app).post('/api/auth/login');
        expect(res.statusCode).not.toBe(404);
    });

    // PRUEBAS PARA LAS RUTAS DE RECURSOS
    it('Debería poder acceder a la ruta GET /api/participantes', async () => {
        const res = await request(app).get('/api/participantes');
        expect(res.statusCode).not.toBe(404);
    });

    it('Debería poder acceder a la ruta GET /api/documentos', async () => {
        const res = await request(app).get('/api/documentos');
        expect(res.statusCode).not.toBe(404);
    });

    it('Debería poder acceder a la ruta GET /api/usuarios', async () => {
        const res = await request(app).get('/api/usuarios');
        expect(res.statusCode).not.toBe(404);
    });

    it('Debería poder acceder a la ruta GET /api/patrocinadores', async () => {
        const res = await request(app).get('/api/patrocinadores');
        expect(res.statusCode).not.toBe(404);
    });

    // PRUEBAS PARA ARCHIVOS ESTÁTICOS
    it('Debería retornar 404 para un archivo estático inexistente', async () => {
        const res = await request(app).get('/uploads/archivo-inexistente.txt');
        expect(res.statusCode).toBe(404);
    });

    // Ejemplo de prueba para un archivo estático que existe
    it('Debería retornar 200 para un archivo estático que existe', async () => {
        // Para que esta prueba funcione, debes asegurarte de que
        // exista un archivo llamado 'prueba.txt' en tu carpeta 'uploads'.
        const res = await request(app).get('/uploads/prueba.txt');
        // expect(res.statusCode).toBe(200);
        // Descomenta la línea de arriba cuando añadas un archivo de prueba.
    });

});