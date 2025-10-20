import pool from '../db.js';

// Función para obtener todos los patrocinadores
export const getPatrocinadores = async (req, res) => {
    const { busqueda } = req.query;
    try {
        let query = 'SELECT * FROM patrocinador';
        const params = [];
        
        if (busqueda) {
            query += ' WHERE nombre LIKE ? OR apellido_paterno LIKE ? OR apellido_materno LIKE ?';
            params.push(`%${busqueda}%`, `%${busqueda}%`, `%${busqueda}%`);
        }
        
        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error('❌ Error al obtener patrocinadores:', err);
        res.status(500).json({ mensaje: 'Error al obtener patrocinadores', error: err.message });
    }
};

// Función para obtener un patrocinador por su ID
export const getPatrocinadorById = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query('SELECT * FROM patrocinador WHERE id_patrocinador = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ mensaje: 'Patrocinador no encontrado' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error('❌ Error al obtener patrocinador por ID:', err);
        res.status(500).json({ mensaje: 'Error al obtener patrocinador', error: err.message });
    }
};

// Función para crear un nuevo patrocinador (CORREGIDO)
export const createPatrocinador = async (req, res) => {
    let { nombre, apellido_paterno, apellido_materno, celular, correo } = req.body;
    
    
    // if (celular && typeof celular === 'object' && celular.international) {
    //     celular = celular.international;
    // }

    if (typeof celular === 'string' && !celular.startsWith('+') && celular.length > 0) {
        celular = '+' + celular;
    }
    
    try {
        const [result] = await pool.query(
            'INSERT INTO patrocinador (nombre, apellido_paterno, apellido_materno, celular, correo) VALUES (?, ?, ?, ?, ?)',
            [nombre, apellido_paterno, apellido_materno, celular, correo]
        );
        res.status(201).json({ mensaje: 'Patrocinador creado exitosamente', id: result.insertId });
    } catch (err) {
        console.error('❌ Error al crear patrocinador:', err);
        res.status(500).json({ mensaje: 'Error al crear patrocinador', error: err.message });
    }
};

// Función para actualizar un patrocinador existente 
export const updatePatrocinador = async (req, res) => {
    const { id } = req.params;
    let { nombre, apellido_paterno, apellido_materno, celular, correo } = req.body;

    // if (celular && typeof celular === 'object' && celular.international) {
    //     celular = celular.international;
    // }

    if (typeof celular === 'string' && !celular.startsWith('+') && celular.length > 0) {
        celular = '+' + celular;
    }

    try {
        const [result] = await pool.query(
            'UPDATE patrocinador SET nombre = ?, apellido_paterno = ?, apellido_materno = ?, celular = ?, correo = ? WHERE id_patrocinador = ?',
            [nombre, apellido_paterno, apellido_materno, celular, correo, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Patrocinador no encontrado para actualizar' });
        }
        res.json({ mensaje: 'Patrocinador actualizado exitosamente' });
    } catch (err) {
        console.error('❌ Error al actualizar patrocinador:', err);
        res.status(500).json({ mensaje: 'Error al actualizar patrocinador', error: err.message });
    }
};


// Función para eliminar un patrocinador
export const deletePatrocinador = async (req, res) => {
    const { id } = req.params;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();
        
        await connection.query('DELETE FROM patrocinador_participante WHERE id_patrocinador = ?', [id]);
        
        const [result] = await connection.query('DELETE FROM patrocinador WHERE id_patrocinador = ?', [id]);
        
        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ mensaje: 'Patrocinador no encontrado para eliminar' });
        }
        
        await connection.commit();
        res.json({ mensaje: 'Patrocinador y sus patrocinios eliminados exitosamente' });

    } catch (err) {
        await connection.rollback();
        console.error('❌ Error al eliminar patrocinador:', err);
        res.status(500).json({ mensaje: 'Error al eliminar patrocinador', error: err.message });
    } finally {
        connection.release();
    }
};

// Función para crear un nuevo patrocinio
export const createPatrocinio = async (req, res) => {
    const { id_patrocinador, id_participante } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO patrocinador_participante (id_patrocinador, id_participante) VALUES (?, ?)',
            [id_patrocinador, id_participante]
        );
        res.status(201).json({ mensaje: 'Patrocinio registrado exitosamente' });
    } catch (err) {
        console.error('❌ Error al registrar el patrocinio:', err);
        res.status(500).json({ mensaje: 'Error al registrar el patrocinio', error: err.message });
    }
};

// Función para obtener todos los participantes de un patrocinador
export const getParticipantesByPatrocinador = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query(
            `SELECT p.* FROM participante p
             JOIN patrocinador_participante pp ON p.id_participante = pp.id_participante
             WHERE pp.id_patrocinador = ?`,
            [id]
        );
        res.json(rows);
    } catch (err) {
        console.error('❌ Error al obtener participantes por patrocinador:', err);
        res.status(500).json({ mensaje: 'Error al obtener los participantes', error: err.message });
    }
};