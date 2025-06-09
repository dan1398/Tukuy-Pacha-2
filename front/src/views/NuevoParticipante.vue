<template>
  <div class="container py-4">
    <h3>Registrar Nuevo Participante</h3>
    <form @submit.prevent="registrarParticipante" enctype="multipart/form-data" class="row g-3">
      <div class="col-md-4">
        <label class="form-label">Código</label>
        <input v-model="codigo" type="text" class="form-control" required />
      </div>
      <div class="col-md-4">
        <label class="form-label">Nombre</label>
        <input v-model="nombre" type="text" class="form-control" required />
      </div>
      <div class="col-12">
        <label class="form-label">Foto</label>
        <input type="file" name="foto" class="form-control" @change="handleFoto" accept="image/jpeg,image/png" required />
      </div>
      <div class="col-md-4">
        <label class="form-label">CI</label>
        <input v-model="ci" type="text" class="form-control" required />
      </div>

      <div class="col-md-4">
        <label class="form-label">Fecha de Nacimiento</label>
        <input v-model="fechaNacimiento" type="date" class="form-control" required />
      </div>
      <div class="col-md-4">
        <label class="form-label">Dirección</label>
        <input v-model="direccion" type="text" class="form-control" required />
      </div>
      <div class="col-md-4">
        <label class="form-label">Celular</label>
        <input v-model="celular" type="text" class="form-control" required />
      </div>

      <div class="col-md-6">
        <label class="form-label">Nombre del Patrocinador</label>
        <input v-model="nombrePatrocinador" type="text" class="form-control" required />
      </div>
      <div class="col-md-6">
        <label class="form-label">Contacto del Patrocinador</label>
        <input v-model="contacto" type="text" class="form-control" required />
      </div>

      <div class="col-12">
        <h5>Documentos Acompañados</h5>
      </div>

      <div class="col-md-12" v-for="(doc, index) in documentos" :key="index">
        <div class="row g-2 align-items-end">
          <div class="col-md-5">
            <label class="form-label">Tipo de Documento</label>
            <select v-model="doc.tipo" class="form-select" required>
              <option value="Formulario">Formulario</option>
              <option value="Correspondencia">Correspondencia</option>
              <option value="Especial">Especial</option>
              <option value="Salud">Salud</option>
              <option value="Educacion">Educación</option>
            </select>
          </div>
          <div class="col-md-5">
            <label class="form-label">Archivo</label>
            <input type="file" class="form-control" @change="(event) => handleArchivo(event, index)" accept=".pdf,.jpg,.jpeg,.png,.xls,.xlsx" required />
          </div>
          <div class="col-md-2">
            <button type="button" class="btn btn-danger w-100" @click="eliminarDocumento(index)">Eliminar</button>
          </div>
        </div>
      </div>

      <div class="col-12">
        <button type="button" class="btn btn-outline-primary" @click="agregarDocumento">+ Añadir Documento</button>
      </div>

      <div class="col-12">
        <button type="submit" class="btn btn-success">Registrar</button>
        <button type="button" class="btn btn-secondary ms-2" @click="volver">Cancelar</button>
      </div>

      <div v-if="mensaje" class="alert alert-info mt-3">{{ mensaje }}</div>
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
const documentos = ref([{ tipo: '', archivo: null }])
const mensaje = ref('')

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
    alert('Tipo de archivo no permitido')
    e.target.value = ''
    return
  }
  documentos.value[index].archivo = selected
}

function handleFoto(e) {
  const file = e.target.files[0]
  if (!file) return
  const tiposPermitidos = ['image/jpeg', 'image/png']
  if (!tiposPermitidos.includes(file.type)) {
    alert('Solo se permiten imágenes JPG o PNG')
    e.target.value = ''
    return
  }
  foto.value = file
}

async function registrarParticipante() {
  try {
    const formData = new FormData()
    formData.append('codigo', codigo.value)
    formData.append('nombre', nombre.value)
    formData.append('CI', ci.value)
    formData.append('fecha_nacimiento', fechaNacimiento.value)
    formData.append('direccion', direccion.value)
    formData.append('celular', celular.value)
    formData.append('nombre_patrocinador', nombrePatrocinador.value)
    formData.append('contacto', contacto.value)
    if (foto.value) {
      formData.append('foto', foto.value)
    }

    // Quitar el header manual para que Axios genere el boundary
    const res = await axios.post('http://localhost:3000/api/participantes', formData)
    const id_participante = res.data.id
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
    const id_usuario = usuario.id

    if (!id_usuario) {
      throw new Error('No se encontró id_usuario en localStorage')
    }


    for (const doc of documentos.value) {
      const docForm = new FormData()
      docForm.append('archivo', doc.archivo)
      docForm.append('tipo_documento', doc.tipo)
      docForm.append('id_participante', id_participante)
      docForm.append('id_usuario', id_usuario)

      await axios.post('http://localhost:3000/api/documentos', docForm)
    }

    codigo.value = ''
    nombre.value = ''
    ci.value = ''
    fechaNacimiento.value = ''
    direccion.value = ''
    celular.value = ''
    nombrePatrocinador.value = ''
    contacto.value = ''
    foto.value = null
    documentos.value = [{ tipo: '', archivo: null }]


    mensaje.value = 'Participante y documentos registrados correctamente'
    codigo.value = nombre.value = ci.value = fechaNacimiento.value = direccion.value = celular.value = nombrePatrocinador.value = contacto.value = ''
    foto.value = null
    documentos.value = [{ tipo: '', archivo: null }]
  } catch (err) {
    console.error(err)
    mensaje.value = 'Error al registrar participante o documentos'
  }
}

function volver() {
  router.push('/adminDashboard')
}
</script>

<style scoped>
.container {
  max-width: 800px;
}
</style>
