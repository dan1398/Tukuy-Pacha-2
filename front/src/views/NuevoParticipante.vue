<template>
  <div class="container py-4">
    <h3 class="admin-main-title">Registrar Nuevo Participante</h3>
    <form @submit.prevent="registrarParticipante" enctype="multipart/form-data" class="row g-3">
      <div class="col-md-4 mb-3">
        <label class="form-label">Código</label>
        <input v-model="codigo" type="text" class="form-control admin-input" required />
      </div>
      <div class="col-md-4 mb-3">
        <label class="form-label">Nombre</label>
        <input v-model="nombre" type="text" class="form-control admin-input" required />
      </div>
      <div class="col-12 mb-3">
        <label class="form-label">Foto</label>
        <input type="file" name="foto" class="form-control admin-input" @change="handleFoto" accept="image/jpeg,image/png" required />
      </div>
      <div class="col-md-4 mb-3">
        <label class="form-label">CI</label>
        <input v-model="ci" type="text" class="form-control admin-input" required />
      </div>

      <div class="col-md-4 mb-3">
        <label class="form-label">Fecha de Nacimiento</label>
        <input v-model="fechaNacimiento" type="date" class="form-control admin-input" required />
      </div>
      <div class="col-md-4 mb-3">
        <label class="form-label">Dirección</label>
        <input v-model="direccion" type="text" class="form-control admin-input" required />
      </div>
      <div class="col-md-4 mb-3">
        <label class="form-label">Celular</label>
        <input v-model="celular" type="text" class="form-control admin-input" required />
      </div>

      <div class="col-md-6 mb-3">
        <label class="form-label">Nombre del Patrocinador</label>
        <input v-model="nombrePatrocinador" type="text" class="form-control admin-input" required />
      </div>
      <div class="col-md-6 mb-3">
        <label class="form-label">Contacto del Patrocinador</label>
        <input v-model="contacto" type="text" class="form-control admin-input" required />
      </div>

      <div class="col-12 mb-3">
        <h5 class="admin-section-title">Documentos Acompañados</h5>
      </div>

      <div class="col-md-12 mb-3" v-for="(doc, index) in documentos" :key="index">
        <div class="row g-2 align-items-end">
          <div class="col-md-5">
            <label class="form-label">Tipo de Documento</label>
            <select v-model="doc.tipo" class="form-select admin-select" required>
              <option value="">Seleccione un tipo</option> <option value="Formulario">Formulario</option>
              <option value="Correspondencia">Correspondencia</option>
              <option value="Especial">Especial</option>
              <option value="Salud">Salud</option>
              <option value="Educacion">Educación</option>
            </select>
          </div>
          <div class="col-md-5">
            <label class="form-label">Archivo</label>
            <input type="file" class="form-control admin-input" @change="(event) => handleArchivo(event, index)" accept=".pdf,.jpg,.jpeg,.png,.xls,.xlsx" required />
          </div>
          <div class="col-md-2">
            <button type="button" class="btn btn-danger w-100 btn-sm" @click="eliminarDocumento(index)">Eliminar</button>
          </div>
        </div>
      </div>

      <div class="col-12 mb-3">
        <button type="button" class="btn btn-outline-primary admin-btn-outline" @click="agregarDocumento">+ Añadir Documento</button>
      </div>

      <div class="col-12 mt-4">
        <button type="submit" class="btn btn-success admin-btn-success">Registrar</button>
        <button type="button" class="btn btn-secondary ms-2 admin-btn-secondary" @click="volver">Cancelar</button>
      </div>

      <div v-if="mensaje" :class="['alert mt-3', mensajeTipo === 'success' ? 'alert-success' : 'alert-danger']">{{ mensaje }}</div>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const router = useRouter()
const codigo = ref('')
const nombre = ref('')
const ci = ref('')
const fechaNacimiento = ref('')
const direccion = ref('')
const celular = ref('')
const nombrePatrocinador = ref('')
const contacto = ref('')
const foto = ref(null)
const documentos = ref([{ tipo: '', archivo: null }]) // Inicia con un campo de documento vacío
const mensaje = ref('')
const mensajeTipo = ref('') // Para controlar el tipo de alerta (success/danger)

