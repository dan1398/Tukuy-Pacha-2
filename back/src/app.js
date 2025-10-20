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
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const uploadsPath = path.join(__dirname, '..', 'uploads')
console.log('🌐 Sirviendo estáticos desde:', uploadsPath)

const app = express()

app.use(cors())
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

app.use('/api/auth', authRoutes)
app.use('/api/participantes', participanteRoutes)
app.use('/api/documentos', documentoRoutes)
app.use('/api/usuarios', usuarioRoutes)
app.use('/api/patrocinadores', patrocinadorRoutes)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))



export default app