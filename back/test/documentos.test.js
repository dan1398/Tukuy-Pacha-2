// En tu archivo de test (ej. documentos.test.js)

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import pool from '../src/db.js';

// Configuración de directorios
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const uploadsDir = path.resolve(__dirname, '..', '..', 'uploads');
const testFile = path.resolve(__dirname, 'test-file.pdf');

// Datos para las pruebas
const testData = {
    userId: null,
    participanteId: null,
    documentoId: null,
    filename: null
};

describe('Pruebas de Integración para la API de Documentos', () => {
    beforeAll(async () => {
        try {
            console.log('⚙️ Configurando entorno de pruebas...');
            
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }
            console.log(`📂 Carpeta uploads creada: ${uploadsDir}`);

            fs.writeFileSync(testFile, 'Este es un archivo de prueba para documentos');
            console.log(`📄 Archivo de prueba creado: ${testFile}`);

            console.log('🧹 Limpiando datos anteriores...');
            await pool.query("DELETE FROM Documento WHERE nombre_archivo LIKE 'test%'");
            await pool.query("DELETE FROM Usuario WHERE correo LIKE 'test.doc%'");
            await pool.query("DELETE FROM Participante WHERE nombre LIKE 'TestParticipante%'");

            console.log('👤 Creando usuario de prueba...');
            const [userResult] = await pool.query(
                `INSERT INTO Usuario 
                (nombre, apellido_paterno, apellido_materno, correo, contraseña, rol) 
                VALUES (?, ?, ?, ?, ?, ?)`, 
                [
                    'TestUser', 
                    'TestApellido', 
                    'TestMaterno', 
                    `test.doc.${Date.now()}@example.com`, 
                    'test123', 
                    'Administrador'
                ]
            );
            testData.userId = userResult.insertId;
            console.log(`✅ Usuario creado con ID: ${testData.userId}`);

            console.log('👥 Creando participante de prueba...');
            const [participanteResult] = await pool.query(
                `INSERT INTO Participante 
                (nombre, apellido_paterno, apellido_materno, fecha_nacimiento) 
                VALUES (?, ?, ?, ?)`,
                [
                    'TestParticipante',
                    'TestApellido',
                    'TestMaterno',
                    '2000-01-01'
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
            console.log('🧽 Limpiando después de las pruebas...');
            
            if (testData.documentoId) {
                console.log(`🗑️ Eliminando documento ID: ${testData.documentoId}`);
                await pool.query('DELETE FROM Documento WHERE id_documento = ?', [testData.documentoId]);
            }

            if (testData.userId) {
                console.log(`👤 Eliminando usuario ID: ${testData.userId}`);
                await pool.query('DELETE FROM Usuario WHERE id_usuario = ?', [testData.userId]);
            }

            if (testData.participanteId) {
                console.log(`👥 Eliminando participante ID: ${testData.participanteId}`);
                await pool.query('DELETE FROM Participante WHERE id_participante = ?', [testData.participanteId]);
            }

            const filesToDelete = [testData.filename, 'test-file.pdf'];
            for (const filename of filesToDelete) {
                if (filename) {
                    const filePath = path.join(uploadsDir, filename);
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                        console.log(`📄 Archivo eliminado: ${filePath}`);
                    }
                }
            }
            
            if (fs.existsSync(testFile)) {
                fs.unlinkSync(testFile);
                console.log(`📄 Archivo de prueba eliminado: ${testFile}`);
            }

            console.log('✅ Limpieza completada');
        } catch (error) {
            console.error('❌ Error en afterAll:', error);
        }
    });

    it('POST /api/documentos - Debería subir un nuevo documento (201)', async () => {
        const res = await request(app)
            .post('/api/documentos')
            .attach('archivo', testFile)
            .field('tipo_documento', 'CV')
            .field('id_usuario', testData.userId.toString())
            .field('id_participante', testData.participanteId.toString());

        console.log('📤 Respuesta de subida:', {
            status: res.status,
            body: res.body
        });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id_documento');
        expect(res.body).toHaveProperty('filename');
        expect(typeof res.body.id_documento).toBe('number');
        expect(typeof res.body.filename).toBe('string');
        
        testData.documentoId = res.body.id_documento;
        testData.filename = res.body.filename;
    });

    it('GET /api/documentos - Debería listar documentos incluyendo el recién creado (200)', async () => {
        const res = await request(app).get('/api/documentos');
        
        console.log('📋 Listado de documentos:', res.body);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.some(doc => doc.id_documento === testData.documentoId)).toBe(true);
    });

    it('PUT /api/documentos/:id - Debería actualizar un documento (200)', async () => {
        const res = await request(app)
            .put(`/api/documentos/${testData.documentoId}`)
            .attach('archivo', testFile)
            .field('tipo_documento', 'Acta')
            .field('id_usuario', testData.userId.toString())
            .field('id_participante', testData.participanteId.toString());

        console.log('🔄 Respuesta de actualización:', {
            status: res.status,
            body: res.body
        });

        expect(res.status).toBe(200);
        expect(res.body.mensaje).toMatch(/actualizado/i);
        
        // Actualizar el nombre del archivo para que el test de descarga no falle
        testData.filename = res.body.nuevo_nombre_archivo;
    });

    it('GET /api/documentos/download/:filename - Debería descargar un documento (200)', async () => {
        const res = await request(app)
            .get(`/api/documentos/download/${testData.filename}`);

        expect(res.status).toBe(200);
        expect(res.header['content-type']).toBe('application/pdf');
        expect(res.body.toString()).toBe('Este es un archivo de prueba para documentos');
    });

    it('DELETE /api/documentos/:id - Debería eliminar un documento (200)', async () => {
        const res = await request(app)
            .delete(`/api/documentos/${testData.documentoId}`);

        console.log('🗑️ Respuesta de eliminación:', {
            status: res.status,
            body: res.body
        });

        expect(res.status).toBe(200);
        expect(res.body.mensaje).toMatch(/eliminado/i);
        
        const filePath = path.join(uploadsDir, testData.filename);
        expect(fs.existsSync(filePath)).toBe(false);
        
        testData.documentoId = null;
        testData.filename = null;
    });
});