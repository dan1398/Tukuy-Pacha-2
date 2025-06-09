<template>
  <div class="d-flex">
    <!-- Sidebar -->
    <div class="bg-light border-end p-3" style="width: 220px; min-height: 100vh">
      <img :src="logo" alt="Logo" class="img-fluid mb-4" />
      <div class="mb-2">Perfil: {{ usuario.rol }}</div>
      <div class="mb-2">{{ usuario.nombre }}</div>
      <button class="btn btn-outline-danger w-100" @click="cerrarSesion">Cerrar sesión</button>
    </div>

    <!-- Main Content -->
    <div class="flex-grow-1 p-4">
      <div class="d-flex align-items-center gap-2 mb-4">
        <input v-model="busquedaId" type="text" placeholder="Buscar por Codigo" class="form-control w-50 me-2" />
        <button class="btn btn-primary" @click="buscarParticipante">Buscar</button>
        <button class="btn btn-primary" @click="router.push('/nuevo-participante')">Nuevo</button>
      </div>

      <!-- Participante encontrado -->
      <div v-if="participante" class="card mb-4">
        <div class="card-body">
          <h5 class="card-title">Participante: {{ participante.nombre }}</h5>
          <div v-if="participante.foto">
            <img :src="`http://localhost:3000/uploads/${participante.foto}`" alt="Foto del participante" class="img-fluid mb-3" style="max-height: 150px; object-fit: cover;" />
          </div>
          <p><strong>Código:</strong> {{ participante.codigo }}</p>
          <p><strong>CI:</strong> {{ participante.CI }}</p>
          <p><strong>Fecha de nacimiento:</strong> {{ new Date(participante.fecha_nacimiento).toLocaleDateString() }}</p>
          <p><strong>Dirección:</strong> {{ participante.direccion }}</p>
          <p><strong>Celular:</strong> {{ participante.celular }}</p>
          <p><strong>Nombre del patrocinador:</strong> {{ participante.nombre_patrocinador }}</p>
          <p><strong>Contacto:</strong> {{ participante.contacto }}</p>
        </div>
      </div>

      <!-- Documentos -->
      <div v-if="documentos && documentos.length">
        <h5>Documentos</h5>
        <ul class="list-group">
          <li
            class="list-group-item d-flex justify-content-between align-items-start"
            v-for="doc in documentos"
            :key="doc.id_documento"
          >
            <div>
              <div><strong>Archivo:</strong> {{ doc.nombre_archivo }}</div>
              <div><strong>Tipo:</strong> {{ doc.tipo_documento }}</div>
              <div>
                <strong>Fecha de subida:</strong>
                {{ new Date(doc.fecha_subida).toLocaleDateString() }}
              </div>
            </div>
            <div class="btn-group btn-group-sm">
              <a
                v-if="!doc.ruta_archivo.endsWith('.xls') && !doc.ruta_archivo.endsWith('.xlsx')"
                :href="`http://localhost:3000/uploads/${doc.ruta_archivo}`"
                target="_blank"
                class="btn btn-outline-primary"
              >
                Ver
              </a>
              <a
                :href="`http://localhost:3000/api/documentos/download/${doc.ruta_archivo}`"
                class="btn btn-outline-success"
              >Descargar</a>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import logo from '../images/logo-top2.png';

const router = useRouter()
const usuario = ref({})
const busquedaId = ref('')
const participante = ref(null)
const documentos = ref([])

onMounted(() => {
  const userData = localStorage.getItem('usuario')
  if (!userData) {
    router.push('/login')
  } else {
    usuario.value = JSON.parse(userData)
  }
})

const cerrarSesion = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('usuario')
  localStorage.clear()
  router.push('/login')
}

const buscarParticipante = async () => {
  if (!busquedaId.value.trim()) {
    participante.value = null
    documentos.value = []
    return
  }
  try {
    const res = await axios.get(
      `http://localhost:3000/api/participantes?codigo=${busquedaId.value}`
    )
    if (res.data.length > 0) {
      const encontrado = res.data[0]
      participante.value = encontrado

      const docRes = await axios.get(
        `http://localhost:3000/api/documentos?participanteId=${encontrado.id_participante}`
      )
      documentos.value = docRes.data
    } else {
      participante.value = null
      documentos.value = []
    }
  } catch (err) {
    console.error('Error en buscarParticipante:', err)
  }
}
</script>

<style scoped>
img {
  max-height: 80px;
}
</style>
