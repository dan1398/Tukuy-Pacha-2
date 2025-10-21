<template>
  <div class="container py-4">
    <h3 class="admin-main-title">Registrar Nuevo Participante</h3>
    <form @submit.prevent="registrarParticipante" enctype="multipart/form-data" class="row g-3">
      
      <div class="col-md-4 mb-3">
        <label class="form-label">Código</label>
        <input 
          v-model="codigo" 
          type="text" 
          class="form-control admin-input" 
          placeholder="Ej: TKC 0005 o TKE 1234"
          required 
          @blur="validarCodigo"
          @input="handleCodigoInput"
        />
        <small class="text-muted">Para niños, niñas y adolescentes es TKC, Para adultos mayores es TKE</small>
        <div v-if="errorCodigo" class="text-danger small mt-1">{{ errorCodigo }}</div>
        <div v-if="erroresServidor.codigo" class="text-danger small mt-1">{{ erroresServidor.codigo }}</div>
      </div>
      
      <div class="col-md-4 mb-3">
        <label class="form-label">Nombre</label>
        <input v-model="nombre" type="text" class="form-control admin-input" name="nombre" required />
        <div v-if="erroresServidor.nombre" class="text-danger small mt-1">{{ erroresServidor.nombre }}</div>
      </div>
      
      <div class="col-md-4 mb-3">
        <label class="form-label">Apellido Paterno</label>
        <input v-model="apellidoPaterno" type="text" class="form-control admin-input" name="apellido_paterno" />
        <div v-if="erroresServidor.apellido_paterno" class="text-danger small mt-1">{{ erroresServidor.apellido_paterno }}</div>
      </div>
      
      <div class="col-md-4 mb-3">
        <label class="form-label">Apellido Materno</label>
        <input v-model="apellidoMaterno" type="text" class="form-control admin-input" name="apellido_materno" />
        <div v-if="erroresServidor.apellido_materno" class="text-danger small mt-1">{{ erroresServidor.apellido_materno }}</div>
      </div>
      
      <div class="col-12 mb-3">
        <label class="form-label">Foto</label>
        <input type="file" name="foto" class="form-control admin-input" @change="handleFoto" accept="image/jpeg,image/png" required />
        <div v-if="erroresServidor.foto" class="text-danger small mt-1">{{ erroresServidor.foto }}</div>
      </div>
      
      <div class="col-md-4 mb-3">
        <label class="form-label">Cedula de Identidad</label>
        <input v-model="ci" type="text" name="ci" class="form-control admin-input" placeholder="Ej: 8724526" required />
        <div v-if="erroresServidor.CI" class="text-danger small mt-1">{{ erroresServidor.CI }}</div>
      </div>

      <div class="col-md-4 mb-3">
        <label class="form-label">Fecha de Nacimiento</label>
        <input v-model="fechaNacimiento" type="date" class="form-control admin-input" name="fechaNacimiento" required />
        <div v-if="erroresServidor.fecha_nacimiento" class="text-danger small mt-1">{{ erroresServidor.fecha_nacimiento }}</div>
      </div>
      
      <div class="col-md-4 mb-3">
        <label class="form-label">Dirección (Bolivia)</label>
        <input 
          v-model="direccion" 
          type="text" 
          class="form-control admin-input" 
          placeholder="Ej: Av. Arce 1234, La Paz"
          required 
          @blur="validarDireccion"
          list="departamentos"
          name="direccion"
        />
        <datalist id="departamentos">
          <option v-for="depto in departamentosBolivia" :key="depto" :value="depto"></option>
        </datalist>
        <small class="text-muted">Debe incluir un departamento boliviano: {{ departamentosBolivia.join(', ') }}</small>
        <div v-if="errorDireccion" class="text-danger small mt-1">{{ errorDireccion }}</div>
        <div v-if="erroresServidor.direccion" class="text-danger small mt-1">{{ erroresServidor.direccion }}</div>
      </div>
      
      <div class="col-md-4 mb-3">
        <label class="form-label">Celular</label>
        <input 
          v-model="celular" 
          type="text" 
          class="form-control admin-input" 
          @input="formatearCelular"
          @blur="validarCelular"
          placeholder="Ej: 78765432"
          name="celular"
          required 
        />
        <small class="text-muted">Formato: 7XXXXXXX o 6XXXXXXX (8 dígitos)</small>
        <div v-if="errorCelular" class="text-danger small mt-1">{{ errorCelular }}</div>
        <div v-if="erroresServidor.celular" class="text-danger small mt-1">{{ erroresServidor.celular }}</div>
      </div>

      <div class="col-md-6 mb-3">
        <label class="form-label">Buscar Patrocinador</label>
        <div class="input-group">
          <input 
            v-model="busquedaPatrocinador" 
            type="text" 
            class="form-control admin-input" 
            placeholder="Buscar por nombre..."
            name="busquedaPatrocinador"
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
        <div v-if="erroresServidor.id_patrocinador" class="text-danger small mt-1">{{ erroresServidor.id_patrocinador }}</div>
      </div>

      <div class="col-md-6 mb-3">
        <label class="form-label">Nombre del Patrocinador</label>
        <input 
          v-model="nombrePatrocinador" 
          type="text" 
          class="form-control admin-input" 
          name="nombrePatrocinador"
          readonly
        />
      </div>

      <div class="col-md-6 mb-3">
        <label class="form-label">Apellido Paterno</label>
        <input 
          v-model="apellidoPaternoPatrocinador" 
          type="text" 
          class="form-control admin-input" 
          name="apellidoPaternoPatrocinador"
          readonly
        />
      </div>

      <div class="col-md-6 mb-3">
        <label class="form-label">Apellido Materno</label>
        <input 
          v-model="apellidoMaternoPatrocinador" 
          type="text" 
          class="form-control admin-input" 
          name="apellidoMaternoPatrocinador"
          readonly
        />
      </div>

      <div class="col-md-6 mb-3">
        <label class="form-label">Celular</label>
        <input 
          v-model="celularPatrocinador" 
          type="text" 
          class="form-control admin-input" 
          name="celularPatrocinador"
          readonly
        />
      </div>

      <div class="col-md-6 mb-3">
        <label class="form-label">Correo Electronico</label>
        <input 
          v-model="correoPatrocinador" 
          type="text" 
          class="form-control admin-input" 
          name="correoPatrocinador"
          readonly
        />
      </div>
      
      <div class="col-12 mb-3">
        <h5 class="admin-section-title">Documentos Acompañados</h5>
      </div>

      <div class="col-md-12 mb-3" v-for="(doc, index) in documentos" :key="index">
        <div class="row g-2 align-items-end">
          <div class="col-md-5">
            <label class="form-label">Tipo de Documento</label>
            <select v-model="doc.tipo" class="form-select admin-select" name="tipoDocumento" required>
              <option value="">Seleccione un tipo</option> 
              <option value="Formulario">Formulario</option>
              <option value="Correspondencia">Correspondencia</option>
              <option value="Especial">Especial</option>
              <option value="Salud">Salud</option>
              <option value="Educacion">Educación</option>
            </select>
            <div v-if="erroresServidor[`documento_${index}_tipo`]" class="text-danger small mt-1">{{ erroresServidor[`documento_${index}_tipo`] }}</div>
          </div>
          <div class="col-md-5">
            <label class="form-label">Archivo</label>
            <input type="file" name="archivoDocumento" class="form-control admin-input" @change="(event) => handleArchivo(event, index)" accept=".pdf,.jpg,.jpeg,.png,.xls,.xlsx" required />
            <div v-if="erroresServidor[`documento_${index}_archivo`]" class="text-danger small mt-1">{{ erroresServidor[`documento_${index}_archivo`] }}</div>
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

