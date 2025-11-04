// controllers/dashboard.controller.js

// ... (asegúrate de que pool y las importaciones superiores sean correctas)
import pool from '../db.js'; 
import { request, response } from 'express';

export const obtenerEstadisticasDashboard = async (req = request, res = response) => {
    try {
        // 1. CONSULTA: Total de Participantes (CORRECTA)
        const [totalParticipantesResult] = await pool.query(
            'SELECT COUNT(*) AS total FROM participante' 
        );
        const totalParticipantes = totalParticipantesResult[0].total;

        // 2. CONSULTA: Total de Patrocinadores (CORRECTA)
        const [totalPatrocinadoresResult] = await pool.query(
            'SELECT COUNT(*) AS total FROM patrocinador'
        );
        const totalPatrocinadores = totalPatrocinadoresResult[0].total;
        
        // =========================================================================
        // 3. CONSULTA: Conteo de Documentos (Solo PDF, Word, Excel, Otros)
        // =========================================================================
        // 🟢 NOTA: La tabla se llama 'documento' (singular) según tu captura de phpMyAdmin.
        const [documentosResult] = await pool.query(`
            SELECT 
                SUM(CASE WHEN ruta_archivo LIKE '%.pdf' THEN 1 ELSE 0 END) AS pdf,
                SUM(CASE WHEN ruta_archivo LIKE '%.doc%' THEN 1 ELSE 0 END) AS word,
                SUM(CASE WHEN ruta_archivo LIKE '%.xls%' THEN 1 ELSE 0 END) AS excel,
                SUM(CASE 
                    WHEN ruta_archivo NOT LIKE '%.pdf' 
                    AND ruta_archivo NOT LIKE '%.doc%' 
                    AND ruta_archivo NOT LIKE '%.xls%'
                    AND ruta_archivo NOT LIKE '%.jpg' 
                    AND ruta_archivo NOT LIKE '%.png' 
                    AND ruta_archivo NOT LIKE '%.jpeg'
                    THEN 1 ELSE 0 
                END) AS otros
            FROM documento;
        `); 
        const conteoDocumentos = documentosResult[0];

        // =========================================================================
        // 4. NUEVA CONSULTA: Conteo de Imágenes de Perfil (JPG, PNG)
        // =========================================================================
        // Contamos los participantes que tienen una foto subida.
        const [conteoImagenesResult] = await pool.query(`
            SELECT 
                COUNT(*) AS total_imagenes
            FROM participante
            WHERE foto IS NOT NULL AND foto != '' AND (foto LIKE '%.jpg' OR foto LIKE '%.png' OR foto LIKE '%.jpeg');
        `);
        const totalImagenesParticipante = conteoImagenesResult[0].total_imagenes;


        // 5. RESPUESTA FINAL
        res.json({
            totalParticipantes: parseInt(totalParticipantes) || 0,
            totalPatrocinadores: parseInt(totalPatrocinadores) || 0,
            documentos: {
                pdf: parseInt(conteoDocumentos.pdf) || 0,
                word: parseInt(conteoDocumentos.word) || 0,
                excel: parseInt(conteoDocumentos.excel) || 0,
                // Sumamos las imágenes de los documentos (que ahora es 0) 
                // más las imágenes de perfil (que es totalImagenesParticipante)
                imagen: parseInt(totalImagenesParticipante) || 0, 
                otros: parseInt(conteoDocumentos.otros) || 0
            }
        });

    } catch (error) {
        console.error('❌ Error al obtener estadísticas del dashboard:', error);
        res.status(500).json({ error: 'Error interno del servidor al obtener estadísticas' });
    }
};