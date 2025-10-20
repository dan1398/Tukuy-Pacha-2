import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

// Esto es necesario para que funcione __dirname en ESModules
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const uploadDir = path.join(__dirname, '..', '..', 'uploads')

// Para fines de depuración: imprime la ruta donde Multer intentará guardar
console.log('Multer intentará guardar en (upload.js):', uploadDir);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
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
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
  ]
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    
    cb(new Error('Tipo de archivo no permitido. Solo se permiten imágenes (jpeg, png), PDF, hojas de cálculo (xls, xlsx) y Word (DOC, DOCX).'), false)
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