// --- DEFINICIÓN DE LA URL DE LA API DE RENDER ---
const API_URL = 'http://localhost:3000';
// --------------------------------------------------

const router = useRouter()
const codigo = ref('')
const nombre = ref('')
const apellidoPaterno = ref('')
const apellidoMaterno = ref('')
const ci = ref('')
const fechaNacimiento = ref('')
const direccion = ref('')
const foto = ref(null)
const documentos = ref([{ tipo: '', archivo: null }])
const mensaje = ref('')
const mensajeTipo = ref('')

const errorCodigo = ref('')
const errorDireccion = ref('')
const celular = ref('')
const errorCelular = ref('')

const erroresServidor = ref({}) 

const busquedaPatrocinador = ref('')
const resultadosBusqueda = ref([])
const nombrePatrocinador = ref('')
const apellidoPaternoPatrocinador = ref('')
const apellidoMaternoPatrocinador = ref('')
const celularPatrocinador = ref('')
const correoPatrocinador = ref('')
const idPatrocinador = ref(null)

// --- Funciones de manejo de campos y validación local (sin cambios) ---

function handleCodigoInput(e) {
  let value = e.target.value.toUpperCase()
  
  if ((value.startsWith('TKC') || value.startsWith('TKE')) && value.length === 3) {
    value = value + ' '
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
  
  codigo.value = value
}

function validarCodigo() {
  const regex = /^(TKC|TKE)\s\d{4}$/
  if (!regex.test(codigo.value)) {
    errorCodigo.value = 'Formato inválido. Debe ser TKC/TKE seguido de 4 dígitos (ej: TKC 2905)'
    return false
  }
  errorCodigo.value = ''
  return true
}

const departamentosBolivia = [
    'La Paz', 'Cochabamba', 'Santa Cruz', 'Oruro', 
    'Potosí', 'Tarija', 'Chuquisaca', 'Beni', 'Pando'
];

const validarDireccion = () => {
    const direccionValue = direccion.value.trim();
    
    const valido = departamentosBolivia.some(depto => 
        direccionValue.includes(depto)
    );
    
    if (!valido) {
        errorDireccion.value = `La dirección debe incluir un departamento boliviano válido: ${departamentosBolivia.join(', ')}`;
        return false;
    }
    
    const regex = /^(Calle|Av\.|Avenida|Avenida|Pasaje|Plaza|Barrio|Zona)\s.+/i;
    if (!regex.test(direccionValue)) {
        errorDireccion.value = 'Formato sugerido: Tipo de vía + Nombre + Número + Departamento (ej: Av. Arce 1234, La Paz)';
        return false;
    }
    
    errorDireccion.value = '';
    return true;
};

function formatearCelular(e) {
  let value = e.target.value
  
  value = value.replace(/\D/g, '')
  
  if (value.length > 8) {
    value = value.substring(0, 8)
  }
  
  celular.value = value
}

function validarCelular() {
  const value = celular.value.trim()
  
  const regex = /^[67]\d{7}$/
  
  if (!regex.test(value)) {
    errorCelular.value = 'Número inválido. Debe tener 8 dígitos y comenzar con 6 o 7.'
    return false
  }
  
  errorCelular.value = ''
  return true
}

// --- Funciones para Patrocinador, Documentos y Foto (sin cambios) ---

async function buscarPatrocinadores() {
  if (busquedaPatrocinador.value.length < 3) {
    resultadosBusqueda.value = []
    return
  }

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
}

function seleccionarPatrocinador(patrocinador) {
  nombrePatrocinador.value = patrocinador.nombre
  apellidoPaternoPatrocinador.value = patrocinador.apellido_paterno || ''
  apellidoMaternoPatrocinador.value = patrocinador.apellido_materno || ''
  celularPatrocinador.value = patrocinador.celular || ''
  correoPatrocinador.value = patrocinador.correo || ''
  idPatrocinador.value = patrocinador.id_patrocinador
  resultadosBusqueda.value = []
  busquedaPatrocinador.value = ''
}

function limpiarBusquedaPatrocinador() {
  busquedaPatrocinador.value = ''
  resultadosBusqueda.value = []
  nombrePatrocinador.value = ''
  apellidoPaternoPatrocinador.value = ''
  apellidoMaternoPatrocinador.value = ''
  celularPatrocinador.value = ''
  correoPatrocinador.value = ''
  idPatrocinador.value = null
}

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
    e.target.value = ''
    documentos.value[index].archivo = null
    return
  }
  documentos.value[index].archivo = selected
}

