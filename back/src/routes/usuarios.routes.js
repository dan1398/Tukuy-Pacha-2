import express from 'express'
import {
  getUsuarios,
  createUsuario,
  updateRol,
  updateContrasena,
  updateUsuario,
  deleteUsuario
} from '../controllers/usuarios.controller.js'
const router = express.Router()

router.get('/', getUsuarios)
router.post('/', createUsuario)
router.put('/:id/rol', updateRol)
router.put('/:id/contrasena', updateContrasena)
router.put('/:id', updateUsuario)
router.delete('/:id', deleteUsuario)


export default router