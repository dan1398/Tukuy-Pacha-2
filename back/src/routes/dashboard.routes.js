import { Router } from 'express';
// 🚨 Asegúrate de que esta ruta sea correcta para acceder a tu controlador
import { obtenerEstadisticasDashboard } from '../controllers/dashboard.controller.js'; 

const router = Router();

// Endpoint: GET /api/dashboard/stats
router.get('/stats', obtenerEstadisticasDashboard);

export default router;