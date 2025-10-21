<template>
  <div class="container py-4">
    <h3 class="admin-main-title">Editar Participante</h3>
    <form @submit.prevent="actualizarParticipante" enctype="multipart/form-data" class="row g-3">
      <div v-if="!participanteCargado" class="text-center py-5">
        Cargando datos del participante...
      </div>
      <div v-else>
        <div class="col-md-4 mb-3">
          <label class="form-label">Código</label>
          <input
            v-model="participante.codigo"
            name="codigo"
            type="text"
            class="form-control admin-input"
            required
            @blur="validarCodigo"
            @input="handleCodigoInput"
          />
          <small class="text-muted">Para niños, niñas y adolescentes es TKC, Para adultos mayores es TKE</small>
          <div v-if="errorCodigo" class="text-danger small mt-1">{{ errorCodigo }}</div>
        </div>

        <div class="col-md-4 mb-3">
          <label class="form-label">Nombre</label>
          <input 
            v-model="participante.nombre" 
            name="nombre" 
            type="text" 
            class="form-control admin-input" 
            required
            @blur="validarNombre"
          />
          <div v-if="errorNombre" class="text-danger small mt-1">{{ errorNombre }}</div>
        </div>

        <div class="col-md-4 mb-3">
          <label class="form-label">Apellido Paterno</label>
          <input 
            v-model="participante.apellido_paterno" 
            type="text" 
            name="apellidoPaterno" 
            class="form-control admin-input"
            @blur="validarApellidoPaterno"
          />
          <div v-if="errorApellidoPaterno" class="text-danger small mt-1">{{ errorApellidoPaterno }}</div>
        </div>

        <div class="col-md-4 mb-3">
          <label class="form-label">Apellido Materno</label>
          <input 
            v-model="participante.apellido_materno" 
            type="text" 
            name="apellidoMaterno" 
            class="form-control admin-input"
            @blur="validarApellidoMaterno"
          />
          <div v-if="errorApellidoMaterno" class="text-danger small mt-1">{{ errorApellidoMaterno }}</div>
        </div>

        <div class="col-12 mb-3">
          <label class="form-label">Foto (actual:
            <a v-if="participante.foto" :href="`http://localhost:3000/uploads/${participante.foto}`" target="_blank">{{ participante.foto }}</a>
            <span v-else>N/A</span>
          </label>
          <input type="file" name="foto" class="form-control admin-input" @change="handleFoto" accept="image/jpeg,image/png" />
          <small class="form-text text-muted">Selecciona una nueva foto solo si deseas cambiarla.</small>
          <div class="form-check mt-2" v-if="participante.foto">
            <input class="form-check-input" type="checkbox" id="eliminarFotoCheckbox" v-model="eliminarFotoActual">
            <label class="form-check-label" for="eliminarFotoCheckbox">
              Eliminar foto actual
            </label>
          </div>
        </div>

        <div class="col-md-4 mb-3">
          <label class="form-label">Cedula de Identidad</label>
          <input v-model="participante.CI" name="CI" type="text" class="form-control admin-input" placeholder="Ej: 8724526" required />
        </div>

        <div class="col-md-4 mb-3">
          <label class="form-label">Fecha de Nacimiento</label>
          <input v-model="participante.fecha_nacimiento" name="fecha_nacimiento" type="date" class="form-control admin-input" required />
        </div>

        <div class="col-md-4 mb-3">
          <label class="form-label">Dirección (Bolivia)</label>
          <input
            v-model="participante.direccion"
            name="direccion"
            type="text"
            class="form-control admin-input"
            placeholder="Ej: Av. Arce 1234, La Paz"
            required
            @blur="validarDireccion"
            list="departamentos"
          />
          <datalist id="departamentos">
            <option v-for="depto in departamentosBolivia" :key="depto" :value="depto"></option>
          </datalist>
          <small class="text-muted">Debe incluir un departamento boliviano: {{ departamentosBolivia.join(', ') }}</small>
          <div v-if="errorDireccion" class="text-danger small mt-1">{{ errorDireccion }}</div>
        </div>

        <div class="col-md-4 mb-3">
          <label class="form-label">Celular</label>
          <input
            v-model="participante.celular"
            name="celular"
            type="text"
            class="form-control admin-input"
            @input="formatearCelular"
            @blur="validarCelular"
            placeholder="Ej: 78765432"
            required
          />
          <small class="text-muted">Formato: 7XXXXXXX o 6XXXXXXX (8 dígitos)</small>
          <div v-if="errorCelular" class="text-danger small mt-1">{{ errorCelular }}</div>
        </div>

        <div class="col-12 mb-3 mt-4">
          <h5 class="admin-section-title">Datos del Patrocinador</h5>
        </div>

        <div class="col-md-6 mb-3">
          <label class="form-label">Buscar Patrocinador</label>
          <div class="input-group">
            <input
              v-model="busquedaPatrocinador"
              name="busquedaPatrocinador"
              type="text"
              class="form-control admin-input"
              placeholder="Buscar por nombre..."
              @input="buscarPatrocinadores"
            />
            <button
              class="btn btn-outline-secondary"
              type="button"
              @click="limpiarBusquedaPatrocinador"
            >
              Limpiar
            </button>
          </div>
          <div v-if="errorPatrocinador" class="text-danger small mt-1">
            {{ errorPatrocinador }}
          </div>
          <ul v-if="resultadosBusqueda.length > 0" class="list-group mt-2">
            <li
              v-for="patrocinador in resultadosBusqueda"
              :key="patrocinador.id_patrocinador"
              class="list-group-item list-group-item-action"
              @click="seleccionarPatrocinador(patrocinador)"
            >
              {{ patrocinador.nombre }} {{ patrocinador.apellido_paterno }} {{ patrocinador.apellido_materno }}
            </li>
          </ul>
        </div>

        <div class="col-md-6 mb-3">
          <label class="form-label">Nombre del Patrocinador</label>
          <input
            v-model="participante.patrocinador_nombre"
            type="text"
            class="form-control admin-input"
            name="patrocinador_nombre"
            readonly
          />
        </div>

        <div class="col-md-6 mb-3">
          <label class="form-label">Apellido Paterno</label>
          <input
            v-model="participante.patrocinador_apellido_paterno"
            type="text"
            class="form-control admin-input"
            name="patrocinador_apellido_paterno"
            readonly
          />
        </div>

        <div class="col-md-6 mb-3">
          <label class="form-label">Apellido Materno</label>
          <input
            v-model="participante.patrocinador_apellido_materno"
            type="text"
            class="form-control admin-input"
             name="patrocinador_apellido_materno"
            readonly
          />
        </div>

        <div class="col-md-6 mb-3">
          <label class="form-label">Celular</label>
          <input
            v-model="participante.patrocinador_celular"
            type="text"
            class="form-control admin-input"
            name="patrocinador_celular"
            readonly
          />
        </div>

        <div class="col-md-6 mb-3">
          <label class="form-label">Correo Electrónico</label>
          <input
            v-model="participante.patrocinador_correo"
            type="text"
            class="form-control admin-input"
            name="patrocinador_correo"
            readonly
          />
        </div>

        <div class="col-12 mb-3 mt-4">
          <h5 class="admin-section-title">Documentos Acompañados</h5>
        </div>

        <div class="col-md-12 mb-3" v-for="(doc, index) in documentos" :key="doc.id_documento || 'new-' + index">
          <div class="row g-2 align-items-end">
            <div class="col-md-4">
              <label class="form-label">Tipo de Documento</label>
              <select v-model="doc.tipo_documento" class="form-select admin-select" required>
                <option value="">Seleccione un tipo</option>
                <option value="Formulario">Formulario</option>
                <option value="Correspondencia">Correspondencia</option>
                <option value="Especial">Especial</option>
                <option value="Salud">Salud</option>
                <option value="Educacion">Educación</option>
              </select>
            </div>
            <div class="col-md-5">
              <label class="form-label">Archivo</label>
              <input type="file" class="form-control admin-input" @change="(event) => handleArchivo(event, index)" accept=".pdf,.jpg,.jpeg,.png,.xls,.xlsx" />
              <small v-if="doc.ruta_archivo && !doc.nuevoArchivo" class="form-text text-muted">
                Archivo actual: <a :href="`http://localhost:3000/uploads/${doc.ruta_archivo}`" target="_blank">{{ doc.nombre_archivo }}</a>
              </small>
              <small v-else-if="doc.nuevoArchivo" class="form-text text-muted">
                Nuevo archivo seleccionado: {{ doc.nuevoArchivo.name }}
              </small>
            </div>
            <div class="col-md-3 d-flex align-items-center">
              <button type="button" class="btn btn-danger w-100 btn-sm" @click="eliminarDocumento(index)">Eliminar</button>
            </div>
          </div>
        </div>

        <div class="col-12 mb-3">
          <button type="button" class="btn btn-outline-primary admin-btn-outline" @click="agregarDocumento">+ Añadir Documento</button>
        </div>

        <div class="col-12 mt-4">
          <button type="submit" class="btn btn-success admin-btn-success">Guardar Cambios</button>
          <button type="button" class="btn btn-secondary ms-2 admin-btn-secondary" @click="volver">Cancelar</button>
        </div>

        <div v-if="mensaje" :class="['alert mt-3', mensajeTipo === 'success' ? 'alert-success' : 'alert-danger']">
          {{ mensaje }}
        </div>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import axios from 'axios'
import { useRoute, useRouter } from 'vue-router'

// --- DEFINICIÓN DE LA URL DE LA API DE RENDER ---
const API_URL = 'https://tukuy-pacha-2.onrender.com';
// --------------------------------------------------

const route = useRoute()
const router = useRouter()

const participante = ref(null)
const documentos = ref([])
const nuevaFoto = ref(null)
const participanteCargado = ref(false)
const mensaje = ref('')
const mensajeTipo = ref('')
const eliminarFotoActual = ref(false)
const documentosAEliminar = ref([])
const busquedaPatrocinador = ref('')
const resultadosBusqueda = ref([])

// Variables de validación
const errorCodigo = ref('')
const errorNombre = ref('')
const errorApellidoPaterno = ref('')
const errorApellidoMaterno = ref('')
const errorDireccion = ref('')
const errorCelular = ref('')
const errorPatrocinador = ref('')
let searchTimeout = null

onMounted(async () => {
  const participanteId = route.params.id_participante
  if (!participanteId) {
    console.error("ID de participante no proporcionado en la ruta.")
    router.push('/adminDashboard')
    return
  }
  await cargarParticipante(participanteId)
})

async function cargarParticipante(id) {
  try {
    const [resParticipante, resDocumentos] = await Promise.all([
      // CAMBIO: Usar API_URL
      axios.get(`${API_URL}/api/participantes/${id}`),
      // CAMBIO: Usar API_URL
      axios.get(`${API_URL}/api/documentos?participanteId=${id}`)
    ])

    const dataParticipante = resParticipante.data

    participante.value = {
      ...dataParticipante,
      fecha_nacimiento: dataParticipante.fecha_nacimiento ? new Date(dataParticipante.fecha_nacimiento).toISOString().split('T')[0] : '',
      patrocinador_nombre: dataParticipante.patrocinador_nombre || '',
      patrocinador_apellido_paterno: dataParticipante.patrocinador_apellido_paterno || '',
      patrocinador_apellido_materno: dataParticipante.patrocinador_apellido_materno || '',
      patrocinador_celular: dataParticipante.patrocinador_celular || '',
      patrocinador_correo: dataParticipante.patrocinador_correo || ''
    }

    documentos.value = resDocumentos.data.map(doc => ({
      ...doc,
      nuevoArchivo: null
    }))

    participanteCargado.value = true
  } catch (error) {
    console.error("Error al cargar participante o documentos:", error)
    mensaje.value = 'Error al cargar los datos del participante. Por favor, inténtelo de nuevo.'
    mensajeTipo.value = 'danger'
    participanteCargado.value = true
  }
}

// Buscar y seleccionar patrocinador
async function buscarPatrocinadores() {
  if (busquedaPatrocinador.value.length < 3) {
    resultadosBusqueda.value = []
    return
  }
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(async () => {
    try {
      // CAMBIO: Usar API_URL
      const response = await axios.get(`${API_URL}/api/patrocinadores`, {
        params: {
          busqueda: busquedaPatrocinador.value
        }
      })
      resultadosBusqueda.value = response.data
    } catch (error) {
      console.error('Error al buscar patrocinadores:', error)
      resultadosBusqueda.value = []
    }
  }, 300)
}

function seleccionarPatrocinador(patrocinador) {
  participante.value.id_patrocinador = patrocinador.id_patrocinador
  participante.value.patrocinador_nombre = patrocinador.nombre
  participante.value.patrocinador_apellido_paterno = patrocinador.apellido_paterno || ''
  participante.value.patrocinador_apellido_materno = patrocinador.apellido_materno || ''
  participante.value.patrocinador_celular = patrocinador.celular || ''
  participante.value.patrocinador_correo = patrocinador.correo || ''
  resultadosBusqueda.value = []
  busquedaPatrocinador.value = ''
}

function limpiarBusquedaPatrocinador() {
  busquedaPatrocinador.value = ''
  resultadosBusqueda.value = []
  participante.value.id_patrocinador = null
  participante.value.patrocinador_nombre = ''
  participante.value.patrocinador_apellido_paterno = ''
  participante.value.patrocinador_apellido_materno = ''
  participante.value.patrocinador_celular = ''
  participante.value.patrocinador_correo = ''
}

function validarPatrocinador() {
  if (!participante.value.id_patrocinador) {
    errorPatrocinador.value = 'Debe seleccionar un patrocinador antes de guardar.'
    return false
  }
  errorPatrocinador.value = ''
  return true
}

// Documentos
function agregarDocumento() {
  documentos.value.push({ tipo_documento: '', nuevoArchivo: null, id_documento: null, ruta_archivo: null, nombre_archivo: null })
}

function eliminarDocumento(index) {
  if (documentos.value[index].id_documento) {
    documentosAEliminar.value.push(documentos.value[index].id_documento)
  }
  documentos.value.splice(index, 1)
}

function handleArchivo(e, index) {
  const selected = e.target?.files?.[0]
  if (!selected) return
  const tiposPermitidos = [
    'application/pdf', 'image/jpeg', 'image/png',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
  if (!tiposPermitidos.includes(selected.type)) {
    alert('Tipo de archivo no permitido.')
    e.target.value = ''
    return
  }
  documentos.value[index].nuevoArchivo = selected
  documentos.value[index].ruta_archivo = null
  documentos.value[index].nombre_archivo = selected.name
}

// Foto del participante
function handleFoto(e) {
  const file = e.target.files[0]
  if (!file) {
    nuevaFoto.value = null
    return
  }
  const tiposPermitidos = ['image/jpeg', 'image/png']
  if (!tiposPermitidos.includes(file.type)) {
    alert('Solo se permiten imágenes JPG o PNG.')
    e.target.value = ''
    nuevaFoto.value = null
    return
  }
  nuevaFoto.value = file
  eliminarFotoActual.value = false
}

// Validaciones
function handleCodigoInput(e) {
  let value = e.target.value.toUpperCase()
  if ((value.startsWith('TKC') || value.startsWith('TKE')) && value.length === 3) {
    value += ' '
  }
  if (value.length > 8) {
    value = value.substring(0, 8)
  }
  if (value.length <= 3 && !/^TKC|TKE$/i.test(value)) {
    value = value.replace(/[^TKCtke]/gi, '')
  }
  if (value.length > 4) {
    const prefix = value.substring(0, 4)
    const numbers = value.substring(4).replace(/\D/g, '')
    value = prefix + numbers
  }
  participante.value.codigo = value
}

function validarCodigo() {
  const regex = /^(TKC|TKE)\s\d{4}$/
  if (!regex.test(participante.value.codigo)) {
    errorCodigo.value = 'Formato inválido (ej: TKC 1234)'
    return false
  }
  errorCodigo.value = ''
  return true
}

const validarNombre = () => {
  if (!participante.value.nombre?.trim()) {
    errorNombre.value = 'El nombre es obligatorio.'
    return false
  }
  errorNombre.value = ''
  return true
}

const validarApellidoPaterno = () => {
  if (!participante.value.apellido_paterno?.trim()) {
    errorApellidoPaterno.value = 'El apellido paterno es obligatorio.'
    return false
  }
  errorApellidoPaterno.value = ''
  return true
}

const validarApellidoMaterno = () => {
  if (!participante.value.apellido_materno?.trim()) {
    errorApellidoMaterno.value = 'El apellido materno es obligatorio.'
    return false
  }
  errorApellidoMaterno.value = ''
  return true
}

const departamentosBolivia = ['La Paz', 'Cochabamba', 'Santa Cruz', 'Oruro', 'Potosí', 'Tarija', 'Chuquisaca', 'Beni', 'Pando']

const validarDireccion = () => {
  const direccionValue = participante.value.direccion.trim()
  const contieneDepartamento = departamentosBolivia.some(d => direccionValue.includes(d))
  const regex = /^(Calle|Av\.|Avenida|Pasaje|Plaza|Barrio|Zona)\s.+/i

  if (!contieneDepartamento) {
    errorDireccion.value = `Debe incluir un departamento válido: ${departamentosBolivia.join(', ')}`
    return false
  }

  if (!regex.test(direccionValue)) {
    errorDireccion.value = 'Formato: Tipo de vía + Nombre + Número + Departamento'
    return false
  }

  errorDireccion.value = ''
  return true
}

function formatearCelular(e) {
  let value = e.target.value.replace(/\D/g, '')
  if (value.length > 8) value = value.substring(0, 8)
  participante.value.celular = value
}

function validarCelular() {
  const value = participante.value.celular
  const regex = /^[67]\d{7}$/
  if (!regex.test(value)) {
    errorCelular.value = 'Debe tener 8 dígitos y empezar con 6 o 7.'
    return false
  }
  errorCelular.value = ''
  return true
}

// ACTUALIZAR PARTICIPANTE
async function actualizarParticipante() {
  mensaje.value = ''
  mensajeTipo.value = ''
  errorCodigo.value = ''
  errorNombre.value = ''
  errorApellidoPaterno.value = ''
  errorApellidoMaterno.value = ''

  const esValido = validarCodigo() && validarNombre() && validarApellidoPaterno() && validarApellidoMaterno() && validarDireccion() && validarCelular()
  const esValidoPatrocinador = validarPatrocinador()

  if (!esValido || !esValidoPatrocinador) {
    mensaje.value = 'Por favor, corrija los campos marcados.'
    mensajeTipo.value = 'danger'
    return
  }

  try {
    const id_participante = participante.value.id_participante
    const id_usuario = JSON.parse(localStorage.getItem('usuario') || '{}').id
    if (!id_usuario) throw new Error('No se encontró el ID de usuario.')

    // Participante
    const formData = new FormData()
    formData.append('codigo', participante.value.codigo)
    formData.append('nombre', participante.value.nombre)
    formData.append('apellido_paterno', participante.value.apellido_paterno || '')
    formData.append('apellido_materno', participante.value.apellido_materno || '')
    formData.append('CI', participante.value.CI)
    formData.append('fecha_nacimiento', participante.value.fecha_nacimiento)
    formData.append('direccion', participante.value.direccion)
    formData.append('celular', participante.value.celular)
    formData.append('id_patrocinador', participante.value.id_patrocinador || null)

    if (nuevaFoto.value) {
      formData.append('foto', nuevaFoto.value)
    } else if (eliminarFotoActual.value) {
      formData.append('mantener_foto', 'false')
    }

    // CAMBIO: Usar API_URL
    await axios.put(`${API_URL}/api/participantes/${id_participante}`, formData)

    // Eliminar documentos
    const deletePromises = documentosAEliminar.value.map(docId =>
      // CAMBIO: Usar API_URL
      axios.delete(`${API_URL}/api/documentos/${docId}`)
    )
    await Promise.all(deletePromises)
    documentosAEliminar.value = []

    // Agregar o actualizar documentos
    const documentPromises = []
    for (const doc of documentos.value) {
      const docForm = new FormData()
      docForm.append('tipo_documento', doc.tipo_documento)
      docForm.append('id_participante', id_participante)
      docForm.append('id_usuario', id_usuario)

      if (doc.nuevoArchivo) {
        docForm.append('archivo', doc.nuevoArchivo)
        if (doc.id_documento) {
          // CAMBIO: Usar API_URL
          documentPromises.push(axios.put(`${API_URL}/api/documentos/${doc.id_documento}`, docForm))
        } else {
          // CAMBIO: Usar API_URL
          documentPromises.push(axios.post(`${API_URL}/api/documentos`, docForm))
        }
      } else if (doc.id_documento) {
        // CAMBIO: Usar API_URL
        documentPromises.push(axios.put(`${API_URL}/api/documentos/${doc.id_documento}`, {
          tipo_documento: doc.tipo_documento,
          id_participante,
          id_usuario
        }))
      }
    }
    await Promise.all(documentPromises)

    mensaje.value = 'Participante y documentos actualizados correctamente.'
    mensajeTipo.value = 'success'

    await cargarParticipante(id_participante)
    nuevaFoto.value = null
    eliminarFotoActual.value = false

  } catch (err) {
    console.error("Error al actualizar:", err)
    if (err.response?.status === 409) {
      errorCodigo.value = err.response.data.error
      mensaje.value = 'Por favor, corrija los campos marcados.'
      mensajeTipo.value = 'danger'
    } else {
      mensaje.value = 'Error al actualizar participante. ' + (err.response?.data?.mensaje || err.message)
      mensajeTipo.value = 'danger'
    }
  }
}

function volver() {
  router.push('/adminDashboard')
}
</script>


<style scoped>
/* Mantener los estilos existentes */
.container {
  max-width: 900px;
  background-color: var(--tukuypacha-card-bg);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 2rem;
}

h3.admin-main-title {
  color: var(--tukuypacha-accent);
  font-weight: 700;
  font-size: 1.8rem;
  margin-bottom: 2rem;
  text-align: center;
}

.admin-section-title {
  color: var(--tukuypacha-dark-text);
  font-weight: 600;
  font-size: 1.4rem;
  margin-top: 1rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid var(--tukuypacha-border-color);
  padding-bottom: 0.5rem;
}

.form-label {
  font-weight: 500;
  color: var(--tukuypacha-dark-text);
  margin-bottom: 0.4rem;
}

.admin-input,
.admin-select {
  border-radius: 5px;
  border: 1px solid var(--tukuypacha-border-color);
  padding: 0.6rem 1rem;
  font-size: 1rem;
  font-weight: 400;
  color: var(--tukuypacha-dark-text);
  font-family: 'Poppins', sans-serif;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.admin-input:focus,
.admin-select:focus {
  border-color: var(--tukuypacha-accent);
  box-shadow: 0 0 0 0.25rem rgba(240, 90, 48, 0.2);
  outline: none;
}

.admin-btn-success {
  background-color: var(--tukuypacha-success);
  border-color: var(--tukuypacha-success);
  color: #fff;
  font-weight: 500;
  border-radius: 5px;
  padding: 0.75rem 1.5rem;
  transition: background-color 0.2s ease, opacity 0.2s ease;
}
.admin-btn-success:hover {
  background-color: #218838;
  border-color: #1e7e34;
  opacity: 0.9;
}

.admin-btn-secondary {
  background-color: var(--tukuypacha-secondary-btn);
  border-color: var(--tukuypacha-secondary-btn);
  color: #fff;
  font-weight: 500;
  border-radius: 5px;
  padding: 0.75rem 1.5rem;
  transition: background-color 0.2s ease, opacity 0.2s ease;
}
.admin-btn-secondary:hover {
  background-color: #5a6268;
  border-color: #545b62;
  opacity: 0.9;
}

.admin-btn-outline {
  background-color: transparent;
  border: 1px solid var(--tukuypacha-accent);
  color: var(--tukuypacha-accent);
  font-weight: 500;
  border-radius: 5px;
  padding: 0.75rem 1.5rem;
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.admin-btn-outline:hover {
  background-color: var(--tukuypacha-accent);
  color: #fff;
  border-color: var(--tukuypacha-accent);
}

.btn-danger {
  background-color: #dc3545;
  border-color: #dc3545;
  color: #fff;
  font-weight: 500;
  border-radius: 5px;
  padding: 0.5rem 1rem;
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

.form-check {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.form-check-input {
  width: 1.25rem;
  height: 1.25rem;
}
.form-check-label {
  margin-bottom: 0;
}
</style>