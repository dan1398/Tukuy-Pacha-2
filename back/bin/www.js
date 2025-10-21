import app from '../src/app.js'
import http from 'http'
import dotenv from 'dotenv'
// IMPORTA AQUÍ TU INSTANCIA DE SEQUELIZE
// **REEMPLAZA** la ruta de abajo con la ubicación real de tu objeto 'sequelize'.
import { sequelize } from '../ruta/real/a/sequelize.js'; 

dotenv.config()

const port = process.env.PORT || 3000
const server = http.createServer(app)

// Función ASÍNCRONA para manejar la conexión a la DB y el inicio del servidor
async function startServer() {
    try {
        // --- 1. CONEXIÓN Y SINCRONIZACIÓN DE SEQUELIZE ---
        
        console.log("Comprobando conexión a DB...");
        // Verifica la conexión
        await sequelize.authenticate(); 
        console.log("Conexión a DB exitosa.");

        // LÍNEA CRUCIAL: Crea las tablas (si no existen) basándose en los modelos
        // Esto resolverá el error 'Table... doesn't exist'.
        await sequelize.sync(); 
        console.log("Modelos sincronizados. Tablas creadas/verificadas.");
        
        // --- 2. INICIO DEL SERVIDOR ---
        server.listen(port, () => {
            console.log(`🚀 Servidor corriendo en http://localhost:${port}`)
        })

    } catch (error) {
        console.error("❌ Error FATAL: No se pudo conectar la DB o iniciar el servidor:", error);
        // Si hay un error, el servidor no se iniciará
        process.exit(1); 
    }
}

// Llamar a la función para iniciar todo
startServer();