import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

// 1. Cargar variables de entorno del archivo .env (para local)
dotenv.config() 

// 2. Definir las variables necesarias
const DB_HOST = process.env.DB_HOST
const DB_USER = process.env.DB_USER
const DB_PASSWORD = process.env.DB_PASSWORD
const DB_NAME = process.env.DB_NAME

// 3. Verificación básica (opcional, pero útil)
if (!DB_HOST || !DB_USER || !DB_NAME) {
    console.error("¡ERROR! Faltan variables de entorno DB_HOST, DB_USER o DB_NAME para la conexión local.")
    // Podrías lanzar un error o usar valores predeterminados si lo prefieres
}

// 4. Crear el pool de conexiones usando los parámetros individuales
const pool = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10
    // Puedes añadir más opciones como:
    // ssl: { rejectUnauthorized: false } si tu DB local usa SSL
})

export default pool