import app from '../src/app.js'
import http from 'http'
import dotenv from 'dotenv'
// 1. RUTA CORREGIDA: Importa tu pool de conexión desde '../src/db.js'
import pool from '../src/db.js'; 

dotenv.config()

const port = process.env.PORT || 3000
const server = http.createServer(app)

// Función para verificar la conexión a la base de datos (SIN crear tablas)
async function verifyDatabaseConnection() {
    try {
        console.log("Comprobando conexión a DB...");
        
        // Intenta obtener una conexión para verificar que el pool está activo y funcional
        const connection = await pool.getConnection();
        connection.release(); // Libera la conexión inmediatamente después de la prueba
        
        console.log("✅ Conexión a DB exitosa.");
        return true;

    } catch (error) {
        // Muestra un error detallado si la conexión falla (útil para Render)
        console.error("❌ Error FATAL al conectar la base de datos. Verifica la DATABASE_URL en Render:", error.message);
        return false;
    }
}

// Función ASÍNCRONA principal para el inicio del servidor
async function startServer() {
    const dbReady = await verifyDatabaseConnection();
    
    if (dbReady) {
        // --- INICIO DEL SERVIDOR ---
        server.listen(port, () => {
            console.log(`🚀 Servidor corriendo en http://localhost:${port}`)
        })
    } else {
        console.error("❌ El servidor no puede iniciar debido a un fallo en la base de datos.");
        process.exit(1);
    }
}

// Llamar a la función para iniciar todo
startServer();