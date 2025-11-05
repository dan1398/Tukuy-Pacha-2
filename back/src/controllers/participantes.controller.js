import pool from '../db.js';
import fs from 'fs';
import path from 'path';

// Función para obtener todos los participantes
export const getParticipantes = async (req, res) => {
    try {
        // CORREGIDO: De 'Participante' a 'participante'
        const [rows] = await pool.query('SELECT * FROM participante');
        res.json(rows);
    } catch (err) {
        console.error('❌ Error al obtener participantes (getParticipantes):', err);
        res.status(500).json({ mensaje: 'Error al obtener participantes', error: err.message });
    }
};

// Búsqueda de participantes
export const buscarParticipantes = async (req, res) => {
    const { termino } = req.query;

    if (!termino || termino.trim().length < 3) {
        return res.json([]);
    }

    const terminoBusqueda = `%${termino}%`;
    const terminoFechaBusqueda = `%${termino}%`;
    try {
        // CORRECCIÓN CLAVE: El string SQL ha sido limpiado para eliminar los caracteres
        // de espacio no estándar que causaban el error de sintaxis (ER_PARSE_ERROR).
        const sql = `
            SELECT 
                p.id_participante,
                p.codigo,
                p.nombre,
                p.apellido_paterno,
                p.apellido_materno,
                p.CI,
                p.fecha_nacimiento,
                p.direccion,
                p.celular,
                p.foto,
                pat.id_patrocinador,
                pat.nombre AS patrocinador_nombre,
                pat.apellido_paterno AS patrocinador_apellido_paterno,
                pat.apellido_materno AS patrocinador_apellido_materno,
                pat.celular AS patrocinador_celular,
                pat.correo AS patrocinador_correo
            FROM 
                participante p 
            LEFT JOIN 
                patrocinador_participante pp ON p.id_participante = pp.id_participante
            LEFT JOIN 
                patrocinador pat ON pp.id_patrocinador = pat.id_patrocinador
            WHERE 
                p.codigo LIKE ?
                OR p.nombre LIKE ?
                OR p.apellido_paterno LIKE ?
                OR p.apellido_materno LIKE ?
                OR p.CI LIKE ?
                OR p.fecha_nacimiento LIKE ?
                OR p.direccion LIKE ?
                OR p.celular LIKE ?
                OR pat.nombre LIKE ?;
        `;

        const [rows] = await pool.query(sql, [
            terminoBusqueda, // p.codigo
            terminoBusqueda, // p.nombre
            terminoBusqueda, // p.apellido_paterno
            terminoBusqueda, // p.apellido_materno
            terminoBusqueda, // p.CI
            terminoFechaBusqueda,
            terminoBusqueda, // p.direccion
            terminoBusqueda, // p.celular
            terminoBusqueda, // pat.nombre
        ]);

        res.json(rows);
    } catch (err) {
        console.error('❌ Error en la búsqueda de participantes:', err);
        res.status(500).json({ mensaje: 'Error al realizar la búsqueda', error: err.message });
    }
};

// Obtener participante por ID y su patrocinador
export const getParticipanteById = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query(`
            SELECT 
                p.*, 
                pat.id_patrocinador,
                pat.nombre AS patrocinador_nombre,
                pat.apellido_paterno AS patrocinador_apellido_paterno,
                pat.apellido_materno AS patrocinador_apellido_materno,
                pat.celular AS patrocinador_celular
            FROM 
                participante p 
            LEFT JOIN 
                patrocinador_participante pp ON p.id_participante = pp.id_participante
            LEFT JOIN 
                patrocinador pat ON pp.id_patrocinador = pat.id_patrocinador
            WHERE 
                p.id_participante = ?`, 
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ mensaje: 'Participante no encontrado' });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error('❌ Error al obtener participante por ID:', err);
        res.status(500).json({ mensaje: 'Error al obtener participante por ID', error: err.message });
    }
};


