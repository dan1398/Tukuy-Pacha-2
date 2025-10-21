import pool from '../db.js';
import bcrypt from 'bcryptjs'; // <--- CORRECCIÓN CLAVE: Usar 'bcryptjs'
import nodemailer from 'nodemailer';

export const getUsuarios = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id_usuario, nombre, apellido_paterno, apellido_materno, correo, rol FROM Usuario');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ mensaje: 'Error al obtener usuarios', error: err.message });
    }
};

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

function generarContraseñaAleatoria(longitud = 12) {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
    let contraseña = '';
    for (let i = 0; i < longitud; i++) {
        contraseña += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return contraseña;
}

export const restablecerContrasena = async (req, res) => {
    const { id } = req.params;
    try {
        const [usuarioRows] = await pool.query('SELECT correo FROM Usuario WHERE id_usuario = ?', [id]);
        if (usuarioRows.length === 0) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
        }
        const userEmail = usuarioRows[0].correo;
        const contraseñaPlana = generarContraseñaAleatoria();
        
        // CORRECCIÓN: Usar el factor de rounds directamente
        const contraseñaHasheada = await bcrypt.hash(contraseñaPlana, 10); 
        
        await pool.query('UPDATE Usuario SET contraseña = ? WHERE id_usuario = ?', [contraseñaHasheada, id]);
        
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
        res.status(500).json({ mensaje: 'Error al restablecer contraseña', error: err.message });
    }
};

export const createUsuario = async (req, res) => {
    const { nombre, apellido_paterno, apellido_materno, correo, rol } = req.body;
    try {
        const contraseñaPlana = generarContraseñaAleatoria();
        
        // CORRECCIÓN: Usar el factor de rounds directamente
        const contraseñaHasheada = await bcrypt.hash(contraseñaPlana, 10); 
        
        const [result] = await pool.query(
            'INSERT INTO Usuario (nombre, apellido_paterno, apellido_materno, correo, contraseña, rol) VALUES (?, ?, ?, ?, ?, ?)',
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

export const getUsuarioById = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query('SELECT id_usuario, nombre, apellido_paterno, apellido_materno, correo, rol FROM Usuario WHERE id_usuario = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ mensaje: 'Error al obtener usuario', error: err.message });
    }
};

export const updateRol = async (req, res) => {
    const { id } = req.params;
    const { rol } = req.body;
    try {
        await pool.query('UPDATE Usuario SET rol = ? WHERE id_usuario = ?', [rol, id]);
        res.json({ mensaje: 'Rol actualizado' });
    } catch (err) {
        res.status(500).json({ mensaje: 'Error al actualizar rol', error: err.message });
    }
};

export const updateContrasena = async (req, res) => {
    const { id } = req.params;
    const { nuevaContrasena } = req.body;
    try {
        // Usa el factor de rounds directamente, como ya estaba:
        const hashedPassword = await bcrypt.hash(nuevaContrasena, 10); 
        await pool.query('UPDATE Usuario SET contraseña = ? WHERE id_usuario = ?', [hashedPassword, id]);
        res.json({ mensaje: 'Contraseña actualizada' });
    } catch (err) {
        res.status(500).json({ mensaje: 'Error al actualizar contraseña', error: err.message });
    }
};

export const updateUsuario = async (req, res) => {
    const { id } = req.params;
    const { nombre, apellido_paterno, apellido_materno, correo, contraseña, rol } = req.body;

    try {
        let query = 'UPDATE Usuario SET nombre = ?, apellido_paterno = ?, apellido_materno = ?, correo = ?, rol = ?';
        const values = [nombre, apellido_paterno, apellido_materno, correo, rol];

        if (contraseña) {
            // Usa el factor de rounds directamente, como ya estaba:
            const hashedPassword = await bcrypt.hash(contraseña, 10); 
            query += ', contraseña = ?';
            values.push(hashedPassword);
        }

        query += ' WHERE id_usuario = ?';
        values.push(id);

        await pool.query(query, values);
        res.json({ mensaje: 'Usuario actualizado correctamente' });
    } catch (err) {
        console.error('Error al actualizar usuario:', err);
        res.status(500).json({ mensaje: 'Error al actualizar usuario', error: err.message });
    }
};

export const deleteUsuario = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM documento WHERE id_usuario = ?', [id]);
        const [result] = await pool.query('DELETE FROM Usuario WHERE id_usuario = ?', [id]);

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