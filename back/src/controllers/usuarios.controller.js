import pool from '../db.js'
import bcrypt from 'bcrypt'

export const getUsuarios = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id_usuario, nombre, correo, rol FROM Usuario')
    res.json(rows)
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener usuarios', error: err.message })
  }
}

export const createUsuario = async (req, res) => {
  const { nombre, correo, contraseña, rol } = req.body
  try {
    const hashedPassword = await bcrypt.hash(contraseña, 10)
    const [result] = await pool.query('INSERT INTO Usuario (nombre, correo, contraseña, rol) VALUES (?, ?, ?, ?)', [nombre, correo, hashedPassword, rol])
    res.status(201).json({ id: result.insertId, nombre, correo, rol })
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al crear usuario', error: err.message })
  }
}

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
  const { id } = req.params
  try {
    await pool.query('DELETE FROM Usuario WHERE id_usuario = ?', [id])
    res.json({ mensaje: 'Usuario eliminado' })
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al eliminar usuario', error: err.message })
  }
}
