import { Router } from 'express';
import {
    getDocumentos,
    uploadDocumento,
    updateDocumento,
    deleteDocumento,
    downloadDocumento // Asegúrate que esta línea esté presente
} from '../controllers/documentos.controller.js';
import upload from '../middleware/upload.js'; // Multer configurado


const router = Router();

router.get('/', getDocumentos); // Ruta para obtener documentos
router.post('/', upload.single('archivo'), uploadDocumento); // Ruta para subir un documento
router.put('/:id', upload.single('archivo'), updateDocumento); // Ruta para actualizar un documento
router.delete('/:id', deleteDocumento); // Ruta para eliminar un documento
router.get('/download/:filename', downloadDocumento); // Ruta para descargar un documento

export default router;