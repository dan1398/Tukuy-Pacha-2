import pool from '../db.js';
import fs from 'fs'; // Importar fs para manejar archivos
import path from 'path'; // Importar path para manejar rutas de archivos
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../uploads'); // Ruta correcta para 'uploads'

export const getDocumentos = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Documento');
    res.json(rows);
  } catch (err) {
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
    const filename = archivo.filename; // Nombre del archivo guardado por Multer

    const [result] = await pool.query(
      `INSERT INTO Documento 
         (nombre_archivo, tipo_documento, fecha_subida, ruta_archivo, id_usuario, id_participante)
         VALUES (?, ?, NOW(), ?, ?, ?)`,
      [
        archivo.originalname, // Nombre original del archivo
        tipo_documento,
        filename,             // Nombre del archivo en el servidor (generado por Multer)
        id_usuario,
        id_participante
      ]
    );

    res.status(201).json({ mensaje: 'Archivo subido exitosamente', id_documento: result.insertId });
  } catch (err) {
    console.error('❌ Error al guardar documento:', err);
    res.status(500).json({ mensaje: 'Error al guardar documento', error: err.message });
  }
};

// --- NUEVA FUNCIÓN PARA ACTUALIZAR UN DOCUMENTO ---
export const updateDocumento = async (req, res) => {
  const { id } = req.params;
  const { tipo_documento, id_usuario, id_participante } = req.body;
  const archivo = req.file; // El nuevo archivo si se subió uno

  console.log(`→ Actualizando Documento ID: ${id}`);
  console.log('  req.body (PUT):', req.body);
  console.log('  req.file (PUT):', archivo);

  try {
    // 1. Obtener el documento existente para ver su ruta de archivo anterior
    const [existingDocRows] = await pool.query('SELECT ruta_archivo FROM Documento WHERE id_documento = ?', [id]);

    if (existingDocRows.length === 0) {
      return res.status(404).json({ mensaje: 'Documento no encontrado.' });
    }

    const oldFilePath = existingDocRows[0].ruta_archivo; // Nombre del archivo antiguo en /uploads

    let query = 'UPDATE Documento SET tipo_documento = ?, id_usuario = ?, id_participante = ?';
    let params = [tipo_documento, id_usuario, id_participante];

    if (archivo) { // Si se subió un nuevo archivo
      query += ', nombre_archivo = ?, ruta_archivo = ?';
      params.push(archivo.originalname, archivo.filename);

      // Eliminar el archivo antiguo si existe y es diferente al nuevo
      if (oldFilePath && oldFilePath !== archivo.filename) { // Evita borrar el mismo archivo si por alguna razón el nombre no cambia (raro con Date.now)
        const fullOldPath = path.join(uploadsDir, oldFilePath);
        if (fs.existsSync(fullOldPath)) {
          fs.unlinkSync(fullOldPath);
          console.log(`  Archivo antiguo eliminado: ${fullOldPath}`);
        }
      }
    } else {
      // Si no se subió un nuevo archivo, mantenemos el nombre y ruta existentes.
      // Aquí podrías añadir lógica si quisieras permitir 'borrar' un archivo
      // de un documento sin subir uno nuevo, por ejemplo, si el frontend envía una señal para eso.
      // Por ahora, si no hay 'archivo' en la solicitud PUT, el archivo existente se mantiene.
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
    // Primero, obtener la ruta del archivo físico para eliminarlo
    const [rows] = await pool.query('SELECT ruta_archivo FROM Documento WHERE id_documento = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ mensaje: 'Documento no encontrado' });
    }

    const ruta_archivo_fisico = rows[0].ruta_archivo;

    // Eliminar el registro de la base de datos
    await pool.query('DELETE FROM Documento WHERE id_documento = ?', [id]);

    // Eliminar el archivo físico del sistema de archivos
    if (ruta_archivo_fisico) {
      const filePath = path.join(uploadsDir, ruta_archivo_fisico);
      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error('❌ Error al eliminar archivo físico:', err);
            // Podrías decidir si enviar un error 500 aquí o solo loguearlo
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