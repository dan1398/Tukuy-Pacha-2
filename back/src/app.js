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
import fs from 'fs'; // Importar el módulo FS

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// --- RUTA CORREGIDA BASADA EN TU LOG DE ERROR ---
// Si Multer busca en '/src/back/uploads/', la ruta debe ser:

const uploadsPath = path.join(__dirname, 'uploads')

// Anteriormente usaba: path.join(__dirname, '..', 'uploads'), lo que causaba el error.
// --- CÓDIGO AÑADIDO: CREACIÓN FORZADA DEL DIRECTORIO ---

try {
    // 1. Verificar si la carpeta existe.
    if (!fs.existsSync(uploadsPath)) {
        // 2. Si no existe, crearla. El { recursive: true } asegura que funcione.
        fs.mkdirSync(uploadsPath, { recursive: true });
        console.log(`✅ Directorio de subidas creado exitosamente en: ${uploadsPath}`);
    } else {
        console.log(`🌐 Directorio de subidas ya existe: ${uploadsPath}`);
    }
} catch (error) {
    console.error('❌ Error fatal al intentar crear el directorio de subidas:', error);
}

// --------------------------------------------------------
console.log('🌐 Sirviendo estáticos desde:', uploadsPath)
const app = express()
// Middlewares

app.use(cors())
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// Rutas API
app.use('/api/auth', authRoutes)
app.use('/api/participantes', participanteRoutes)
app.use('/api/documentos', documentoRoutes)
app.use('/api/usuarios', usuarioRoutes)
app.use('/api/patrocinadores', patrocinadorRoutes)

// Servicio de Archivos Estáticos (usando la variable ya definida)
// Se usa uploadsPath para servir la carpeta correcta
app.use('/uploads', express.static(uploadsPath))

export default app