// Crear nuevo participante y su relación de patrocinio
export const createParticipante = async (req, res) => {
    const {
        id_patrocinador,
        codigo,
        nombre,
        apellido_paterno,
        apellido_materno,
        CI,
        fecha_nacimiento,
        direccion,
        celular
    } = req.body;

    const archivo = req.file;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // VALIDACIÓN: Verificar si el código ya existe
        // CORREGIDO: De 'Participante' a 'participante'
        const [codigoExistente] = await connection.query('SELECT codigo FROM participante WHERE codigo = ?', [codigo]);
        if (codigoExistente.length > 0) {
            if (archivo && fs.existsSync(path.join('uploads', archivo.filename))) {
                fs.unlinkSync(path.join('uploads', archivo.filename));
            }
            await connection.rollback();
            return res.status(409).json({ mensaje: 'Error al registrar participante', error: 'El código del participante ya existe.' });
        }

        const departamentos = ['La Paz', 'Cochabamba', 'Santa Cruz', 'Oruro', 'Potosí', 'Tarija', 'Chuquisaca', 'Beni', 'Pando'];
        const direccionValida = departamentos.some(depto => direccion.includes(depto));
        
        if (!direccionValida) {
            throw new Error(`La dirección debe incluir un departamento válido de Bolivia: ${departamentos.join(', ')}`);
        }

        if (!codigo || !nombre || !CI || !direccion || !celular) {
            throw new Error('Todos los campos obligatorios deben estar completos');
        }

        const nombreFoto = archivo ? archivo.filename : null;
        
        const datosParticipante = {
            codigo,
            nombre,
            apellido_paterno,
            apellido_materno,
            CI,
            fecha_nacimiento,
            direccion,
            celular,
            foto: nombreFoto
        };

        // CORREGIDO: De 'Participante' a 'participante'
        const [result] = await connection.query('INSERT INTO participante SET ?', [datosParticipante]);
        const id_participante = result.insertId;

        if (id_patrocinador) {
            await connection.query(
                'INSERT INTO patrocinador_participante (id_patrocinador, id_participante) VALUES (?, ?)',
                [id_patrocinador, id_participante]
            );
        }

        await connection.commit();
        res.status(201).json({ 
            mensaje: 'Participante y relación creados',
            id: id_participante,
            codigo: codigo
        });

    } catch (err) {
        await connection.rollback();
        console.error('❌ Error al registrar participante:', err);
        
        if (archivo && fs.existsSync(path.join('uploads', archivo.filename))) {
            fs.unlinkSync(path.join('uploads', archivo.filename));
        }
        
        res.status(400).json({ 
            mensaje: 'Error al registrar participante',
            error: err.message
        });

    } finally {
        connection.release();
    }
};

