import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import authRoutes from './routes/auth.routes.js'
import participanteRoutes from './routes/participantes.routes.js'
import documentoRoutes from './routes/documentos.routes.js'
import usuarioRoutes from './routes/usuarios.routes.js'
import patrocinadorRoutes from './routes/patrocinador.routes.js'
import dotenv from 'dotenv'
import path from 'path';
import { fileURLToPath } from 'url'
import fs from 'fs';

dotenv.config()

// --- CONFIGURACIÓN DE RUTAS Y DIRECTORIOS ---
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// CORRECCIÓN: Usamos '..' para subir de 'src' a la raíz del proyecto y encontrar 'uploads'
const uploadsPath = path.join(__dirname, '..', 'uploads') 

// --- CÓDIGO AÑADIDO: CREACIÓN FORZADA DEL DIRECTORIO ---
try {
    // 1. Verificar si la carpeta existe.
    if (!fs.existsSync(uploadsPath)) {
        // 2. Si no existe, crearla.
        fs.mkdirSync(uploadsPath, { recursive: true });
        console.log(`✅ Directorio de subidas creado exitosamente en: ${uploadsPath}`);
    } else {
        console.log(`🌐 Directorio de subidas ya existe: ${uploadsPath}`);
    }
} catch (error) {
    console.error('❌ Error fatal al intentar crear el directorio de subidas:', error);
}
// --------------------------------------------------------

console.log('🌐 Servidor Express usando la carpeta de subidas en:', uploadsPath)

const app = express()

// Middlewares
app.use(cors())
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// --- LÍNEA CLAVE PARA SERVIR ARCHIVOS ESTÁTICOS ---
// Esto permite que el navegador acceda a archivos usando la URL /uploads/...
app.use('/uploads', express.static(uploadsPath)) 
// --------------------------------------------------------


// Rutas API
app.use('/api/auth', authRoutes)
app.use('/api/participantes', participanteRoutes)
app.use('/api/documentos', documentoRoutes)
app.use('/api/usuarios', usuarioRoutes)
app.use('/api/patrocinadores', patrocinadorRoutes)


export default app