import pool from '../db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Configuración de rutas para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Ruta a la carpeta 'uploads', asume que el controlador está en src/controllers y uploads está en la raíz del proyecto
const uploadsDir = path.resolve(__dirname, '..', '..', 'uploads'); 

console.log('Controlador de documentos está utilizando uploadsDir:', uploadsDir);

/**
 * Obtiene la lista de documentos, opcionalmente filtrada por ID de participante.
 * @param {object} req - Objeto de solicitud de Express.
 * @param {object} res - Objeto de respuesta de Express.
 */
export const getDocumentos = async (req, res) => {
    try {
        const { participanteId } = req.query;
        // La consulta une el documento con el participante para obtener el nombre
        let query = 'SELECT d.*, p.nombre AS nombre_participante FROM documento d LEFT JOIN Participante p ON d.id_participante = p.id_participante';
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

/**
 * Sube un nuevo documento y guarda su metadata en la base de datos.
 * @param {object} req - Objeto de solicitud de Express (espera 'req.file' de Multer).
 * @param {object} res - Objeto de respuesta de Express.
 */
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

        // Convertir IDs a números enteros
        const idUsuarioNumerico = parseInt(id_usuario, 10);
        const idParticipanteNumerico = parseInt(id_participante, 10);
        
        // Validación básica de IDs
        if (isNaN(idUsuarioNumerico) || isNaN(idParticipanteNumerico)) {
            return res.status(400).json({ mensaje: 'Los IDs de usuario o participante no son números válidos.' });
        }
        
        // Inserción en la base de datos
        const [result] = await pool.query(
            `INSERT INTO documento
             (nombre_archivo, tipo_documento, fecha_subida, ruta_archivo, id_usuario, id_participante)
             VALUES (?, ?, NOW(), ?, ?, ?)`,
            [
                archivo.originalname,
                tipo_documento,
                filenameInServer, // Nombre único generado por Multer
                idUsuarioNumerico, 
                idParticipanteNumerico 
            ]
        );

        res.status(201).json({
            mensaje: 'Archivo subido exitosamente',
            id_documento: result.insertId,
            filename: filenameInServer
        });
    } catch (err) {
        console.error('❌ Error al guardar documento:', err);
        // En caso de error de DB, se podría considerar eliminar el archivo subido si existe.
        res.status(500).json({ mensaje: 'Error al guardar documento', error: err.message });
    }
};

/**
 * Actualiza la información de un documento y opcionalmente reemplaza el archivo físico.
 * @param {object} req - Objeto de solicitud de Express.
 * @param {object} res - Objeto de respuesta de Express.
 */
export const updateDocumento = async (req, res) => {
    try {
        const { id } = req.params;
        const { tipo_documento, id_usuario, id_participante } = req.body;
        const file = req.file; // El nuevo archivo, si se subió

        const idDocumentoNumerico = parseInt(id, 10);

        if (isNaN(idDocumentoNumerico)) {
            return res.status(400).json({ mensaje: 'ID de documento no válido.' });
        }

        // Obtener la información del documento existente (TABLA: documento)
        const [oldFileResult] = await pool.query('SELECT ruta_archivo, nombre_archivo FROM documento WHERE id_documento = ?', [idDocumentoNumerico]);
        if (oldFileResult.length === 0) {
            return res.status(404).json({ mensaje: 'Documento no encontrado para actualizar.' });
        }
        
        // Determinar el nuevo nombre de archivo y ruta, manteniendo el antiguo si no hay un nuevo archivo.
        let newFilename = oldFileResult[0].ruta_archivo;
        let newOriginalname = oldFileResult[0].nombre_archivo;

        // Si se subió un nuevo archivo, elimina el anterior y actualiza los nombres
        if (file) {
            const oldFilePath = path.join(uploadsDir, oldFileResult[0].ruta_archivo);
            if (fs.existsSync(oldFilePath)) {
                // Elimina el archivo físico anterior de forma síncrona
                try {
                    fs.unlinkSync(oldFilePath);
                    console.log(`Archivo antiguo eliminado: ${oldFilePath}`);
                } catch (unlinkErr) {
                    console.error('⚠️ Advertencia: No se pudo eliminar el archivo antiguo:', unlinkErr);
                    // Continúa con la actualización de la DB a pesar del error de eliminación de archivo
                }
            }
            newFilename = file.filename;
            newOriginalname = file.originalname;
        }

        // Actualizar el documento en la base de datos
        await pool.query(
            `UPDATE documento SET 
                nombre_archivo = ?, 
                tipo_documento = ?, 
                ruta_archivo = ?, 
                id_usuario = ?, 
                id_participante = ? 
            WHERE id_documento = ?`,
            [newOriginalname, tipo_documento, newFilename, id_usuario, id_participante, idDocumentoNumerico]
        );

        return res.status(200).json({ 
            mensaje: 'Documento actualizado correctamente.', 
            nuevo_nombre_archivo: newFilename 
        });

    } catch (err) {
        console.error('❌ Error al actualizar documento:', err);
        return res.status(500).json({ mensaje: 'Error al actualizar el documento.', error: err.message });
    }
};

/**
 * Elimina un documento de la base de datos y su archivo físico asociado.
 * @param {object} req - Objeto de solicitud de Express.
 * @param {object} res - Objeto de respuesta de Express.
 */
export const deleteDocumento = async (req, res) => {
    const idDocumento = parseInt(req.params.id, 10);

    // Valida que el ID sea un número válido
    if (isNaN(idDocumento)) {
        return res.status(400).json({ mensaje: 'ID de documento no válido.' });
    }

    try {
        // 1. Obtener la ruta del archivo físico antes de eliminar el registro de la DB (TABLA: documento)
        const [rows] = await pool.query('SELECT ruta_archivo FROM documento WHERE id_documento = ?', [idDocumento]);

        if (rows.length === 0) {
            return res.status(404).json({ mensaje: 'Documento no encontrado' });
        }

        const filenameToDelete = rows[0].ruta_archivo;

        // 2. Eliminar el registro de la base de datos (TABLA: documento)
        await pool.query('DELETE FROM documento WHERE id_documento = ?', [idDocumento]);

        // 3. Eliminar el archivo físico (de forma asíncrona para no bloquear la respuesta)
        if (filenameToDelete) {
            const filePath = path.join(uploadsDir, filenameToDelete);
            if (fs.existsSync(filePath)) {
                // Utiliza fs.unlink (asíncrono) para la limpieza final
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

/**
 * Permite la descarga del archivo físico.
 * @param {object} req - Objeto de solicitud de Express.
 * @param {object} res - Objeto de respuesta de Express.
 */
export const downloadDocumento = (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, filename);

    console.log(`Intentando descargar el archivo desde la ruta: ${filePath}`);

    if (!fs.existsSync(filePath)) {
        console.error('ERROR: Archivo NO ENCONTRADO en la ruta especificada por el servidor:', filePath);
        return res.status(404).json({ message: 'Archivo no encontrado en el servidor.' });
    }

    // res.download establece los encabezados Content-Disposition y Content-Type automáticamente
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