function handleFoto(e) {
  const file = e.target.files[0]
  if (!file) {
    foto.value = null;
    return
  }
  const tiposPermitidos = ['image/jpeg', 'image/png']
  if (!tiposPermitidos.includes(file.type)) {
    alert('Solo se permiten imágenes JPG o PNG para la foto del participante.')
    e.target.value = ''
    foto.value = null
    return
  }
  foto.value = file
}

// --- FUNCIÓN CLAVE CORREGIDA CON BASE EN EL LOG ---
function procesarErroresServidor(error) {
  erroresServidor.value = {};
  
  let generalErrorMessage = 'Error al registrar. Por favor, revise los datos ingresados.';

  const responseData = error.response?.data;
  
  // 1. Intentar obtener el objeto de errores detallados (si el backend lo envía)
  const erroresDetallados = responseData?.errores;
  if (erroresDetallados && typeof erroresDetallados === 'object') {
    for (const key in erroresDetallados) {
        const clave = (key.toLowerCase() === 'ci') ? 'CI' : key; 
        erroresServidor.value[clave] = erroresDetallados[key];
    }
    return generalErrorMessage;
  }
  
  // 2. BUSCAR EL ERROR ESPECÍFICO EN LA PROPIEDAD 'error' (según el log)
  const serverErrorMsg = responseData?.error;
  
  if (serverErrorMsg) {
      const lowerCaseMsg = serverErrorMsg.toLowerCase();
      
      // Mapear error de código duplicado
      if (lowerCaseMsg.includes('código') && (lowerCaseMsg.includes('existe') || lowerCaseMsg.includes('duplicado') || lowerCaseMsg.includes('unique'))) {
          // Asignar el error al campo 'codigo'
          erroresServidor.value.codigo = serverErrorMsg;
          return 'El **Código del Participante** ya existe. Por favor, use uno diferente.';
      }
      // Mapear error de CI duplicado (por si acaso)
      if (lowerCaseMsg.includes('ci') && (lowerCaseMsg.includes('existe') || lowerCaseMsg.includes('duplicado') || lowerCaseMsg.includes('unique'))) {
          erroresServidor.value.CI = serverErrorMsg;
          return 'La **Cédula de Identidad** ya está registrada.';
      }

      // Si encuentra el error pero no lo puede mapear a un campo, lo devuelve como mensaje general
      return serverErrorMsg;
  }

  // 3. Fallback: Intentar obtener un mensaje simple o devolver el genérico
  return responseData?.mensaje 
         || error.message
         || generalErrorMessage;
}


