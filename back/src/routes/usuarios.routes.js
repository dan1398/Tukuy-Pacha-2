import express from 'express';
import {
    getUsuarios,
    createUsuario,
    updateRol,
    updateContrasena,
    updateUsuario,
    deleteUsuario,
    getUsuarioById,
    restablecerContrasena,
} from '../controllers/usuarios.controller.js';

const router = express.Router();

router.get('/', getUsuarios);
router.get('/:id', getUsuarioById);
router.post('/', createUsuario);

// Rutas PUT para actualizaciones específicas (deben ir antes de la genérica)
router.put('/:id/rol', updateRol);
router.put('/:id/contrasena', updateContrasena);
router.post('/:id/restablecer-contrasena', restablecerContrasena);

// Ruta PUT para actualización genérica
router.put('/:id', updateUsuario);

router.delete('/:id', deleteUsuario);

export default router;