function agregarDocumento() {
  documentos.value.push({ tipo: '', archivo: null })
}

function eliminarDocumento(index) {
  documentos.value.splice(index, 1)
}

function handleArchivo(e, index) {
  if (!e || !e.target || !e.target.files || !e.target.files[0]) return
  const selected = e.target.files[0]
  const tiposPermitidos = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
  if (!tiposPermitidos.includes(selected.type)) {
    alert('Tipo de archivo no permitido. Solo se permiten PDF, imágenes (JPEG, PNG) y hojas de cálculo (Excel).')
    e.target.value = '' // Limpia el input del archivo
    documentos.value[index].archivo = null // Asegura que el modelo también se limpie
    return
  }
  documentos.value[index].archivo = selected
}

function handleFoto(e) {
  const file = e.target.files[0]
  if (!file) {
    foto.value = null; // Si el usuario cancela la selección, reinicia
    return
  }
  const tiposPermitidos = ['image/jpeg', 'image/png']
  if (!tiposPermitidos.includes(file.type)) {
    alert('Solo se permiten imágenes JPG o PNG para la foto del participante.')
    e.target.value = '' // Limpia el input del archivo
    foto.value = null
    return
  }
  foto.value = file
}

async function registrarParticipante() {
  mensaje.value = '' // Limpiar mensajes anteriores
  mensajeTipo.value = ''

  try {
    const formData = new FormData()
    // ¡IMPORTANTE! Añade 'codigo' primero para que Multer pueda leerlo temprano
    formData.append('codigo', codigo.value) 
    formData.append('nombre', nombre.value)
    formData.append('CI', ci.value)
    formData.append('fecha_nacimiento', fechaNacimiento.value)
    formData.append('direccion', direccion.value)
    formData.append('celular', celular.value)
    formData.append('nombre_patrocinador', nombrePatrocinador.value)
    formData.append('contacto', contacto.value)
    if (foto.value) {
      formData.append('foto', foto.value) // La foto se añade después del código
    }

    // 1. Registrar Participante Principal (con su foto)
    const res = await axios.post('http://localhost:3000/api/participantes', formData)
    const id_participante = res.data.id // Asume que el backend devuelve el ID del nuevo participante
    
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
    const id_usuario = usuario.id

    if (!id_usuario) {
      throw new Error('No se encontró el ID de usuario en el almacenamiento local. Por favor, inicie sesión nuevamente.')
    }

    // 2. Registrar Documentos Acompañados
    for (const doc of documentos.value) {
      if (doc.archivo) { // Solo procesa documentos que tengan un archivo seleccionado
        const docForm = new FormData()
        docForm.append('archivo', doc.archivo)
        docForm.append('tipo_documento', doc.tipo)
        docForm.append('id_participante', id_participante) // ID del participante recién creado
        docForm.append('id_usuario', id_usuario)

        await axios.post('http://localhost:3000/api/documentos', docForm)
      }
    }

    mensaje.value = 'Participante y documentos registrados correctamente.'
    mensajeTipo.value = 'success'
    
    // Limpiar todos los campos después del registro exitoso
    codigo.value = ''
    nombre.value = ''
    ci.value = ''
    fechaNacimiento.value = ''
    direccion.value = ''
    celular.value = ''
    nombrePatrocinador.value = ''
    contacto.value = ''
    foto.value = null
    // Reiniciar el array de documentos a su estado inicial
    documentos.value = [{ tipo: '', archivo: null }] 

  } catch (err) {
    console.error('Error al registrar participante o documentos:', err)
    const errorMessage = err.response?.data?.mensaje || err.response?.data?.error || err.message;
    mensaje.value = 'Error al registrar participante o documentos. Detalles: ' + errorMessage;
    mensajeTipo.value = 'danger';
  }
}

function volver() {
  router.push('/adminDashboard')
}
</script>

