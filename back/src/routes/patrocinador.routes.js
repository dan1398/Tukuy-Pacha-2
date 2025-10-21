// src/routes/patrocinador.routes.js

import { Router } from 'express';
import {
    getPatrocinadores,
    getPatrocinadorById,
    createPatrocinador,
    updatePatrocinador,
    deletePatrocinador,
    createPatrocinio, // <-- Nueva función
    getParticipantesByPatrocinador // <-- Nueva función
} from '../controllers/patrocinador.controller.js';

const router = Router();

router.get('/', getPatrocinadores);
router.get('/:id', getPatrocinadorById);
router.post('/', createPatrocinador);
router.put('/:id', updatePatrocinador);
router.delete('/:id', deletePatrocinador);

// Rutas para la relación con participantes
router.post('/patrocinar', createPatrocinio);
router.get('/:id/participantes', getParticipantesByPatrocinador);

export default router;