// --- Función de Registro Principal ---

async function registrarParticipante() {
  mensaje.value = ''
  mensajeTipo.value = ''
  errorCodigo.value = ''
  errorDireccion.value = ''
  errorCelular.value = ''
  erroresServidor.value = {} 

  // 1. Validaciones locales
  if (!validarCodigo() || !validarDireccion() || !validarCelular()) {
    mensaje.value = 'Por favor corrija los campos marcados localmente.'
    mensajeTipo.value = 'danger'
    return
  }
  
  try {
    const formData = new FormData()
    formData.append('codigo', codigo.value) 
    formData.append('nombre', nombre.value)
    formData.append('apellido_paterno', apellidoPaterno.value)
    formData.append('apellido_materno', apellidoMaterno.value)
    formData.append('CI', ci.value) 
    formData.append('fecha_nacimiento', fechaNacimiento.value) 
    formData.append('direccion', direccion.value)
    formData.append('celular', celular.value)
    formData.append('id_patrocinador', idPatrocinador.value);
    if (foto.value) {
      formData.append('foto', foto.value)
    }

    // 2. REGISTRO DEL PARTICIPANTE
    // CAMBIO: Usar API_URL
    const res = await axios.post(`${API_URL}/api/participantes`, formData)
    const id_participante = res.data.id
    
    // Obtener ID de usuario para documentos
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
    const id_usuario = usuario.id

    if (!id_usuario) {
      throw new Error('No se encontró el ID de usuario en el almacenamiento local. Por favor, inicie sesión nuevamente.')
    }
    
    let erroresDocumentosEncontrados = false;
    // 3. REGISTRO DE DOCUMENTOS
    for (let i = 0; i < documentos.value.length; i++) {
      const doc = documentos.value[i]
      if (doc.archivo) {
        const docForm = new FormData()
        docForm.append('archivo', doc.archivo)
        docForm.append('tipo_documento', doc.tipo)
        docForm.append('id_participante', id_participante)
        docForm.append('id_usuario', id_usuario)

        try {
          // CAMBIO: Usar API_URL
          await axios.post(`${API_URL}/api/documentos`, docForm)
        } catch (docError) {
          erroresDocumentosEncontrados = true;
          const docErrorMessage = docError.response?.data?.mensaje 
                                || docError.response?.data?.error
                                || 'Error al subir documento';
          
          if (docErrorMessage.toLowerCase().includes('tipo')) {
             erroresServidor.value[`documento_${i}_tipo`] = docErrorMessage;
          } else if (docErrorMessage.toLowerCase().includes('archivo') || docErrorMessage.toLowerCase().includes('file')) {
             erroresServidor.value[`documento_${i}_archivo`] = docErrorMessage;
          } else {
             console.error(`Error en documento ${i+1}:`, docErrorMessage);
          }
        }
      }
    }
    
    if (erroresDocumentosEncontrados) {
      mensaje.value = 'Participante registrado, pero hubo errores al subir algunos documentos. Por favor, revise los campos marcados.';
      mensajeTipo.value = 'danger';
      return; 
    }

    // Éxito total
    mensaje.value = 'Participante y documentos registrados correctamente. 🎉'
    mensajeTipo.value = 'success'
    
    // Limpiar formulario al éxito
    codigo.value = ''
    nombre.value = ''
    apellidoPaterno.value = ''
    apellidoMaterno.value = ''
    ci.value = ''
    fechaNacimiento.value = ''
    direccion.value = ''
    celular.value = ''
    foto.value = null
    documentos.value = [{ tipo: '', archivo: null }]
    limpiarBusquedaPatrocinador() 

  } catch (err) {
    // 4. MANEJO DE ERROR DEL PARTICIPANTE (El principal)
    
    // El log de diagnóstico se mantiene por si hay otros errores
    console.error('--- ERROR COMPLETO DEL SERVIDOR ---');
    if (err.response) {
        console.error('Data del error:', err.response.data);
        console.error('Status:', err.response.status);
    } else if (err.request) {
        console.error('No se recibió respuesta del servidor.');
    } else {
        console.error('Error al configurar la petición:', err.message);
    }
    console.error('------------------------------------');
    
    const generalErrorMessage = procesarErroresServidor(err);

    if (Object.keys(erroresServidor.value).length > 0) {
      // Si se mapeó el error a un campo (ej: código), mostramos un mensaje que remite al campo.
      mensaje.value = generalErrorMessage || 'Error al registrar. Por favor, corrija los campos marcados con rojo.';
    } else {
      // Si no se mapeó, mostramos el mensaje que pudimos extraer o el genérico.
      mensaje.value = 'Error al registrar participante. Detalles: ' + generalErrorMessage;
    }
    
    mensajeTipo.value = 'danger';
  }
}

