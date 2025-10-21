/*
import mysql from 'mysql2/promise'
import dotenv from 'dotenv'
dotenv.config()

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
})
*/
// ----------------------------------------------------

// (Usando DATABASE_URL)

import mysql from 'mysql2/promise'
import dotenv from 'dotenv'
dotenv.config()

// La URL completa de conexión de Railway (ej: mysql://user:pass@host:port/dbname)
const connectionUrl = process.env.DATABASE_URL 
  
if (!connectionUrl) {
    throw new Error('DATABASE_URL no está definida en las variables de entorno.')
}

// mysql2/promise puede usar la URL completa, si el formato es compatible.
const pool = mysql.createPool(connectionUrl) 

export default pool