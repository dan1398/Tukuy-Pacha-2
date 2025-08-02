import express from 'express'
import {
  getUsuarios,
  createUsuario,
  updateRol,
  updateContrasena,
  updateUsuario,
  deleteUsuario,
  getUsuarioById, // <-- Nueva función
  restablecerContrasena // <-- Nueva función
} from '../controllers/usuarios.controller.js'

const router = express.Router()

router.get('/', getUsuarios)
router.get('/:id', getUsuarioById) // <-- Nueva ruta para obtener un usuario por ID
router.post('/', createUsuario)

// Rutas PUT para actualizaciones específicas (deben ir antes de la genérica)
router.put('/:id/rol', updateRol)
router.put('/:id/contrasena', updateContrasena)
router.post('/:id/restablecer-contrasena', restablecerContrasena) // <-- Nueva ruta para restablecer la contraseña

// Ruta PUT para actualización genérica
router.put('/:id', updateUsuario)

router.delete('/:id', deleteUsuario)

export default router