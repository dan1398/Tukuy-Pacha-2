import express from 'express'
import { getParticipantes, createParticipante, updateParticipante, deleteParticipante } from '../controllers/participantes.controller.js'
import upload from '../middleware/upload.js'
import pool from '../db.js'

const router = express.Router()

router.get('/', async (req, res) => {
    const { codigo } = req.query
  
    if (codigo) {
      // Buscar por código
      const [rows] = await pool.query('SELECT * FROM Participante WHERE codigo = ?', [codigo])
      return res.json(rows)
    }
  
    // Si no se pasa código, devuelve todos los participantes
    const [rows] = await pool.query('SELECT * FROM Participante')
    res.json(rows)
  })
router.post('/', upload.single('foto'), createParticipante)
router.put('/:id', updateParticipante)
router.delete('/:id', deleteParticipante)



export default router