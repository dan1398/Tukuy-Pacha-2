import pool from '../db.js'

export const getDocumentos = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Documento')
    res.json(rows)
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener documentos', error: err.message })
  }
}

export const uploadDocumento = async (req, res) => {
  console.log('→ Documento req.body:', req.body);
  console.log('→ Documento req.file:', req.file);

  const { tipo_documento, id_usuario, id_participante } = req.body;
  const archivo = req.file;

  if (!archivo) {
    return res.status(400).json({ mensaje: 'No se subió ningún archivo' });
  }

  try {
    // Guardamos solo filename, no path completo
    const filename = archivo.filename;

    const [result] = await pool.query(
      `INSERT INTO Documento 
        (nombre_archivo, tipo_documento, fecha_subida, ruta_archivo, id_usuario, id_participante)
       VALUES (?, ?, NOW(), ?, ?, ?)`,
      [
        archivo.originalname,
        tipo_documento,
        filename,        
        id_usuario,
        id_participante
      ]
    );

    res.status(201).json({ mensaje: 'Archivo subido exitosamente', id: result.insertId });
  } catch (err) {
    console.error('❌ Error al guardar documento:', err);
    res.status(500).json({ mensaje: 'Error al guardar documento', error: err.message });
  }
}



export const deleteDocumento = async (req, res) => {
  const { id } = req.params
  try {
    await pool.query('DELETE FROM Documento WHERE id_documento = ?', [id])
    res.json({ mensaje: 'Documento eliminado' })
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al eliminar documento', error: err.message })
  }
}
