// src/controllers/participantes.controller.js

import pool from '../db.js';
import fs from 'fs';
import path from 'path';

// Función para obtener todos los participantes
export const getParticipantes = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Participante');
        res.json(rows);
    } catch (err) {
        console.error('Error al obtener participantes (getParticipantes):', err);
        res.status(500).json({ mensaje: 'Error al obtener participantes', error: err.message });
    }
};

// **NUEVA FUNCIÓN: Búsqueda tipo Google**
export const buscarParticipantes = async (req, res) => {
    const { termino } = req.query;

    if (!termino) {
        return getParticipantes(req, res);
    }

    const terminoBusqueda = `%${termino}%`;

    try {
        const [rows] = await pool.query(
            `SELECT * FROM Participante 
             WHERE nombre LIKE ?
             OR codigo LIKE ?
             OR CI LIKE ? 
             OR direccion LIKE ? 
             OR celular LIKE ?
             OR nombre_patrocinador LIKE ?
             OR contacto LIKE ?
             OR DATE_FORMAT(fecha_nacimiento, '%d/%m/%Y') LIKE ?`, 
            [
                terminoBusqueda, 
                terminoBusqueda, 
                terminoBusqueda, 
                terminoBusqueda, 
                terminoBusqueda, 
                terminoBusqueda, 
                terminoBusqueda,
                terminoBusqueda 
            ]
        );
        res.json(rows);
    } catch (err) {
        console.error('Error en la búsqueda de participantes:', err);
        res.status(500).json({ mensaje: 'Error al realizar la búsqueda', error: err.message });
    }
};
// Función para obtener un participante por su ID único
export const getParticipanteById = async (req, res) => {
    const { id } = req.params;

    try {
        const [rows] = await pool.query('SELECT * FROM Participante WHERE id_participante = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ mensaje: 'Participante no encontrado' });
        }

        res.json(rows[0]);
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

    const archivo = req.file;

    try {
        const nombreFoto = archivo ? archivo.filename : null;

        const [result] = await pool.query(
            `INSERT INTO Participante 
             (codigo, nombre, CI, fecha_nacimiento, direccion, celular, nombre_patrocinador, contacto, foto)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [codigo, nombre, CI, fecha_nacimiento, direccion, celular, nombre_patrocinador, contacto, nombreFoto]
        );

        res.status(201).json({ mensaje: 'Participante registrado', id: result.insertId });
    } catch (err) {
        console.error('Error al registrar participante:', err);
        if (archivo && fs.existsSync(path.join('uploads', archivo.filename))) {
            fs.unlinkSync(path.join('uploads', archivo.filename));
            console.log(`Archivo ${archivo.filename} eliminado debido a un error en la base de datos.`);
        }
        res.status(500).json({ mensaje: 'Error en el servidor al registrar participante', error: err.message });
    }
};

// Función para actualizar un participante existente
export const updateParticipante = async (req, res) => {
    const { id } = req.params;
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

        if (req.file) {
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
            values.push(req.file.filename);
        } else if (req.body.mantener_foto === 'false' || req.body.mantener_foto === false) { 
            const [rows] = await pool.query('SELECT foto FROM Participante WHERE id_participante = ?', [id]);
            const fotoAnterior = rows[0]?.foto;
            if (fotoAnterior) {
                const rutaAnterior = path.join('uploads', fotoAnterior);
                if (fs.existsSync(rutaAnterior)) {
                    fs.unlinkSync(rutaAnterior);
                    console.log(`Foto anterior ${fotoAnterior} eliminada por solicitud.`);
                }
            }
            query += `, foto = NULL`;
        }

        query += ` WHERE id_participante = ?`;
        values.push(id);

        const [result] = await pool.query(query, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Participante no encontrado o los datos son los mismos' });
        }

        res.json({ mensaje: 'Participante actualizado correctamente' });
    } catch (err) {
        console.error('Error al actualizar participante:', err);
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
        const [rows] = await pool.query('SELECT foto FROM Participante WHERE id_participante = ?', [id]);
        const fotoAEliminar = rows[0]?.foto;

        const [result] = await pool.query('DELETE FROM Participante WHERE id_participante = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Participante no encontrado' });
        }

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