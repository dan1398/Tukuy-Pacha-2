import pool from '../db.js'
import bcrypt from 'bcrypt'
import nodemailer from 'nodemailer';

export const getUsuarios = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id_usuario, nombre, correo, rol FROM Usuario')
    res.json(rows)
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener usuarios', error: err.message })
  }
}

// Configuración para el envío de correos (cambia esto con tus datos)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Tu correo electrónico
        pass: process.env.EMAIL_PASS // Tu contraseña de correo electrónico o contraseña de aplicación
    }
});

// Función auxiliar para generar una contraseña aleatoria
function generarContraseñaAleatoria(longitud = 12) {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
    let contraseña = '';
    for (let i = 0; i < longitud; i++) {
        contraseña += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return contraseña;
}
// *** NUEVA FUNCIÓN: RESTABLECER CONTRASEÑA ***
export const restablecerContrasena = async (req, res) => {
    const { id } = req.params;

    try {
        // 1. Encontrar al usuario por su ID para obtener su correo
        const [usuarioRows] = await pool.query('SELECT correo FROM Usuario WHERE id_usuario = ?', [id]);
        if (usuarioRows.length === 0) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
        }
        const userEmail = usuarioRows[0].correo;

        // 2. Generar una nueva contraseña aleatoria
        const contraseñaPlana = generarContraseñaAleatoria();

        // 3. Hashear la nueva contraseña
        const sal = await bcrypt.genSalt(10);
        const contraseñaHasheada = await bcrypt.hash(contraseñaPlana, sal);

        // 4. Actualizar la contraseña del usuario en la base de datos
        await pool.query('UPDATE Usuario SET contraseña = ? WHERE id_usuario = ?', [contraseñaHasheada, id]);

        // 5. Enviar la nueva contraseña por correo
        const mailOptions = {
            from: 'd1303gm@gmail.com',
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
    const { nombre, correo, rol } = req.body;
    
    try {
        // 1. Generar la contraseña aleatoria
        const contraseñaPlana = generarContraseñaAleatoria();

        // 2. Hashear la contraseña antes de guardarla
        const sal = await bcrypt.genSalt(10);
        const contraseñaHasheada = await bcrypt.hash(contraseñaPlana, sal);

        // 3. Guardar el usuario en la base de datos con la contraseña hasheada
        const [result] = await pool.query(
            'INSERT INTO Usuario (nombre, correo, contraseña, rol) VALUES (?, ?, ?, ?)',
            [nombre, correo, contraseñaHasheada, rol]
        );

        // 4. Enviar la contraseña al correo electrónico del usuario
        const mailOptions = {
            from: 'd1303gm@gmail.com', // El remitente
            to: correo, // El destinatario
            subject: 'Credenciales de tu nueva cuenta',
            html: `<p>Hola ${nombre},</p>
                   <p>Se ha creado una nueva cuenta para ti. Aquí están tus credenciales para acceder:</p>
                   <ul>
                       <li><strong>Correo:</strong> ${correo}</li>
                       <li><strong>Contraseña temporal:</strong> ${contraseñaPlana}</li>
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
        const [rows] = await pool.query('SELECT id_usuario, nombre, correo, rol FROM Usuario WHERE id_usuario = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ mensaje: 'Error al obtener usuario', error: err.message });
    }
};

export const updateRol = async (req, res) => {
  const { id } = req.params
  const { rol } = req.body
  try {
    await pool.query('UPDATE Usuario SET rol = ? WHERE id_usuario = ?', [rol, id])
    res.json({ mensaje: 'Rol actualizado' })
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al actualizar rol', error: err.message })
  }
}

export const updateContrasena = async (req, res) => {
  const { id } = req.params
  const { nuevaContrasena } = req.body
  try {
    const hashedPassword = await bcrypt.hash(nuevaContrasena, 10)
    await pool.query('UPDATE Usuario SET contraseña = ? WHERE id_usuario = ?', [hashedPassword, id])
    res.json({ mensaje: 'Contraseña actualizada' })
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al actualizar contraseña', error: err.message })
  }
}

export const updateUsuario = async (req, res) => {
  const { id } = req.params
  const { nombre, correo, contraseña, rol } = req.body

  try {
    let query = 'UPDATE Usuario SET nombre = ?, correo = ?, rol = ?'
    const values = [nombre, correo, rol]

    // Si la contraseña es proporcionada, encriptarla
    if (contraseña) {
      const hashedPassword = await bcrypt.hash(contraseña, 10)
      query += ', contraseña = ?'
      values.push(hashedPassword)
    }

    query += ' WHERE id_usuario = ?'
    values.push(id)

    await pool.query(query, values)
    res.json({ mensaje: 'Usuario actualizado correctamente' })
  } catch (err) {
    console.error('Error al actualizar usuario:', err)
    res.status(500).json({ mensaje: 'Error al actualizar usuario', error: err.message })
  }
}

export const deleteUsuario = async (req, res) => {
  const { id } = req.params;
  try {
    // Paso 1: Encontrar los IDs de los participantes asociados a este usuario
    const [participantesRows] = await pool.query(
      'SELECT DISTINCT id_participante FROM documento WHERE id_usuario = ?',
      [id]
    );

    // Paso 2: Eliminar los documentos asociados a este usuario
    await pool.query('DELETE FROM documento WHERE id_usuario = ?', [id]);

    // Paso 3: Eliminar los participantes encontrados en el paso 1
    if (participantesRows.length > 0) {
      const participantesIds = participantesRows.map(row => row.id_participante);
      await pool.query(
        'DELETE FROM participante WHERE id_participante IN (?)',
        [participantesIds]
      );
    }

    // Paso 4: Eliminar el usuario
    const [result] = await pool.query('DELETE FROM Usuario WHERE id_usuario = ?', [id]);

    if (result.affectedRows === 0) {
      res.status(404).json({ mensaje: 'Usuario no encontrado' });
    } else {
      res.json({
        mensaje: 'Usuario, documentos y participantes asociados eliminados correctamente',
      });
    }
  } catch (err) {
    console.error('Error al eliminar usuario:', err);
    res.status(500).json({ mensaje: 'Error al eliminar usuario', error: err.message });
  }
};

