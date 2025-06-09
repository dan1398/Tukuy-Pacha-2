<template>
  <div class="d-flex">
    <!-- Sidebar -->
    <div class="bg-light border-end p-3" style="width: 220px; min-height: 100vh">
      <img :src="logo" alt="Logo" class="img-fluid mb-4" />
      <div class="mb-2">Perfil: {{ usuario.rol }}</div>
      <div class="mb-2">{{ usuario.nombre }}</div>
      <button class="btn btn-outline-primary w-100 mb-2" @click="irARegistrar">Registrar</button>
      <button class="btn btn-outline-secondary w-100 mb-2" @click="mostrarUsuarios = true">Mostrar Usuarios</button>
      <button class="btn btn-outline-danger w-100" @click="cerrarSesion">Cerrar sesión</button>
    </div>

    <!-- Main Content -->
    <div class="flex-grow-1 p-4">
      <div class="d-flex align-items-center gap-2 mb-4">
        <input v-model="busquedaId" type="text" placeholder="Buscar por Codigo" class="form-control w-50 me-2" />
        <button class="btn btn-primary" @click="buscarParticipante">Buscar</button>
        <button class="btn btn-primary" @click="router.push('/nuevo-participante')">Nuevo</button>
      </div>
        <!-- Espacio donde se mostrarán los detalles del participante -->
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

    <!-- Espacio donde se mostrarán los documentos relacionados con el participante -->
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
  

    <!-- Modal de Usuarios -->
    <div class="modal fade show" tabindex="-1" style="display: block" v-if="mostrarUsuarios">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Lista de Usuarios</h5>
            <button type="button" class="btn-close" @click="mostrarUsuarios = false"></button>
          </div>
          <div class="modal-body">
            <table class="table table-striped">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Contraseña</th>
                  <th>Rol</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="u in usuarios" :key="u.id_usuario">
                  <td>{{ u.id_usuario }}</td>
                  <td>
                    <input v-if="editandoId === u.id_usuario" v-model="u.nombre" class="form-control form-control-sm" />
                    <span v-else>{{ u.nombre }}</span>
                  </td>
                  <td>
                    <input v-if="editandoId === u.id_usuario" v-model="u.correo" class="form-control form-control-sm" />
                    <span v-else>{{ u.correo }}</span>
                  </td>
                  <td>
                    <input v-if="editandoId === u.id_usuario" type="text" v-model="u.contraseña" class="form-control form-control-sm" />
                    <span v-else>••••••••</span>
                  </td>
                  <td>
                    <select v-if="editandoId === u.id_usuario" v-model="u.rol" class="form-select form-select-sm">
                      <option value="Admin">Admin</option>
                      <option value="Personal">Personal</option>
                    </select>
                    <span v-else>{{ u.rol }}</span>
                  </td>
                  <td>
                    <button class="btn btn-sm btn-outline-primary me-1" v-if="editandoId !== u.id_usuario" @click="editandoId = u.id_usuario">Editar</button>
                    <button class="btn btn-sm btn-success me-1" v-else @click="guardarCambios(u)">Guardar</button>
                    <button class="btn btn-sm btn-outline-danger" @click="eliminarUsuarioLocal(u.id_usuario)">Eliminar</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="mostrarUsuarios = false">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import logo from '../images/logo-top2.png';



const router = useRouter()
const usuario = ref({})
const busquedaId = ref('')
const participante = ref(null)
const documentos = ref([])
const mostrarUsuarios = ref(false)
const usuarios = ref([])
const editandoId = ref(null)

onMounted(() => {
  const userData = localStorage.getItem('usuario')
  if (!userData) {
    router.push('/login')
  } else {
    usuario.value = JSON.parse(userData)
  }
})

watch(mostrarUsuarios, async (value) => {
  if (value) {
    try {
      const res = await axios.get('http://localhost:3000/api/usuarios')
      usuarios.value = res.data
    } catch (err) {
      console.error('Error al cargar usuarios:', err)
    }
  }
})

const eliminarUsuarioLocal = async (id) => {
  const confirmar = confirm('¿Estás seguro de eliminar este usuario?')
  if (!confirmar) return

  try {
    await axios.delete(`http://localhost:3000/api/usuarios/${id}`)
    usuarios.value = usuarios.value.filter(u => u.id_usuario !== id)
    if (editandoId.value === id) editandoId.value = null
    console.log('Usuario eliminado de la base de datos')
  } catch (err) {
    console.error('Error al eliminar usuario:', err)
    alert('No se pudo eliminar el usuario')
  }
}

const guardarCambios = async (usuarioEditado) => {
  try {
    await axios.put(`http://localhost:3000/api/usuarios/${usuarioEditado.id_usuario}`, {
      nombre: usuarioEditado.nombre,
      correo: usuarioEditado.correo,
      contraseña: usuarioEditado.contraseña,
      rol: usuarioEditado.rol
    })
    console.log('Cambios guardados en la base de datos')
  } catch (err) {
    console.error('Error al guardar cambios:', err)
    alert('No se pudieron guardar los cambios')
  } finally {
    editandoId.value = null
  }
}

const cerrarSesion = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('usuario')
  localStorage.clear() // opcional: borra todo
  router.push('/login')
}

const irARegistrar = () => {
  router.push('/registrar')
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

      // Aquí debugueamos la llamada a documentos
      const docRes = await axios.get(
        `http://localhost:3000/api/documentos?participanteId=${encontrado.id_participante}`
      )
      console.log('📄 documentos recibidos:', docRes.data)
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
.modal {
  background-color: rgba(0, 0, 0, 0.5);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1050;
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
