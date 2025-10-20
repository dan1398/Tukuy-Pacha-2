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

        // **Añade estas dos líneas para parsear los IDs a números enteros**
        const idUsuarioNumerico = parseInt(id_usuario, 10);
        const idParticipanteNumerico = parseInt(id_participante, 10);
        
        // Valida que los IDs sean números válidos
        if (isNaN(idUsuarioNumerico) || isNaN(idParticipanteNumerico)) {
            return res.status(400).json({ mensaje: 'Los IDs de usuario o participante no son números válidos.' });
        }
        
        const [result] = await pool.query(
            `INSERT INTO Documento
             (nombre_archivo, tipo_documento, fecha_subida, ruta_archivo, id_usuario, id_participante)
             VALUES (?, ?, NOW(), ?, ?, ?)`,
            [
                archivo.originalname,
                tipo_documento,
                filenameInServer,
                idUsuarioNumerico, // Usa la variable numérica
                idParticipanteNumerico // Usa la variable numérica
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

// En tu controlador de documentos (ej. documentos.controller.js)

export const updateDocumento = async (req, res) => {
    try {
        const { id } = req.params;
        const { tipo_documento, id_usuario, id_participante } = req.body;
        const file = req.file;

        if (!id) {
            return res.status(400).json({ mensaje: 'ID de documento no válido.' });
        }

        // Obtener la información del documento existente
        const [oldFileResult] = await pool.query('SELECT ruta_archivo, nombre_archivo FROM Documento WHERE id_documento = ?', [id]);
        if (oldFileResult.length === 0) {
            return res.status(404).json({ mensaje: 'Documento no encontrado para actualizar.' });
        }
        
        // --- ⚠️ Aquí está el cambio crucial ⚠️ ---
        // Determinar el nuevo nombre de archivo y ruta, manteniendo el antiguo si no hay un nuevo archivo.
        let newFilename = oldFileResult[0].ruta_archivo;
        let newOriginalname = oldFileResult[0].nombre_archivo;

        // Si se subió un nuevo archivo, elimina el anterior y actualiza los nombres
        if (file) {
            const oldFilePath = path.join(uploadsDir, oldFileResult[0].ruta_archivo);
            if (fs.existsSync(oldFilePath)) {
                fs.unlinkSync(oldFilePath);
                console.log(`Archivo antiguo eliminado: ${oldFilePath}`);
            }
            newFilename = file.filename;
            newOriginalname = file.originalname;
        }

        // Actualizar el documento en la base de datos
        await pool.query(
            `UPDATE Documento SET 
                nombre_archivo = ?, 
                tipo_documento = ?, 
                ruta_archivo = ?, 
                id_usuario = ?, 
                id_participante = ? 
            WHERE id_documento = ?`,
            [newOriginalname, tipo_documento, newFilename, id_usuario, id_participante, id]
        );

        return res.status(200).json({ 
            mensaje: 'Documento actualizado correctamente.', 
            nuevo_nombre_archivo: newFilename 
        });

    } catch (err) {
        console.error('❌ Error al actualizar documento:', err);
        return res.status(500).json({ mensaje: 'Error al actualizar el documento.' });
    }
};

export const deleteDocumento = async (req, res) => {
    // **Añade esta línea para convertir el ID del documento a un número entero**
    const idDocumento = parseInt(req.params.id, 10);

    // Valida que el ID sea un número válido
    if (isNaN(idDocumento)) {
        return res.status(400).json({ mensaje: 'ID de documento no válido.' });
    }

    try {
        const [rows] = await pool.query('SELECT ruta_archivo FROM Documento WHERE id_documento = ?', [idDocumento]);

        if (rows.length === 0) {
            return res.status(404).json({ mensaje: 'Documento no encontrado' });
        }

        const filenameToDelete = rows[0].ruta_archivo;

        await pool.query('DELETE FROM Documento WHERE id_documento = ?', [idDocumento]);

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