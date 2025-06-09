import pool from '../db.js'
import fs from 'fs'
import path from 'path'

export const getParticipantes = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Participante')
    res.json(rows)
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener participantes', error: err.message })
  }
}

export const createParticipante = async (req, res) => {
  console.log('req.body =', req.body)
  console.log('req.file =', req.file)
  const {
    codigo,
    nombre,
    CI,
    fecha_nacimiento,
    direccion,
    celular,
    nombre_patrocinador,
    contacto
  } = req.body
 
  const archivo = req.file

  try {
    const nombreFoto = archivo ? archivo.filename : null

    const [result] = await pool.query(
      `INSERT INTO Participante 
        (codigo, nombre, CI, fecha_nacimiento, direccion, celular, nombre_patrocinador, contacto, foto)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [codigo, nombre, CI, fecha_nacimiento, direccion, celular, nombre_patrocinador, contacto, nombreFoto]
    )

    res.status(201).json({ mensaje: 'Participante registrado', id: result.insertId })
  } catch (err) {
    console.error('Error al registrar participante:', err)
    res.status(500).json({ mensaje: 'Error en el servidor', error: err.message })
  }
}


export const updateParticipante = async (req, res) => {
  const { id } = req.params
  const {
    codigo,
    nombre,
    CI,
    fecha_nacimiento,
    direccion,
    celular,
    nombre_patrocinador,
    contacto
  } = req.body

  try {
    let query = `
      UPDATE Participante SET
        codigo = ?, nombre = ?, CI = ?, fecha_nacimiento = ?, direccion = ?,
        celular = ?, nombre_patrocinador = ?, contacto = ?
    `
    const values = [
      codigo, nombre, CI, fecha_nacimiento, direccion,
      celular, nombre_patrocinador, contacto
    ]

    // Si se sube una nueva foto
    if (req.file) {
      // Buscar la foto anterior
      const [rows] = await pool.query('SELECT foto FROM Participante WHERE id_participante = ?', [id])
      const fotoAnterior = rows[0]?.foto

      // Eliminarla del sistema si existe
      if (fotoAnterior) {
        const rutaAnterior = path.join('uploads', fotoAnterior)
        if (fs.existsSync(rutaAnterior)) {
          fs.unlinkSync(rutaAnterior)
        }
      }

      query += `, foto = ?`
      values.push(req.file.filename)
    }

    query += ` WHERE id_participante = ?`
    values.push(id)

    await pool.query(query, values)

    res.json({ mensaje: 'Participante actualizado correctamente' })
  } catch (err) {
    console.error('Error al actualizar participante:', err)
    res.status(500).json({ mensaje: 'Error al actualizar participante', error: err.message })
  }
}

export const deleteParticipante = async (req, res) => {
  const { id } = req.params
  try {
    await pool.query('DELETE FROM Participante WHERE id_participante = ?', [id])
    res.json({ mensaje: 'Participante eliminado' })
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al eliminar participante', error: err.message })
  }
}