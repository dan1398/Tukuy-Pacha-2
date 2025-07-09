// src/routes/participantes.routes.js

import express from 'express';
import { 
    getParticipantes, 
    getParticipanteById, // <-- ¡Importa la nueva función aquí!
    createParticipante, 
    updateParticipante, 
    deleteParticipante 
} from '../controllers/participantes.controller.js';
// Asegúrate de que tu middleware de Multer se exporte como 'upload'
import upload from '../middleware/upload.js'; 

const router = express.Router();

// 1. Ruta GET para obtener TODOS los participantes o buscar por 'codigo'
// Ejemplo: GET /api/participantes o GET /api/participantes?codigo=XYZ
router.get('/', getParticipantes); 

// 2. Ruta GET para obtener un UNICO participante por su ID
// Esta es la ruta que tu componente EditarParticipante.vue usará para cargar los datos.
// Ejemplo: GET /api/participantes/123
router.get('/:id', getParticipanteById); // <-- ¡Esta es la clave para la edición!

// 3. Ruta POST para crear un nuevo participante (con subida de foto)
// Ejemplo: POST /api/participantes (con multipart/form-data)
router.post('/', upload.single('foto'), createParticipante);

// 4. Ruta PUT para actualizar un participante existente (con posible subida de nueva foto)
// Ejemplo: PUT /api/participantes/123 (con multipart/form-data si se actualiza la foto)
router.put('/:id', upload.single('foto'), updateParticipante);

// 5. Ruta DELETE para eliminar un participante
// Ejemplo: DELETE /api/participantes/123
router.delete('/:id', deleteParticipante);

export default router;