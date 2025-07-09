// src/controllers/participantes.controller.js

import pool from '../db.js';
import fs from 'fs';
import path from 'path';

// Función para obtener todos los participantes o buscar por código
export const getParticipantes = async (req, res) => {
    try {
        const { codigo } = req.query; // Obtén el parámetro 'codigo' de la query string
        let query = 'SELECT * FROM Participante';
        let params = [];

        if (codigo) {
            query += ' WHERE codigo = ?'; // Añade la cláusula WHERE si hay código
            params.push(codigo); // Añade el código a los parámetros de la consulta
        }

        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error('Error al obtener participantes (getParticipantes):', err);
        res.status(500).json({ mensaje: 'Error al obtener participantes', error: err.message });
    }
};

// **NUEVA FUNCIÓN: Para obtener un participante por su ID único**
export const getParticipanteById = async (req, res) => {
    const { id } = req.params; // Capturamos el ID del participante desde los parámetros de la URL

    try {
        // Asegúrate que 'id_participante' es el nombre de la columna en tu DB (según tu imagen, sí lo es)
        const [rows] = await pool.query('SELECT * FROM Participante WHERE id_participante = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ mensaje: 'Participante no encontrado' });
        }

        res.json(rows[0]); // Devolvemos el primer (y único) participante encontrado
    } catch (err) {
        console.error('Error al obtener participante por ID (getParticipanteById):', err);
        res.status(500).json({ mensaje: 'Error al obtener participante por ID', error: err.message });
    }
};

// Función para crear un nuevo participante
export const createParticipante = async (req, res) => {
    console.log('req.body =', req.body);
    console.log('req.file =', req.file);
    const {
        codigo,
        nombre,
        CI,
        fecha_nacimiento,
        direccion,
        celular,
        nombre_patrocinador,
        contacto
    } = req.body;

    const archivo = req.file; // Archivo de la foto subida por Multer

    try {
        const nombreFoto = archivo ? archivo.filename : null; // Nombre del archivo guardado si existe

        const [result] = await pool.query(
            `INSERT INTO Participante 
             (codigo, nombre, CI, fecha_nacimiento, direccion, celular, nombre_patrocinador, contacto, foto)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [codigo, nombre, CI, fecha_nacimiento, direccion, celular, nombre_patrocinador, contacto, nombreFoto]
        );

        res.status(201).json({ mensaje: 'Participante registrado', id: result.insertId });
    } catch (err) {
        console.error('Error al registrar participante:', err);
        // Si hay un error y se subió un archivo, intenta eliminarlo para evitar archivos huérfanos
        if (archivo && fs.existsSync(path.join('uploads', archivo.filename))) {
            fs.unlinkSync(path.join('uploads', archivo.filename));
            console.log(`Archivo ${archivo.filename} eliminado debido a un error en la base de datos.`);
        }
        res.status(500).json({ mensaje: 'Error en el servidor al registrar participante', error: err.message });
    }
};

// Función para actualizar un participante existente
export const updateParticipante = async (req, res) => {
    const { id } = req.params; // ID del participante a actualizar
    const {
        codigo,
        nombre,
        CI,
        fecha_nacimiento,
        direccion,
        celular,
        nombre_patrocinador,
        contacto
    } = req.body;

    try {
        let query = `
            UPDATE Participante SET
                codigo = ?, nombre = ?, CI = ?, fecha_nacimiento = ?, direccion = ?,
                celular = ?, nombre_patrocinador = ?, contacto = ?
        `;
        const values = [
            codigo, nombre, CI, fecha_nacimiento, direccion,
            celular, nombre_patrocinador, contacto
        ];

        // Manejo de la foto: Si se sube una nueva foto, o si se indica que se debe eliminar la actual
        if (req.file) { // Si se envió un nuevo archivo de foto
            // Buscar la foto anterior para eliminarla
            const [rows] = await pool.query('SELECT foto FROM Participante WHERE id_participante = ?', [id]);
            const fotoAnterior = rows[0]?.foto;

            if (fotoAnterior) {
                const rutaAnterior = path.join('uploads', fotoAnterior);
                if (fs.existsSync(rutaAnterior)) {
                    fs.unlinkSync(rutaAnterior);
                    console.log(`Foto anterior ${fotoAnterior} eliminada.`);
                }
            }
            query += `, foto = ?`;
            values.push(req.file.filename); // Agrega el nombre de la nueva foto
        } else if (req.body.mantener_foto === 'false' || req.body.mantener_foto === false) { 
            // Esto es si el frontend envía una señal explícita para eliminar la foto actual sin subir una nueva
            // Por ejemplo, un checkbox "Eliminar foto"
            const [rows] = await pool.query('SELECT foto FROM Participante WHERE id_participante = ?', [id]);
            const fotoAnterior = rows[0]?.foto;
            if (fotoAnterior) {
                const rutaAnterior = path.join('uploads', fotoAnterior);
                if (fs.existsSync(rutaAnterior)) {
                    fs.unlinkSync(rutaAnterior);
                    console.log(`Foto anterior ${fotoAnterior} eliminada por solicitud.`);
                }
            }
            query += `, foto = NULL`; // Establece la foto a NULL en la DB
        }
        // Si no hay req.file y no hay indicación de eliminar, la foto existente se mantiene.

        query += ` WHERE id_participante = ?`;
        values.push(id); // Agrega el ID del participante al final de los valores

        const [result] = await pool.query(query, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Participante no encontrado o los datos son los mismos' });
        }

        res.json({ mensaje: 'Participante actualizado correctamente' });
    } catch (err) {
        console.error('Error al actualizar participante:', err);
        // Si hay un error después de subir un archivo (pero antes de la DB), intenta eliminar el nuevo archivo
        if (req.file && fs.existsSync(path.join('uploads', req.file.filename))) {
            fs.unlinkSync(path.join('uploads', req.file.filename));
            console.log(`Nuevo archivo ${req.file.filename} eliminado debido a un error en la base de datos.`);
        }
        res.status(500).json({ mensaje: 'Error al actualizar participante', error: err.message });
    }
};

// Función para eliminar un participante
export const deleteParticipante = async (req, res) => {
    const { id } = req.params;
    try {
        // Primero, obtén el nombre de la foto para eliminarla del sistema de archivos
        const [rows] = await pool.query('SELECT foto FROM Participante WHERE id_participante = ?', [id]);
        const fotoAEliminar = rows[0]?.foto;

        // Eliminar el registro de la base de datos
        const [result] = await pool.query('DELETE FROM Participante WHERE id_participante = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Participante no encontrado' });
        }

        // Si se eliminó de la DB y había una foto, elimínala del sistema de archivos
        if (fotoAEliminar) {
            const rutaFoto = path.join('uploads', fotoAEliminar);
            if (fs.existsSync(rutaFoto)) {
                fs.unlinkSync(rutaFoto);
                console.log(`Foto ${fotoAEliminar} eliminada del sistema de archivos.`);
            }
        }

        res.json({ mensaje: 'Participante eliminado correctamente' });
    } catch (err) {
        console.error('Error al eliminar participante:', err);
        res.status(500).json({ mensaje: 'Error al eliminar participante', error: err.message });
    }
};