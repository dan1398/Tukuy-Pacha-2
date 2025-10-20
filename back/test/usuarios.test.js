import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import pool from '../src/db.js';
import nodemailer from 'nodemailer'; // Asegúrate de importar nodemailer para que el mock funcione correctamente.

// Mockeamos el módulo de nodemailer para evitar el envío de correos reales en los tests
vi.mock('nodemailer', async () => {
    // Importamos el módulo original para obtener todos sus exports
    const actual = await vi.importActual('nodemailer');

    // Retornamos todos los exports originales, pero sobreescribimos 'createTransport'
    return {
        ...actual,
        createTransport: vi.fn(() => ({
            sendMail: vi.fn(() => Promise.resolve({ response: '250 OK' })),
        })),
    };
});


// Datos de prueba globales
const testData = {
    usuarioId: null,
    testUser: {
        nombre: 'TestUsuario',
        apellido_paterno: 'ApellidoPat',
        apellido_materno: 'ApellidoMat',
        correo: 'test.usuario@example.com',
        rol: 'Administrador'
    }
};

describe('Pruebas de Integración para la API de Usuarios', () => {
    beforeAll(async () => {
        try {
            console.log('⚙️ Configurando entorno de pruebas para usuarios...');
            console.log('🧹 Limpiando datos anteriores...');
            
            await pool.query("DELETE FROM Usuario WHERE correo = ?", [testData.testUser.correo]);
            await pool.query("DELETE FROM Usuario WHERE correo = 'usuario.actualizado@example.com'");

        } catch (error) {
            console.error('❌ Error en beforeAll:', error);
            throw error;
        }
    });

    afterAll(async () => {
        try {
            console.log('🧽 Limpiando después de las pruebas de usuarios...');
            if (testData.usuarioId) {
                await pool.query('DELETE FROM Usuario WHERE id_usuario = ?', [testData.usuarioId]);
            }
            await pool.query("DELETE FROM Usuario WHERE correo = ?", [testData.testUser.correo]);
            await pool.query("DELETE FROM Usuario WHERE correo = 'usuario.actualizado@example.com'");
            console.log('✅ Limpieza de usuarios completada');
        } catch (error) {
            console.error('❌ Error en afterAll:', error);
        }
    });

    // TEST 1: Crear un nuevo usuario
    it('POST /api/usuarios - Debería crear un nuevo usuario y enviar un correo (201)', async () => {
        const res = await request(app)
            .post('/api/usuarios')
            .send(testData.testUser);

        console.log('📤 Respuesta POST usuarios:', res.body);
        
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body.mensaje).toMatch(/Usuario creado y credenciales enviadas por correo/i);
        
        testData.usuarioId = res.body.id;
    });

    // TEST 2: Obtener todos los usuarios
    it('GET /api/usuarios - Debería listar todos los usuarios (200)', async () => {
        const res = await request(app).get('/api/usuarios');
        
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.some(u => u.id_usuario === testData.usuarioId)).toBe(true);
    });

    // TEST 3: Obtener un usuario por su ID
    it('GET /api/usuarios/:id - Debería obtener un usuario por su ID (200)', async () => {
        const res = await request(app).get(`/api/usuarios/${testData.usuarioId}`);
        
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('id_usuario', testData.usuarioId);
        expect(res.body).toHaveProperty('nombre', testData.testUser.nombre);
    });

    // TEST 4: Fallo al obtener un usuario no existente
    it('GET /api/usuarios/:id - Debería retornar 404 si el usuario no existe', async () => {
        const res = await request(app).get('/api/usuarios/999999');
        
        expect(res.status).toBe(404);
        expect(res.body.mensaje).toBe('Usuario no encontrado');
    });

    // TEST 5: Actualizar el rol de un usuario
    it('PUT /api/usuarios/:id/rol - Debería actualizar el rol de un usuario (200)', async () => {
        const res = await request(app)
            .put(`/api/usuarios/${testData.usuarioId}/rol`)
            .send({ rol: 'Personal' });

        expect(res.status).toBe(200);
        expect(res.body.mensaje).toBe('Rol actualizado');

        const [rows] = await pool.query('SELECT rol FROM Usuario WHERE id_usuario = ?', [testData.usuarioId]);
        expect(rows[0].rol).toBe('Personal');
    });

    // TEST 6: Actualizar la contraseña de un usuario
    it('PUT /api/usuarios/:id/contrasena - Debería actualizar la contraseña de un usuario (200)', async () => {
        const nuevaContrasena = 'nuevaContrasena123!';
        const res = await request(app)
            .put(`/api/usuarios/${testData.usuarioId}/contrasena`)
            .send({ nuevaContrasena });

        expect(res.status).toBe(200);
        expect(res.body.mensaje).toBe('Contraseña actualizada');
        
        // No podemos verificar la contraseña directamente, solo que se actualizó.
        // Podríamos mockear bcrypt.compare para verificar que la nueva contraseña es válida.
        // Pero para este test, la verificación de la respuesta del endpoint es suficiente.
    });

    // TEST 7: Restablecer la contraseña de un usuario
    it('POST /api/usuarios/:id/restablecer-contrasena - Debería restablecer la contraseña y enviar un correo (200)', async () => {
        const res = await request(app).post(`/api/usuarios/${testData.usuarioId}/restablecer-contrasena`);
        
        expect(res.status).toBe(200);
        expect(res.body.mensaje).toMatch(/Contraseña restablecida y enviada por correo/i);
    });

    // TEST 8: Actualizar usuario de forma genérica
    it('PUT /api/usuarios/:id - Debería actualizar un usuario existente (200)', async () => {
        const res = await request(app)
            .put(`/api/usuarios/${testData.usuarioId}`)
            .send({
                ...testData.testUser,
                correo: 'usuario.actualizado@example.com',
                rol: 'Personal'
            });

        expect(res.status).toBe(200);
        expect(res.body.mensaje).toBe('Usuario actualizado correctamente');
        
        const [rows] = await pool.query('SELECT correo FROM Usuario WHERE id_usuario = ?', [testData.usuarioId]);
        expect(rows[0].correo).toBe('usuario.actualizado@example.com');
    });

    // TEST 9: Eliminar un usuario
    it('DELETE /api/usuarios/:id - Debería eliminar un usuario (200)', async () => {
        const res = await request(app).delete(`/api/usuarios/${testData.usuarioId}`);
        
        expect(res.status).toBe(200);
        expect(res.body.mensaje).toMatch(/Usuario y sus documentos asociados eliminados/i);
        
        const [rows] = await pool.query('SELECT * FROM Usuario WHERE id_usuario = ?', [testData.usuarioId]);
        expect(rows.length).toBe(0);
    });
});