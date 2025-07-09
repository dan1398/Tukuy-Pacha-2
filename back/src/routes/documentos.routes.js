import express from 'express'
import { getDocumentos, uploadDocumento, deleteDocumento, updateDocumento } from '../controllers/documentos.controller.js' // <--- IMPORTA updateDocumento
import upload from '../middleware/upload.js' // Multer configurado
import pool from '../db.js'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const router = express.Router()
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Ruta absoluta al directorio 'uploads'. Asegúrate de que esta coincida con la de multer en 'middleware/upload.js'
const uploadsDir = path.resolve(__dirname, '../uploads') 

// Ruta para obtener documentos (con o sin participanteId)
router.get('/', async (req, res) => {
  const { participanteId } = req.query
  try {
    if (participanteId) {
      const [rows] = await pool.query(
        `SELECT id_documento, nombre_archivo, ruta_archivo, fecha_subida, tipo_documento
         FROM Documento
         WHERE id_participante = ?
         ORDER BY fecha_subida DESC`,
        [participanteId]
      )
      return res.json(rows)
    }
    const [rows] = await pool.query(
      `SELECT id_documento, nombre_archivo, ruta_archivo, fecha_subida, tipo_documento
       FROM Documento
       ORDER BY fecha_subida DESC`
    )
    res.json(rows)
  } catch (err) {
    console.error('Error al obtener documentos:', err)
    res.status(500).json({ error: 'Error al obtener documentos' })
  }
})
  
router.post('/', upload.single('archivo'), uploadDocumento)

// --- AÑADE ESTA RUTA PUT ---
router.put('/:id', upload.single('archivo'), updateDocumento) // <-- Esta es la línea que faltaba

router.delete('/:id', deleteDocumento)

router.get('/download/:filename', (req, res) => {
  const { filename } = req.params
  const filePath = path.join(uploadsDir, filename)

  if (fs.existsSync(filePath)) {
    res.download(filePath)
  } else {
    res.status(404).send('Archivo no encontrado')
  }
})

export default router