function volver() {
  router.push('/adminDashboard')
}
</script>

<style scoped>
.container {
  max-width: 800px;
  background-color: var(--tukuypacha-card-bg, #fff);
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

.admin-btn-success {
  background-color: var(--tukuypacha-accent, #f05a30);
  border-color: var(--tukuypacha-accent, #f05a30);
  color: #fff;
  font-weight: 500;
  border-radius: 5px;
  padding: 0.75rem 1.5rem;
  transition: background-color 0.2s ease, opacity 0.2s ease;
}
.admin-btn-success:hover {
  background-color: var(--tukuypacha-button-bg);
  border-color: var(--tukuypacha-button-bg);
  opacity: 0.9;
}

.admin-btn-secondary {
  background-color: var(--tukuypacha-danger);
  border-color: var(--tukuypacha-danger);
  color: #fff;
  font-weight: 500;
  border-radius: 5px;
  padding: 0.75rem 1.5rem;
  transition: background-color 0.2s ease, opacity 0.2s ease;
}
.admin-btn-secondary:hover {
  background-color:var(--tukuypacha-danger);
  border-color: var(--tukuypacha-danger);
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

.btn-danger {
  background-color: #dc3545;
  border-color: #dc3545;
  color: #fff;
  font-weight: 500;
  border-radius: 5px;
  padding: 0.7rem 1rem;
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

.list-group {
  max-height: 200px;
  overflow-y: auto;
  position: absolute;
  width: 17%;
  z-index: 1000;
}

.list-group-item {
  cursor: pointer;
}

.list-group-item:hover {
  background-color: #f8f9fa;
}
</style>