import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

// Esto es necesario para que funcione __dirname en ESModules
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Ruta absoluta a la carpeta 'uploads'
// Desde 'back/src/middleware/upload.js', necesitamos subir:
// 1. Un nivel para salir de 'middleware' (nos deja en 'back/src')
// 2. Otro nivel para salir de 'src' (nos deja en 'back')
// 3. Y luego entramos en la carpeta 'uploads'
const uploadDir = path.join(__dirname, '..', '..', 'uploads')

// Para fines de depuración: imprime la ruta donde Multer intentará guardar
console.log('Multer intentará guardar en (upload.js):', uploadDir);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Asegúrate de que el directorio de destino exista.
    // Multer no lo crea por defecto, por lo que una buena práctica es verificarlo.
    // Aunque para el error 404, el problema suele ser la ruta en sí, no que no exista.
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
})

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'application/pdf',
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // .xlsx
  ]
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    // Puedes personalizar este mensaje de error
    cb(new Error('Tipo de archivo no permitido. Solo se permiten imágenes (jpeg, png), PDF y hojas de cálculo (xls, xlsx).'), false)
  }
}

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // Limite de tamaño de archivo (ej. 10 MB)
  }
})

export default upload