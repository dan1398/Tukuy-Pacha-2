// src/routes/participantes.routes.js

import express from 'express';
import { 
    getParticipantes, 
    buscarParticipantes, // Importa la nueva función de búsqueda
    getParticipanteById, 
    createParticipante, 
    updateParticipante, 
    deleteParticipante 
} from '../controllers/participantes.controller.js';

import upload from '../middleware/upload.js'; 

const router = express.Router();

// 1. Ruta GET para la búsqueda "tipo Google" de participantes
// Ejemplo: GET /api/participantes/buscar?termino=danny
router.get('/buscar', buscarParticipantes); 

// 2. Ruta GET para obtener TODOS los participantes
// Ejemplo: GET /api/participantes
router.get('/', getParticipantes); 

// 3. Ruta GET para obtener un UNICO participante por su ID
// Ejemplo: GET /api/participantes/123
router.get('/:id', getParticipanteById);

// 4. Ruta POST para crear un nuevo participante (con subida de foto)
// Ejemplo: POST /api/participantes (con multipart/form-data)
router.post('/', upload.single('foto'), createParticipante);

// 5. Ruta PUT para actualizar un participante existente (con posible subida de nueva foto)
// Ejemplo: PUT /api/participantes/123 (con multipart/form-data si se actualiza la foto)
router.put('/:id', upload.single('foto'), updateParticipante);

// 6. Ruta DELETE para eliminar un participante
// Ejemplo: DELETE /api/participantes/123
router.delete('/:id', deleteParticipante);

export default router;