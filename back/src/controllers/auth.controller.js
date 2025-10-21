import pool from '../db.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export const login = async (req, res) => {
  const { correo, contraseña } = req.body

  try {
    const [rows] = await pool.query('SELECT * FROM Usuario WHERE correo = ?', [correo])
    if (rows.length === 0) return res.status(401).json({ mensaje: 'Usuario no encontrado' })

    const usuario = rows[0]
    const match = await bcrypt.compare(contraseña, usuario.contraseña)
    if (!match) return res.status(401).json({ mensaje: 'Contraseña incorrecta' })

    const token = jwt.sign({ id: usuario.id_usuario, rol: usuario.rol }, process.env.JWT_SECRET, { expiresIn: '8h' })
    res.json({ token, usuario: { id: usuario.id_usuario, nombre: usuario.nombre, rol: usuario.rol } })
  } catch (err) {
    res.status(500).json({ mensaje: 'Error en el servidor', error: err.message })
  }
}