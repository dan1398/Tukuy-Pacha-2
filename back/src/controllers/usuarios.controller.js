import pool from '../db.js';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

/**
 * Obtiene todos los usuarios, excluyendo la contraseña.
 */
export const getUsuarios = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id_usuario, nombre, apellido_paterno, apellido_materno, correo, rol FROM usuario');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ mensaje: 'Error al obtener usuarios', error: err.message });
    }
};

// =======================================================
// CAMBIO CLAVE: Configuración de Nodemailer explícita
// Usamos el host y el puerto 587 con STARTTLS para evitar timeouts.
// =======================================================
const transporter = nodemailer.createTransport({
    host: 'smtp.mailgun.org', // Servidor SMTP de Gmail
    port: 587,              // Puerto estándar para TLS/STARTTLS
    secure: false,          // 'false' para STARTTLS (puerto 587)
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    // Añadir timeout de conexión para depuración (opcional, pero útil)
    connectionTimeout: 15000, // 5 segundos
    greetingTimeout: 15000,   // 5 segundos
});

/**
 * Genera una contraseña aleatoria y segura.
 * @param {number} longitud - Longitud de la contraseña.
 * @returns {string} Contraseña generada.
 */
function generarContraseñaAleatoria(longitud = 12) {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
    let contraseña = '';
    for (let i = 0; i < longitud; i++) {
        contraseña += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return contraseña;
}

/**
 * Restablece la contraseña de un usuario a una generada aleatoriamente y la envía por correo.
 */
export const restablecerContrasena = async (req, res) => {
    const { id } = req.params;
    try {
        // Consultar correo del usuario (TABLA: usuario)
        const [usuarioRows] = await pool.query('SELECT correo FROM usuario WHERE id_usuario = ?', [id]);
        if (usuarioRows.length === 0) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
        }
        const userEmail = usuarioRows[0].correo;
        const contraseñaPlana = generarContraseñaAleatoria();
        
        // CORRECCIÓN: Usar el factor de rounds directamente
        const contraseñaHasheada = await bcrypt.hash(contraseñaPlana, 10); 
        
        // Actualizar la contraseña en la base de datos (TABLA: usuario)
        await pool.query('UPDATE usuario SET contraseña = ? WHERE id_usuario = ?', [contraseñaHasheada, id]);
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: 'Restablecimiento de contraseña',
            html: `<p>Hola,</p>
                    <p>Tu contraseña ha sido restablecida por un administrador. Tu nueva contraseña es:</p>
                    <h3 style="color: #f05a30;">${contraseñaPlana}</h3>
                    <p>Saludos,</p>
                    <p>Equipo de Administración</p>`
        };
        await transporter.sendMail(mailOptions);
        res.status(200).json({ mensaje: 'Contraseña restablecida y enviada por correo.' });
    } catch (err) {
        console.error('Error al restablecer contraseña:', err);
        // Si hay un error, el servidor debe responder con 500 para informar al frontend
        res.status(500).json({ mensaje: 'Error al restablecer contraseña', error: err.message });
    }
};

/**
 * Crea un nuevo usuario con una contraseña generada aleatoriamente y envía las credenciales por correo.
 */
export const createUsuario = async (req, res) => {
    const { nombre, apellido_paterno, apellido_materno, correo, rol } = req.body;
    try {
        const contraseñaPlana = generarContraseñaAleatoria();
        
        // CORRECCIÓN: Usar el factor de rounds directamente
        const contraseñaHasheada = await bcrypt.hash(contraseñaPlana, 10); 
        
        // Inserción en la base de datos (TABLA: usuario)
        const [result] = await pool.query(
            'INSERT INTO usuario (nombre, apellido_paterno, apellido_materno, correo, contraseña, rol) VALUES (?, ?, ?, ?, ?, ?)',
            [nombre, apellido_paterno, apellido_materno, correo, contraseñaHasheada, rol]
        );
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: correo,
            subject: 'Credenciales de tu nueva cuenta',
            html: `<p>Hola ${nombre},</p>
                    <p>Se ha creado una nueva cuenta para ti. Aquí están tus credenciales para acceder:</p>
                    <ul>
                        <li><strong>Correo:</strong> ${correo}</li>
                        <li><strong>Contraseña:</strong> ${contraseñaPlana}</li>
                    </ul>`
        };
        await transporter.sendMail(mailOptions);
        res.status(201).json({
            mensaje: 'Usuario creado y credenciales enviadas por correo.',
            id: result.insertId
        });
    } catch (err) {
        console.error('Error al crear usuario:', err);
        res.status(500).json({ mensaje: 'Error al crear usuario', error: err.message });
    }
};

