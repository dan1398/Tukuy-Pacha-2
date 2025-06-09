import app from '../src/app.js'
import http from 'http'
import dotenv from 'dotenv'
dotenv.config()

const port = process.env.PORT || 3000
const server = http.createServer(app)

server.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`)
})