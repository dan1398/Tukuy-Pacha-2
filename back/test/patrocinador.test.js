// test/patrocinador.test.js - CÓDIGO CORREGIDO

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import pool from '../src/db.js';

// Datos de prueba
const testData = {
    patrocinadorId: null,
    participanteId: null,
};

describe('Pruebas de Integración para la API de Patrocinadores', () => {
    beforeAll(async () => {
        try {
            console.log('⚙️ Configurando entorno de pruebas para patrocinadores...');
            
            console.log('🧹 Limpiando datos anteriores...');
            await pool.query("DELETE FROM patrocinador_participante WHERE id_patrocinador IN (SELECT id_patrocinador FROM patrocinador WHERE nombre LIKE 'TestPatrocinador%')");
            await pool.query("DELETE FROM Participante WHERE nombre LIKE 'TestParticipantePatrocinador%'");
            await pool.query("DELETE FROM patrocinador WHERE nombre LIKE 'TestPatrocinador%'");

            console.log('👥 Creando participante de prueba para patrocinio...');
            
            const codigoParticipante = `PAT-${Math.floor(Math.random() * 10000)}`;

            const [participanteResult] = await pool.query(
                `INSERT INTO Participante 
                (codigo, nombre, apellido_paterno, apellido_materno, CI, fecha_nacimiento, direccion, celular) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    codigoParticipante,
                    'TestParticipantePatrocinador',
                    'Apellido',
                    'Materno',
                    '12345678',
                    '2000-01-01',
                    'Direccion de prueba, La Paz',
                    '12345678'
                ]
            );
            testData.participanteId = participanteResult.insertId;
            console.log(`✅ Participante creado con ID: ${testData.participanteId}`);

        } catch (error) {
            console.error('❌ Error en beforeAll:', error);
            throw error;
        }
    });

    afterAll(async () => {
        try {
            console.log('🧽 Limpiando después de las pruebas de patrocinadores...');
            
            if (testData.patrocinadorId) {
                await pool.query('DELETE FROM patrocinador_participante WHERE id_patrocinador = ?', [testData.patrocinadorId]);
                await pool.query('DELETE FROM patrocinador WHERE id_patrocinador = ?', [testData.patrocinadorId]);
            }
            
            if (testData.participanteId) {
                await pool.query('DELETE FROM Participante WHERE id_participante = ?', [testData.participanteId]);
            }
            
            console.log('✅ Limpieza de patrocinadores completada');
        } catch (error) {
            console.error('❌ Error en afterAll:', error);
        }
    });

    it('POST /api/patrocinadores - Debería crear un nuevo patrocinador (201)', async () => {
        const res = await request(app)
            .post('/api/patrocinadores') // <-- Ruta corregida
            .send({
                nombre: 'TestPatrocinador',
                apellido_paterno: 'ApellidoPat',
                apellido_materno: 'MaternoPat',
                celular: '123456789',
                correo: 'testpatrocinador@example.com'
            });

        console.log('📤 Respuesta POST patrocinador:', res.body);
        
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
        testData.patrocinadorId = res.body.id;
    });

    it('GET /api/patrocinadores - Debería listar todos los patrocinadores (200)', async () => {
        const res = await request(app).get('/api/patrocinadores'); // <-- Ruta corregida
        
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.some(p => p.id_patrocinador === testData.patrocinadorId)).toBe(true);
    });

    it('GET /api/patrocinadores?busqueda= - Debería encontrar patrocinadores por su nombre (200)', async () => {
        const res = await request(app).get('/api/patrocinadores?busqueda=TestPatrocinador'); // <-- Ruta corregida
        
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(1);
        expect(res.body[0]).toHaveProperty('nombre', 'TestPatrocinador');
    });

    it('GET /api/patrocinadores/:id - Debería obtener un patrocinador por su ID (200)', async () => {
        const res = await request(app).get(`/api/patrocinadores/${testData.patrocinadorId}`); // <-- Ruta corregida
        
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('id_patrocinador', testData.patrocinadorId);
        expect(res.body).toHaveProperty('nombre', 'TestPatrocinador');
    });

    it('POST /api/patrocinadores/patrocinar - Debería crear un nuevo patrocinio (201)', async () => {
        const res = await request(app)
            .post('/api/patrocinadores/patrocinar') // <-- Ruta corregida
            .send({
                id_patrocinador: testData.patrocinadorId,
                id_participante: testData.participanteId
            });

        console.log('📤 Respuesta POST patrocinio:', res.body);
        
        expect(res.status).toBe(201);
        expect(res.body.mensaje).toMatch(/registrado exitosamente/i);
    });

    it('GET /api/patrocinadores/:id/participantes - Debería obtener los participantes de un patrocinador (200)', async () => {
        const res = await request(app).get(`/api/patrocinadores/${testData.patrocinadorId}/participantes`); // <-- Ruta corregida
        
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.some(p => p.id_participante === testData.participanteId)).toBe(true);
    });

    it('PUT /api/patrocinadores/:id - Debería actualizar un patrocinador existente (200)', async () => {
        const res = await request(app)
            .put(`/api/patrocinadores/${testData.patrocinadorId}`) // <-- Ruta corregida
            .send({
                nombre: 'PatrocinadorActualizado',
                apellido_paterno: 'ApellidoPat',
                apellido_materno: 'MaternoPat',
                celular: '99887766',
                correo: 'updatedpatrocinador@example.com'
            });

        expect(res.status).toBe(200);
        expect(res.body.mensaje).toMatch(/actualizado exitosamente/i);
    });

    it('DELETE /api/patrocinadores/:id - Debería eliminar el patrocinador y su patrocinio (200)', async () => {
        const res = await request(app).delete(`/api/patrocinadores/${testData.patrocinadorId}`); // <-- Ruta corregida
        
        expect(res.status).toBe(200);
        expect(res.body.mensaje).toMatch(/eliminados exitosamente/i);
        
        const res2 = await request(app).get(`/api/patrocinadores/${testData.patrocinadorId}`); // <-- Ruta corregida
        expect(res2.status).toBe(404);
        
        const [rows] = await pool.query('SELECT * FROM patrocinador_participante WHERE id_patrocinador = ?', [testData.patrocinadorId]);
        expect(rows.length).toBe(0);
    });
});