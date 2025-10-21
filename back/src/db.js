import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

// Cargar variables de entorno del archivo .env (para entorno local)
dotenv.config() 

// --- Configuración de la base de datos local ---
const DB_HOST = process.env.DB_HOST
const DB_USER = process.env.DB_USER
const DB_PASSWORD = process.env.DB_PASSWORD
const DB_NAME = process.env.DB_NAME
// Usamos el puerto 3306 por defecto si PORT_DB no está definido.
const DB_PORT = process.env.PORT_DB || 3306 

// 1. Verificación de variables críticas
if (!DB_HOST || !DB_USER || !DB_NAME) {
    console.error("⛔️ ERROR DE CONFIGURACIÓN: Faltan variables de entorno (DB_HOST, DB_USER, DB_NAME).")
    console.error("Asegúrate de que tu archivo .env esté cargado correctamente.")
    // Lanza un error fatal para detener la aplicación si la DB no puede configurarse.
    throw new Error("Fallo en la configuración de las credenciales de la base de datos.")
}

// 2. Crear el Pool de Conexiones a MySQL
const pool = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    port: DB_PORT, // Añadimos el puerto
    waitForConnections: true,
    connectionLimit: 10,
    // Otras opciones...
})

// 3. Prueba de conexión para detectar errores como ECONNREFUSED al inicio
pool.getConnection()
    .then(connection => {
        console.log(`✅ Conexión exitosa a la base de datos local (${DB_HOST}:${DB_PORT}/${DB_NAME}).`)
        connection.release() // Devuelve la conexión al pool
    })
    .catch(err => {
        console.error('❌ Error FATAL al conectar la base de datos.')
        console.error(`Verifica que MySQL esté activo en el puerto ${DB_PORT}. Detalle:`, err.message)
        // Detiene el servidor si no se puede conectar a la DB
        process.exit(1) 
    })

export default pool