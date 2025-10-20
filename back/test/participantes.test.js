// test/participantes.test.js - CÓDIGO CORREGIDO

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import pool from '../src/db.js';

// Configuración de directorios y datos de prueba
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const uploadsDir = path.resolve(__dirname, '..', 'uploads');
const testImage = path.resolve(__dirname, 'test-image.png');

const testData = {
    patrocinadorId: null,
    participanteId: null,
    participanteCodigo: null,
    participanteFoto: null
};

describe('Pruebas de Integración para la API de Participantes', () => {
    beforeAll(async () => {
        try {
            console.log('⚙️ Configurando entorno de pruebas para participantes...');

            // 1. Crear carpeta uploads si no existe
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }

            // 2. Crear archivo de imagen de prueba
            fs.writeFileSync(testImage, Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]));
            console.log(`🖼️ Archivo de imagen de prueba creado: ${testImage}`);

            // 3. Limpiar datos de pruebas anteriores
            console.log('🧹 Limpiando datos anteriores...');
            await pool.query("DELETE FROM patrocinador_participante WHERE id_participante IN (SELECT id_participante FROM Participante WHERE codigo LIKE 'TEST%')");
            await pool.query("DELETE FROM Participante WHERE codigo LIKE 'TEST%'");
            await pool.query("DELETE FROM Patrocinador WHERE nombre LIKE 'TestPatrocinador%'");

            // 4. Crear patrocinador de prueba
            console.log('💰 Creando patrocinador de prueba...');
            const [patrocinadorResult] = await pool.query(
                `INSERT INTO Patrocinador (nombre, apellido_paterno, correo, celular) VALUES (?, ?, ?, ?)`,
                ['TestPatrocinador', 'Apellido', 'test.patrocinador@example.com', '12345678']
            );
            testData.patrocinadorId = patrocinadorResult.insertId;
            console.log(`✅ Patrocinador creado con ID: ${testData.patrocinadorId}`);

        } catch (error) {
            console.error('❌ Error en beforeAll:', error);
            throw error;
        }
    });

    afterAll(async () => {
        try {
            console.log('🧽 Limpiando después de las pruebas de participantes...');
            
            // 1. Eliminar participante de prueba y su relación de patrocinio
            if (testData.participanteId) {
                await pool.query("DELETE FROM patrocinador_participante WHERE id_participante = ?", [testData.participanteId]);
                await pool.query('DELETE FROM Participante WHERE id_participante = ?', [testData.participanteId]);
            }
            
            // 2. Eliminar patrocinador de prueba
            if (testData.patrocinadorId) {
                await pool.query('DELETE FROM Patrocinador WHERE id_patrocinador = ?', [testData.patrocinadorId]);
            }

            // 3. Eliminar archivos temporales
            if (fs.existsSync(testImage)) {
                fs.unlinkSync(testImage);
            }
            if (testData.participanteFoto && fs.existsSync(path.join(uploadsDir, testData.participanteFoto))) {
                fs.unlinkSync(path.join(uploadsDir, testData.participanteFoto));
            }
            
            console.log('✅ Limpieza de participantes completada');
        } catch (error) {
            console.error('❌ Error en afterAll:', error);
        }
    });

    it('POST /api/participantes - Debería crear un nuevo participante (201)', async () => {
        const codigo = `TEST-${Date.now()}`;
        const res = await request(app)
            .post('/api/participantes')
            .attach('foto', testImage)
            .field('codigo', codigo)
            .field('nombre', 'TestNombre')
            .field('apellido_paterno', 'TestApellido')
            .field('apellido_materno', 'TestMaterno') // <-- Campo agregado
            .field('CI', '12345678')
            .field('fecha_nacimiento', '2000-01-01')
            .field('direccion', 'Calle Falsa 123, Cochabamba')
            .field('celular', '98765432')
            .field('id_patrocinador', testData.patrocinadorId.toString());

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('codigo', codigo);

        testData.participanteId = res.body.id;
        testData.participanteCodigo = codigo;
    });

    it('GET /api/participantes - Debería listar participantes incluyendo el recién creado (200)', async () => {
        // Ejecutamos la prueba después de que POST haya creado el participante
        if (!testData.participanteId) {
          throw new Error('El participante de prueba no se creó, no se puede ejecutar este test.');
        }

        const res = await request(app).get('/api/participantes');

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.some(p => p.id_participante === testData.participanteId)).toBe(true);
    });

    it('GET /api/participantes/buscar - Debería encontrar el participante por su código (200)', async () => {
        if (!testData.participanteCodigo) {
          throw new Error('El código de prueba no se creó, no se puede ejecutar este test.');
        }

        const res = await request(app).get(`/api/participantes/buscar?termino=${testData.participanteCodigo}`);
        
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(1);
        expect(res.body[0].codigo).toBe(testData.participanteCodigo);
    });

    it('GET /api/participantes/:id - Debería obtener un participante por su ID (200)', async () => {
        if (!testData.participanteId) {
            throw new Error('El ID de participante no se creó, no se puede ejecutar este test.');
        }

        const res = await request(app).get(`/api/participantes/${testData.participanteId}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('id_participante', testData.participanteId);
        expect(res.body).toHaveProperty('patrocinador_nombre', 'TestPatrocinador');
        expect(res.body).toHaveProperty('codigo', testData.participanteCodigo);
        
        testData.participanteFoto = res.body.foto;
    });

    it('PUT /api/participantes/:id - Debería actualizar un participante (200)', async () => {
        if (!testData.participanteId) {
            throw new Error('El ID de participante no se creó, no se puede ejecutar este test.');
        }

        const res = await request(app)
            .put(`/api/participantes/${testData.participanteId}`)
            .field('codigo', testData.participanteCodigo)
            .field('nombre', 'NombreActualizado')
            .field('apellido_paterno', 'TestApellido')
            .field('apellido_materno', 'TestMaterno')
            .field('CI', '12345678')
            .field('fecha_nacimiento', '2000-01-01')
            .field('direccion', 'Calle Falsa 123, Santa Cruz')
            .field('celular', '98765432')
            .field('id_patrocinador', testData.patrocinadorId.toString());

        expect(res.status).toBe(200);
        expect(res.body.mensaje).toMatch(/actualizados/i);
    });

    it('PUT /api/participantes/:id - Debería actualizar un participante sin foto (200)', async () => {
      if (!testData.participanteId) {
        throw new Error('El ID de participante no se creó, no se puede ejecutar este test.');
      }
      
      const res = await request(app)
          .put(`/api/participantes/${testData.participanteId}`)
          .field('mantener_foto', 'false')
          .field('codigo', testData.participanteCodigo)
          .field('nombre', 'NombreSinFoto')
          .field('apellido_paterno', 'TestApellido')
          .field('apellido_materno', 'TestMaterno')
          .field('CI', '12345678')
          .field('fecha_nacimiento', '2000-01-01')
          .field('direccion', 'Calle Falsa 123, La Paz')
          .field('celular', '98765432');
  
      expect(res.status).toBe(200);
      expect(res.body.mensaje).toMatch(/actualizados/i);
    });

    it('DELETE /api/participantes/:id - Debería eliminar un participante (200)', async () => {
        if (!testData.participanteId) {
            throw new Error('El ID de participante no se creó, no se puede ejecutar este test.');
        }

        const res = await request(app).delete(`/api/participantes/${testData.participanteId}`);

        expect(res.status).toBe(200);
        expect(res.body.mensaje).toMatch(/eliminados/i);
        
        // Verificar que el participante ya no existe
        const res2 = await request(app).get(`/api/participantes/${testData.participanteId}`);
        expect(res2.status).toBe(404);

        // Verificar que la foto física también fue eliminada
        if (testData.participanteFoto) {
            expect(fs.existsSync(path.join(uploadsDir, testData.participanteFoto))).toBe(false);
        }
    });
});