// Actualizar participante y su relación de patrocinio
export const updateParticipante = async (req, res) => {
    const { id } = req.params;
    const {
        codigo,
        nombre,
        apellido_paterno,
        apellido_materno,
        CI,
        fecha_nacimiento,
        direccion,
        celular,
        id_patrocinador
    } = req.body;

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // VALIDACIÓN: Verificar si el código ya existe en otro participante
        // CORREGIDO: De 'Participante' a 'participante'
        const [codigoExistente] = await connection.query('SELECT id_participante FROM participante WHERE codigo = ? AND id_participante <> ?', [codigo, id]);
        if (codigoExistente.length > 0) {
            await connection.rollback();
            return res.status(409).json({ mensaje: 'Error al actualizar participante', error: 'El código del participante ya existe.' });
        }

        // Validar la dirección
        const departamentos = ['La Paz', 'Cochabamba', 'Santa Cruz', 'Oruro', 'Potosí', 'Tarija', 'Chuquisaca', 'Beni', 'Pando'];
        const direccionValida = departamentos.some(depto => direccion.includes(depto));
        
        if (!direccionValida) {
            throw new Error(`La dirección debe incluir un departamento válido de Bolivia: ${departamentos.join(', ')}`);
        }

        // Construir y ejecutar la consulta de actualización del participante
        let query = `
            UPDATE participante SET 
                codigo = ?, 
                nombre = ?, 
                apellido_paterno = ?, 
                apellido_materno = ?, 
                CI = ?, 
                fecha_nacimiento = ?, 
                direccion = ?,
                celular = ?
        `;
        const values = [
            codigo, 
            nombre, 
            apellido_paterno || null, 
            apellido_materno || null, 
            CI, 
            fecha_nacimiento, 
            direccion, 
            celular
        ];

        if (req.file) {
            // CORREGIDO: De 'Participante' a 'participante'
            const [rows] = await connection.query('SELECT foto FROM participante WHERE id_participante = ?', [id]);
            const fotoAnterior = rows[0]?.foto;
            if (fotoAnterior) {
                const rutaAnterior = path.join('uploads', fotoAnterior);
                if (fs.existsSync(rutaAnterior)) fs.unlinkSync(rutaAnterior);
            }
            query += `, foto = ?`;
            values.push(req.file.filename);
        } else if (req.body.mantener_foto === 'false' || req.body.mantener_foto === false) {
            // CORREGIDO: De 'Participante' a 'participante'
            const [rows] = await connection.query('SELECT foto FROM participante WHERE id_participante = ?', [id]);
            const fotoAnterior = rows[0]?.foto;
            if (fotoAnterior) {
                const rutaAnterior = path.join('uploads', fotoAnterior);
                if (fs.existsSync(rutaAnterior)) fs.unlinkSync(rutaAnterior);
            }
            query += `, foto = NULL`;
        }

        query += ` WHERE id_participante = ?`;
        values.push(id);

        const [result] = await connection.query(query, values);
        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ mensaje: 'Participante no encontrado' });
        }

        // Manejar la relación patrocinador_participante (el nombre de esta tabla ya estaba correcto)
        const [patrocinioExistente] = await connection.query(
            'SELECT id_patrocinador FROM patrocinador_participante WHERE id_participante = ?', 
            [id]
        );

        if (id_patrocinador) {
            if (patrocinioExistente.length > 0) {
                await connection.query(
                    'UPDATE patrocinador_participante SET id_patrocinador = ? WHERE id_participante = ?',
                    [id_patrocinador, id]
                );
            } else {
                await connection.query(
                    'INSERT INTO patrocinador_participante (id_patrocinador, id_participante) VALUES (?, ?)',
                    [id_patrocinador, id]
                );
            }
        } else {
            if (patrocinioExistente.length > 0) {
                await connection.query(
                    'DELETE FROM patrocinador_participante WHERE id_participante = ?',
                    [id]
                );
            }
        }

        await connection.commit();
        res.json({ mensaje: 'Participante y patrocinador actualizados correctamente' });
    } catch (err) {
        await connection.rollback();
        console.error('❌ Error al actualizar participante:', err);
        if (req.file && fs.existsSync(path.join('uploads', req.file.filename))) {
            fs.unlinkSync(path.join('uploads', req.file.filename));
        }
        res.status(500).json({ mensaje: 'Error al actualizar participante', error: err.message });
    } finally {
        connection.release();
    }
};

// Eliminar participante
export const deleteParticipante = async (req, res) => {
    const { id } = req.params;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        await connection.query('DELETE FROM patrocinador_participante WHERE id_participante = ?', [id]);

        // CORREGIDO: De 'Participante' a 'participante'
        const [rows] = await connection.query('SELECT foto FROM participante WHERE id_participante = ?', [id]);
        const fotoAEliminar = rows[0]?.foto;

        // CORREGIDO: De 'Participante' a 'participante'
        const [result] = await connection.query('DELETE FROM participante WHERE id_participante = ?', [id]);
        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ mensaje: 'Participante no encontrado para eliminar' });
        }

        if (fotoAEliminar) {
            const rutaFoto = path.join('uploads', fotoAEliminar);
            if (fs.existsSync(rutaFoto)) {
                fs.unlinkSync(rutaFoto);
            }
        }

        await connection.commit();
        res.json({ mensaje: 'Participante y su patrocinio eliminados correctamente' });
    } catch (err) {
        await connection.rollback();
        console.error('❌ Error al eliminar participante:', err);
        res.status(500).json({ mensaje: 'Error al eliminar participante', error: err.message });
    } finally {
        connection.release();
    }
};