/**
 * Obtiene un usuario específico por ID, excluyendo la contraseña.
 */
export const getUsuarioById = async (req, res) => {
    const { id } = req.params;
    try {
        // Consulta a la base de datos (TABLA: usuario)
        const [rows] = await pool.query('SELECT id_usuario, nombre, apellido_paterno, apellido_materno, correo, rol FROM usuario WHERE id_usuario = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ mensaje: 'Error al obtener usuario', error: err.message });
    }
};

/**
 * Actualiza el rol de un usuario.
 */
export const updateRol = async (req, res) => {
    const { id } = req.params;
    const { rol } = req.body;
    try {
        // Actualización en la base de datos (TABLA: usuario)
        await pool.query('UPDATE usuario SET rol = ? WHERE id_usuario = ?', [rol, id]);
        res.json({ mensaje: 'Rol actualizado' });
    } catch (err) {
        res.status(500).json({ mensaje: 'Error al actualizar rol', error: err.message });
    }
};

/**
 * Actualiza la contraseña de un usuario (debe ser hasheada).
 */
export const updateContrasena = async (req, res) => {
    const { id } = req.params;
    const { nuevaContrasena } = req.body;
    try {
        // Hashear la nueva contraseña
        const hashedPassword = await bcrypt.hash(nuevaContrasena, 10); 
        // Actualización en la base de datos (TABLA: usuario)
        await pool.query('UPDATE usuario SET contraseña = ? WHERE id_usuario = ?', [hashedPassword, id]);
        res.json({ mensaje: 'Contraseña actualizada' });
    } catch (err) {
        res.status(500).json({ mensaje: 'Error al actualizar contraseña', error: err.message });
    }
};

/**
 * Actualiza la información general de un usuario, incluyendo opcionalmente la contraseña.
 */
export const updateUsuario = async (req, res) => {
    const { id } = req.params;
    const { nombre, apellido_paterno, apellido_materno, correo, contraseña, rol } = req.body;

    try {
        let query = 'UPDATE usuario SET nombre = ?, apellido_paterno = ?, apellido_materno = ?, correo = ?, rol = ?';
        const values = [nombre, apellido_paterno, apellido_materno, correo, rol];

        if (contraseña) {
            // Hashear la nueva contraseña si se proporciona
            const hashedPassword = await bcrypt.hash(contraseña, 10); 
            query += ', contraseña = ?';
            values.push(hashedPassword);
        }

        query += ' WHERE id_usuario = ?';
        values.push(id);

        // Ejecutar la actualización (TABLA: usuario)
        await pool.query(query, values);
        res.json({ mensaje: 'Usuario actualizado correctamente' });
    } catch (err) {
        console.error('Error al actualizar usuario:', err);
        res.status(500).json({ mensaje: 'Error al actualizar usuario', error: err.message });
    }
};

/**
 * Elimina un usuario y elimina sus documentos asociados.
 */
export const deleteUsuario = async (req, res) => {
    const { id } = req.params;
    try {
        // Primero, eliminar los documentos asociados para evitar errores de clave foránea
        await pool.query('DELETE FROM documento WHERE id_usuario = ?', [id]);
        
        // Luego, eliminar el usuario (TABLA: usuario)
        const [result] = await pool.query('DELETE FROM usuario WHERE id_usuario = ?', [id]);

        if (result.affectedRows === 0) {
            res.status(404).json({ mensaje: 'Usuario no encontrado' });
        } else {
            res.json({
                mensaje: 'Usuario y sus documentos asociados eliminados correctamente',
            });
        }
    } catch (err) {
        console.error('Error al eliminar usuario:', err);
        res.status(500).json({ mensaje: 'Error al eliminar usuario', error: err.message });
    }
};
