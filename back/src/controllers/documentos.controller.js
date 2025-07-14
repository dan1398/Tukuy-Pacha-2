import pool from '../db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const uploadsDir = path.resolve(__dirname, '..', '..', 'uploads'); // Ruta a la carpeta 'uploads'

console.log('Controlador de documentos está utilizando uploadsDir:', uploadsDir);

export const getDocumentos = async (req, res) => {
    try {
        const { participanteId } = req.query;
        let query = 'SELECT d.*, p.nombre AS nombre_participante FROM Documento d LEFT JOIN Participante p ON d.id_participante = p.id_participante';
        let params = [];

        if (participanteId) {
            query += ' WHERE d.id_participante = ?';
            params.push(participanteId);
        }

        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error('❌ Error al obtener documentos:', err);
        res.status(500).json({ mensaje: 'Error al obtener documentos', error: err.message });
    }
};

export const uploadDocumento = async (req, res) => {
    console.log('→ Documento req.body (POST):', req.body);
    console.log('→ Documento req.file (POST):', req.file);

    const { tipo_documento, id_usuario, id_participante } = req.body;
    const archivo = req.file;

    if (!archivo) {
        return res.status(400).json({ mensaje: 'No se subió ningún archivo' });
    }

    try {
        const filenameInServer = archivo.filename;

        const [result] = await pool.query(
            `INSERT INTO Documento
             (nombre_archivo, tipo_documento, fecha_subida, ruta_archivo, id_usuario, id_participante)
             VALUES (?, ?, NOW(), ?, ?, ?)`,
            [
                archivo.originalname,
                tipo_documento,
                filenameInServer,
                id_usuario,
                id_participante
            ]
        );

        res.status(201).json({
            mensaje: 'Archivo subido exitosamente',
            id_documento: result.insertId,
            filename: filenameInServer
        });
    } catch (err) {
        console.error('❌ Error al guardar documento:', err);
        res.status(500).json({ mensaje: 'Error al guardar documento', error: err.message });
    }
};

export const updateDocumento = async (req, res) => {
    const { id } = req.params;
    const { tipo_documento, id_usuario, id_participante } = req.body;
    const archivo = req.file;

    console.log(`→ Actualizando Documento ID: ${id}`);
    console.log('   req.body (PUT):', req.body);
    console.log('   req.file (PUT):', archivo);

    try {
        const [existingDocRows] = await pool.query('SELECT ruta_archivo FROM Documento WHERE id_documento = ?', [id]);

        if (existingDocRows.length === 0) {
            return res.status(404).json({ mensaje: 'Documento no encontrado.' });
        }

        const oldFilename = existingDocRows[0].ruta_archivo;

        let query = 'UPDATE Documento SET tipo_documento = ?, id_usuario = ?, id_participante = ?';
        let params = [tipo_documento, id_usuario, id_participante];

        if (archivo) {
            query += ', nombre_archivo = ?, ruta_archivo = ?';
            params.push(archivo.originalname, archivo.filename);

            if (oldFilename && oldFilename !== archivo.filename) {
                const fullOldPath = path.join(uploadsDir, oldFilename);
                if (fs.existsSync(fullOldPath)) {
                    fs.unlinkSync(fullOldPath);
                    console.log(`   Archivo antiguo eliminado: ${fullOldPath}`);
                }
            }
        }

        query += ' WHERE id_documento = ?';
        params.push(id);

        const [result] = await pool.query(query, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Documento no encontrado para actualizar.' });
        }

        res.status(200).json({ mensaje: 'Documento actualizado correctamente.' });

    } catch (err) {
        console.error("❌ Error al actualizar documento:", err);
        res.status(500).json({ mensaje: 'Error interno del servidor al actualizar documento.', error: err.message });
    }
};

export const deleteDocumento = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query('SELECT ruta_archivo FROM Documento WHERE id_documento = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ mensaje: 'Documento no encontrado' });
        }

        const filenameToDelete = rows[0].ruta_archivo;

        await pool.query('DELETE FROM Documento WHERE id_documento = ?', [id]);

        if (filenameToDelete) {
            const filePath = path.join(uploadsDir, filenameToDelete);
            if (fs.existsSync(filePath)) {
                fs.unlink(filePath, (err) => {
                    if (err) {
                        console.error('❌ Error al eliminar archivo físico:', err);
                    } else {
                        console.log(`Archivo físico eliminado: ${filePath}`);
                    }
                });
            } else {
                console.warn(`Archivo físico no encontrado para eliminar: ${filePath}`);
            }
        }

        res.json({ mensaje: 'Documento eliminado correctamente' });
    } catch (err) {
        console.error('❌ Error al eliminar documento:', err);
        res.status(500).json({ mensaje: 'Error al eliminar documento', error: err.message });
    }
};

export const downloadDocumento = (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, filename);

    console.log(`Intentando descargar el archivo desde la ruta: ${filePath}`);

    if (!fs.existsSync(filePath)) {
        console.error('ERROR: Archivo NO ENCONTRADO en la ruta especificada por el servidor:', filePath);
        return res.status(404).json({ message: 'Archivo no encontrado en el servidor.' });
    }

    res.download(filePath, (err) => {
        if (err) {
            if (err.code === 'ENOENT') {
                console.error('Error (ENOENT): El archivo no existe en la ruta especificada durante res.download:', filePath);
                return res.status(404).json({ message: 'Archivo no encontrado durante el proceso de descarga.' });
            }
            console.error('Error general al intentar descargar el archivo:', err);
            return res.status(500).json({ message: 'Error interno del servidor al descargar el archivo.', error: err.message });
        } else {
            console.log(`Archivo '${filename}' enviado para descarga exitosamente.`);
        }
    });
};