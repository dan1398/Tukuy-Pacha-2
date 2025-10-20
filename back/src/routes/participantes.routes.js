// src/routes/participantes.routes.js

import express from 'express';
import { 
    getParticipantes, 
    buscarParticipantes, 
    getParticipanteById, 
    createParticipante, 
    updateParticipante, 
    deleteParticipante 
} from '../controllers/participantes.controller.js';

import upload from '../middleware/upload.js'; 



const router = express.Router();


router.get('/buscar', buscarParticipantes); 


router.get('/', getParticipantes); 


router.get('/:id', getParticipanteById);


router.post('/', upload.single('foto'), createParticipante);


router.put('/:id', upload.single('foto'), updateParticipante);


router.delete('/:id', deleteParticipante);

export default router;