<style scoped>
/* Las variables CSS deben estar definidas en un archivo global o en :root */
/* Por ejemplo, en tu main.css o app.vue:
:root {
  --tukuypacha-accent: #f05a30;
  --tukuypacha-dark-text: #333;
  --tukuypacha-border-color: #dee2e6;
  --tukuypacha-card-bg: #fff;
  --tukuypacha-success: #28a745;
  --tukuypacha-secondary-btn: #6c757d;
}
*/

.container {
  max-width: 800px;
  background-color: var(--tukuypacha-card-bg, #fff); /* Fallback blanco si no está definida */
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 2rem;
}

h3.admin-main-title {
  color: var(--tukuypacha-accent, #f05a30);
  font-weight: 700;
  font-size: 1.8rem;
  margin-bottom: 2rem;
  text-align: center;
}

h5.admin-section-title {
  color: var(--tukuypacha-dark-text, #333);
  font-weight: 600;
  font-size: 1.4rem;
  margin-top: 1rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid var(--tukuypacha-border-color, #dee2e6);
  padding-bottom: 0.5rem;
}

.form-label {
  font-weight: 500;
  color: var(--tukuypacha-dark-text, #333);
  margin-bottom: 0.4rem;
}

.admin-input,
.admin-select {
  border-radius: 5px;
  border: 1px solid var(--tukuypacha-border-color, #dee2e6);
  padding: 0.6rem 1rem;
  font-size: 1rem;
  font-weight: 400;
  color: var(--tukuypacha-dark-text, #333);
  font-family: 'Poppins', sans-serif;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.admin-input:focus,
.admin-select:focus {
  border-color: var(--tukuypacha-accent, #f05a30);
  box-shadow: 0 0 0 0.25rem rgba(240, 90, 48, 0.2);
  outline: none;
}

/* Estilos para los botones del formulario */
.admin-btn-success {
  background-color: var(--tukuypacha-success, #28a745);
  border-color: var(--tukuypacha-success, #28a745);
  color: #fff;
  font-weight: 500;
  border-radius: 5px;
  padding: 0.75rem 1.5rem;
  transition: background-color 0.2s ease, opacity 0.2s ease;
}
.admin-btn-success:hover {
  background-color: #218838; /* Color un poco más oscuro al pasar el ratón */
  border-color: #1e7e34;
  opacity: 0.9;
}

.admin-btn-secondary {
  background-color: var(--tukuypacha-secondary-btn, #6c757d);
  border-color: var(--tukuypacha-secondary-btn, #6c757d);
  color: #fff;
  font-weight: 500;
  border-radius: 5px;
  padding: 0.75rem 1.5rem;
  transition: background-color 0.2s ease, opacity 0.2s ease;
}
.admin-btn-secondary:hover {
  background-color: #5a6268; /* Color un poco más oscuro al pasar el ratón */
  border-color: #545b62;
  opacity: 0.9;
}

.admin-btn-outline {
  background-color: transparent;
  border: 1px solid var(--tukuypacha-accent, #f05a30);
  color: var(--tukuypacha-accent, #f05a30);
  font-weight: 500;
  border-radius: 5px;
  padding: 0.75rem 1.5rem;
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.admin-btn-outline:hover {
  background-color: var(--tukuypacha-accent, #f05a30);
  color: #fff;
  border-color: var(--tukuypacha-accent, #f05a30);
}

.btn-danger { /* Estilo específico para el botón Eliminar documento */
  background-color: #dc3545;
  border-color: #dc3545;
  color: #fff;
  font-weight: 500;
  border-radius: 5px;
  padding: 0.5rem 1rem; /* Un poco más pequeño */
  transition: background-color 0.2s ease, opacity 0.2s ease;
}
.btn-danger:hover {
  background-color: #c82333;
  border-color: #bd2130;
  opacity: 0.9;
}

.alert {
  padding: 0.75rem 1.25rem;
  border-radius: 5px;
}
.alert-success {
  background-color: #d4edda;
  border-color: #c3e6cb;
  color: #155724;
}
.alert-danger {
  background-color: #f8d7da;
  border-color: #f5c6cb;
  color: #721c24;
}
</style>