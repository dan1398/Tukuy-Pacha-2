<template>
  <div class="admin-dashboard-wrapper d-flex">
    <div class="admin-sidebar border-end p-3 d-flex flex-column">
      <img :src="logo" alt="Logo" class="img-fluid mb-4 admin-logo" />

      <div class="sidebar-profile-info mb-4">
        <div class="user-name">{{ usuario.nombre }}</div>
        <div class="user-role">Perfil: {{ usuario.rol }}</div>
      </div>

      <div class="sidebar-buttons flex-grow-1 d-flex flex-column">
        <button class="btn-tukuypacha-sidebar w-100 mb-2" @click="irARegistrar">Registrar Nuevo</button>
        <button class="btn-tukuypacha-sidebar w-100 mb-auto" @click="mostrarUsuarios = true">Gestionar Usuarios</button>
        <button class="btn btn-tukuypacha-danger w-100 mt-2" @click="cerrarSesion">Cerrar Sesión</button>
      </div>
    </div>

    <div class="flex-grow-1 p-4 admin-main-content">
      <h1 class="mb-4 admin-main-title">Panel de Administración</h1>

      <div class="card shadow-sm mb-4 admin-card">
        <div class="card-header admin-card-header">
          <h5>Buscar Participante</h5>
        </div>
        <div class="card-body">
          <div class="input-group mb-3">
            <input v-model="busquedaId" type="text" placeholder="Buscar por Código" class="form-control admin-input" />
            <button class="btn-tukuypacha" @click="buscarParticipante">Buscar</button>
            <button
              class="ms-2"
              :class="participante ? 'btn-tukuypacha-outline' : 'btn-tukuypacha'"
              @click="participante ? irAEditarParticipante(participante.id_participante) : router.push('/nuevo-participante')"
            >
              {{ participante ? 'Editar Participante' : 'Nuevo Participante' }}
            </button>
          </div>

          <div v-if="participante" class="card mt-4 participant-card">
            <div class="card-body">
              <h5 class="card-title participant-title">{{ participante.nombre }}</h5>
              <div v-if="participante.foto" class="text-center mb-3">
                <img :src="`http://localhost:3000/uploads/${participante.foto}`" alt="Foto del participante" class="img-thumbnail participant-photo" />
              </div>
              <div class="row">
                <div class="col-md-6"><p><strong>Código:</strong> {{ participante.codigo }}</p></div>
                <div class="col-md-6"><p><strong>CI:</strong> {{ participante.CI }}</p></div>
                <div class="col-md-6"><p><strong>Fecha de nacimiento:</strong> {{ new Date(participante.fecha_nacimiento).toLocaleDateString() }}</p></div>
                <div class="col-md-6"><p><strong>Dirección:</strong> {{ participante.direccion }}</p></div>
                <div class="col-md-6"><p><strong>Celular:</strong> {{ participante.celular }}</p></div>
                <div class="col-md-6"><p><strong>Patrocinador:</strong> {{ participante.nombre_patrocinador }}</p></div>
                <div class="col-md-6"><p><strong>Contacto Patrocinador:</strong> {{ participante.contacto }}</p></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="documentos && documentos.length" class="card shadow-sm mb-4 admin-card">
        <div class="card-header admin-card-header">
          <h5>Documentos Relacionados</h5>
        </div>
        <div class="card-body">
          <ul class="list-group list-group-flush admin-list-group">
            <li
              class="list-group-item d-flex justify-content-between align-items-start admin-list-item"
              v-for="doc in documentos"
              :key="doc.id_documento"
            >
              <div>
                <div class="doc-file-name"><strong>Archivo:</strong> {{ doc.nombre_archivo }}</div>
                <div class="text-muted small"><strong>Tipo:</strong> {{ doc.tipo_documento }}</div>
                <div class="text-muted small">
                  <strong>Fecha de subida:</strong>
                  {{ new Date(doc.fecha_subida).toLocaleDateString() }}
                </div>
              </div>
              <div class="btn-group btn-group-sm">
                <a
                  v-if="!doc.ruta_archivo.endsWith('.xls') && !doc.ruta_archivo.endsWith('.xlsx')"
                  :href="`http://localhost:3000/uploads/${doc.ruta_archivo}`"
                  target="_blank"
                  class="btn btn-sm btn-tukuypacha-outline"
                >
                  Ver
                </a>
                <a
                  :href="`http://localhost:3000/api/documentos/download/${doc.ruta_archivo}`"
                  class="btn btn-sm btn-tukuypacha-success ms-2"
                >Descargar</a>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div class="admin-modal-overlay" v-if="mostrarUsuarios">
      <div class="modal-dialog modal-xl admin-modal-dialog" :class="{ 'admin-modal-expanded': editandoId !== null }">
        <div class="modal-content admin-modal-content">
          <div class="modal-header admin-modal-header">
            <h5 class="modal-title admin-modal-title">Lista de Usuarios</h5>
            <button type="button" class="btn-close" @click="mostrarUsuarios = false"></button>
          </div>
          <div class="modal-body admin-modal-body">
            <div v-if="isLoading" class="text-center py-5">
              Cargando usuarios...
              </div>
            <div v-else class="table-responsive">
              <table class="table table-striped table-hover admin-table">
                <colgroup>
                  <col style="width: 5%;"> <col style="width: 20%;"> <col style="width: 25%;"> <col style="width: 15%;"> <col style="width: 15%;"> <col style="width: 20%;"> </colgroup>
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
                      <input v-if="editandoId === u.id_usuario" v-model="u.nombre" class="form-control form-control-sm admin-input-table" />
                      <span v-else>{{ u.nombre }}</span>
                    </td>
                    <td>
                      <input v-if="editandoId === u.id_usuario" v-model="u.correo" class="form-control form-control-sm admin-input-table" />
                      <span v-else>{{ u.correo }}</span>
                    </td>
                    <td>
                      <input v-if="editandoId === u.id_usuario" type="text" v-model="u.contraseña" class="form-control form-control-sm admin-input-table" />
                      <span v-else>••••••••</span>
                    </td>
                    <td>
                      <select v-if="editandoId === u.id_usuario" v-model="u.rol" class="form-select form-select-sm admin-select-table">
                        <option value="Admin">Administrador</option>
                        <option value="Personal">Personal</option>
                      </select>
                      <span v-else>{{ u.rol }}</span>
                    </td>
                    <td>
                      <button class="btn-sm btn-tukuypacha-outline me-1" v-if="editandoId !== u.id_usuario" @click="iniciarEdicion(u)">Editar</button>
                      <button class="btn-sm btn-tukuypacha me-1" v-else @click="guardarCambios(u)">Guardar</button>

                      <button
                        class="btn-sm"
                        :class="editandoId === u.id_usuario ? 'btn-tukuypacha-secondary' : 'btn-tukuypacha-danger'"
                        @click="editandoId === u.id_usuario ? cancelarEdicion(u) : eliminarUsuarioLocal(u.id_usuario)"
                      >
                        {{ editandoId === u.id_usuario ? 'Cancelar' : 'Eliminar' }}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
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
const participante = ref(null) // Esto es crucial para saber si se encontró un participante
const documentos = ref([])
const mostrarUsuarios = ref(false)
const usuarios = ref([])
const editandoId = ref(null)
const usuarioOriginal = ref(null);
const isLoading = ref(false);

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
    isLoading.value = true;
    try {
      const res = await axios.get('http://localhost:3000/api/usuarios')
      usuarios.value = res.data
    } catch (err) {
      console.error('Error al cargar usuarios:', err)
    } finally {
      isLoading.value = false;
    }
  }
})

const iniciarEdicion = (u) => {
  editandoId.value = u.id_usuario;
  usuarioOriginal.value = { ...u };
};

const cancelarEdicion = (usuarioEnTabla) => {
  if (usuarioOriginal.value && usuarioOriginal.value.id_usuario === usuarioEnTabla.id_usuario) {
    const index = usuarios.value.findIndex(u => u.id_usuario === usuarioEnTabla.id_usuario);
    if (index !== -1) {
      usuarios.value[index] = { ...usuarioOriginal.value };
    }
  }
  editandoId.value = null;
  usuarioOriginal.value = null;
};

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
    usuarioOriginal.value = null;
  }
}

const cerrarSesion = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('usuario')
  localStorage.clear()
  router.push('/login')
}

const irARegistrar = () => {
  router.push('/registrar')
}

// Nueva función para redirigir a EditarParticipante
const irAEditarParticipante = (id) => {
  router.push(`/editar-participante/${id}`);
};

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
      console.log('📄 documentos recibidos:', docRes.data)
      documentos.value = docRes.data
    } else {
      participante.value = null
      documentos.value = []
    }
  } catch (err) {
    console.error('Error en buscarParticipante:', err)
    participante.value = null; // Asegurarse de limpiar si hay error
    documentos.value = [];
  }
}
</script>

<style>
/* --- Importar la fuente Poppins --- */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

/* --- Variables de Color de Tukuypacha.com --- */
:root {
  --tukuypacha-accent: #f05a30; /* Naranja rojizo para acentos */
  --tukuypacha-button-bg: #e76124; /* Naranja más intenso para el botón */
  --tukuypacha-dark-text: #333333; /* Texto oscuro general */
  --tukuypacha-light-text: #666666; /* Texto secundario/etiquetas */
  --tukuypacha-bg-light: #f8f9fa; /* Fondo claro para la barra lateral y algunas secciones */
  --tukuypacha-bg-main: #f5f5f5; /* Fondo general del contenido principal */
  --tukuypacha-border-color: #d0d0d0; /* Bordes suaves */
  --tukuypacha-card-bg: #ffffff; /* Fondo para tarjetas y modales */
  --tukuypacha-hover-bg: #e9ecef; /* Fondo al pasar el mouse */
  --tukuypacha-success: #28a745; /* Verde para acciones de éxito */
  --tukuypacha-danger: #dc3545; /* Rojo para acciones de peligro */
  --tukuypacha-secondary-btn: #6c757d; /* Gris para botones secundarios */
}

/* --- Estilos Generales para el Dashboard --- */
body {
  font-family: 'Poppins', sans-serif;
  color: var(--tukuypacha-dark-text);
  background-color: var(--tukuypacha-bg-main); /* Fondo para todo el cuerpo */
}

.admin-dashboard-wrapper {
  background-color: var(--tukuypacha-bg-main);
  min-height: 100vh;
}

/* --- Sidebar --- */
.admin-sidebar {
  width: 250px;
  min-height: 100vh;
  background-color: var(--tukuypacha-bg-light);
  border-right: 1px solid var(--tukuypacha-border-color);
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.05);
  padding: 2rem !important;
  /* Ya tiene d-flex flex-column del template, no es necesario aquí */
}

.admin-logo {
  max-height: 90px;
  object-fit: contain;
  margin-bottom: 2.5rem !important;
}

.sidebar-profile-info {
  margin-bottom: 2rem !important; /* Ajustado para más espacio */
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--tukuypacha-border-color);
  text-align: center; /* Centrar el texto del perfil */
}

/* Nuevos estilos para el nombre de usuario y el rol */
.sidebar-profile-info .user-name {
  font-size: 1.3rem; /* Tamaño más grande para el nombre */
  font-weight: 700; /* Más audaz */
  color: var(--tukuypacha-accent); /* Color principal de Tukuypacha */
  margin-bottom: 0.2rem; /* Espacio entre nombre y rol */
}

.sidebar-profile-info .user-role {
  font-size: 0.95rem; /* Tamaño ligeramente más grande que antes */
  color: var(--tukuypacha-light-text);
}

.sidebar-buttons {
  /* Este div es el flex-grow-1 para empujar el botón de cerrar sesión hacia abajo */
  /* No se necesita CSS adicional aquí si ya tiene flex-grow-1 y d-flex flex-column */
}

.btn-tukuypacha-sidebar {
  background-color: transparent;
  border: 1px solid var(--tukuypacha-accent);
  color: var(--tukuypacha-accent);
  font-weight: 500;
  border-radius: 5px;
  padding: 0.75rem 1rem;
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.btn-tukuypacha-sidebar:hover {
  background-color: var(--tukuypacha-accent);
  color: #fff;
  border-color: var(--tukuypacha-accent);
}

.btn-tukuypacha-danger {
  background-color: var(--tukuypacha-danger) !important;
  border-color: var(--tukuypacha-danger) !important;
  color: #fff !important;
  font-weight: 500;
  border-radius: 5px;
  padding: 0.75rem 1rem;
  transition: background-color 0.2s ease, opacity 0.2s ease;
}

.btn-tukuypacha-danger:hover {
  opacity: 0.9;
  background-color: #c82333 !important;
  border-color: #bd2130 !important;
}

/* --- Contenido Principal (el resto sigue igual) --- */
.admin-main-content {
  background-color: var(--tukuypacha-bg-main);
  padding: 2.5rem !important;
}

.admin-main-title {
  color: var(--tukuypacha-accent);
  font-weight: 700;
  font-size: 2rem;
  margin-bottom: 2.5rem !important;
}

/* --- Tarjetas de Contenido (Buscar, Participante, Documentos) --- */
.admin-card {
  border: 1px solid var(--tukuypacha-border-color);
  border-radius: 8px;
  background-color: var(--tukuypacha-card-bg);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.admin-card-header {
  background-color: var(--tukuypacha-bg-light);
  border-bottom: 1px solid var(--tukuypacha-border-color);
  padding: 1rem 1.5rem;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  color: var(--tukuypacha-dark-text);
  font-weight: 600;
}

.admin-card-header h5 {
  margin-bottom: 0;
  color: var(--tukuypacha-dark-text);
}

/* --- Inputs y Botones Globales de Contenido Principal --- */
.admin-input {
  border-radius: 5px;
  border: 1px solid var(--tukuypacha-border-color) !important;
  padding: 0.6rem 1rem;
  font-size: 16px;
  font-weight: 400;
  color: var(--tukuypacha-dark-text);
  font-family: 'Poppins', sans-serif;
  transition: border-color 0.2s ease;
}

.admin-input:focus {
  border-color: var(--tukuypacha-accent);
  box-shadow: 0 0 0 0.25rem rgba(240, 90, 48, 0.2) !important;
  outline: none;
}

.btn-tukuypacha {
  background-color: var(--tukuypacha-button-bg) !important;
  border-color: var(--tukuypacha-button-bg) !important;
  color: #fff !important;
  font-weight: 500;
  border-radius: 5px !important;
  padding: 0.6rem 1.2rem !important;
  transition: opacity .2s ease, background-color .2s ease;
}

.btn-tukuypacha:hover {
  background-color: #d1581f !important;
  border-color: #d1581f !important;
  opacity: 0.9;
}

.btn-tukuypacha-outline {
  background-color: transparent !important;
  border: 1px solid var(--tukuypacha-accent) !important;
  color: var(--tukuypacha-accent) !important;
  font-weight: 500 !important;
  border-radius: 5px !important;
  padding: 0.6rem 1.2rem !important;
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.btn-tukuypacha-outline:hover {
  background-color: var(--tukuypacha-accent) !important;
  color: #fff !important;
}

.btn-tukuypacha-success {
  background-color: var(--tukuypacha-success) !important;
  border-color: var(--tukuypacha-success) !important;
  color: #fff !important;
  font-weight: 500;
  border-radius: 5px !important;
  padding: 0.6rem 1.2rem !important;
  transition: background-color 0.2s ease, opacity 0.2s ease;
}
.btn-tukuypacha-success:hover {
  background-color: #218838 !important;
  border-color: #1e7e34 !important;
  opacity: 0.9;
}

/* --- Detalles del Participante --- */
.participant-card {
  border: none !important;
  box-shadow: none !important;
  background-color: transparent !important;
  padding: 0 !important;
}

.participant-title {
  color: var(--tukuypacha-button-bg);
  font-weight: 600;
  margin-bottom: 1rem;
}

.participant-photo {
  max-height: 180px;
  width: auto;
  border-radius: 8px;
  border: 2px solid var(--tukuypacha-border-color);
  object-fit: cover;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.participant-card p {
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
  line-height: 1.4;
}

/* --- Lista de Documentos --- */
.admin-list-group {
  border-radius: 8px;
  overflow: hidden;
}

.admin-list-item {
  background-color: var(--tukuypacha-card-bg);
  border-color: var(--tukuypacha-border-color);
  padding: 1rem 1.5rem;
  font-size: 0.95rem;
}

.admin-list-item:hover {
  background-color: var(--tukuypacha-hover-bg);
}

.doc-file-name {
  font-weight: 600;
  color: var(--tukuypacha-dark-text);
}

/* --- Modal de Usuarios --- */
.admin-modal-overlay {
  background-color: rgba(0, 0, 0, 0.6);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1050;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow-y: auto;
}

.admin-modal-dialog {
  /* Antes modal-lg (900px), ahora modal-xl por defecto (1140px en Bootstrap 5) */
  max-width: 1140px; /* Ancho por defecto de modal-xl en Bootstrap 5 */
  width: 90%; /* Ajuste para que no sea excesivamente grande en pantallas no tan grandes */
  margin: 1.75rem auto;
  transition: width 0.3s ease, max-width 0.3s ease;
}

.admin-modal-expanded {
  /* Si editandoId no es null, queremos el modal un poco más grande */
  max-width: 1300px; /* Un poco más de espacio para la edición en PC */
  width: 95%; /* Asegura que ocupe más en pantallas grandes */
}

@media (min-width: 1400px) { /* Para pantallas muy grandes (lg en Bootstrap 5 es 992px, xl 1200px, xxl 1400px) */
    .admin-modal-dialog {
        max-width: 1200px; /* Aumenta el ancho en pantallas aún más grandes */
    }
    .admin-modal-expanded {
        max-width: 1500px; /* Ancho máximo para la edición en pantallas muy grandes */
    }
}


@media (max-width: 1200px) { /* Para pantallas medianas a grandes */
  .admin-modal-expanded {
    width: 95%; /* Que ocupe un mayor porcentaje */
  }
}

@media (max-width: 768px) { /* Para móviles y tablets */
  .admin-modal-dialog {
    width: 95%;
    max-width: 95%;
    margin: 1rem auto;
  }
  .admin-modal-expanded {
    width: 98%; /* Un poco más de espacio en pantallas pequeñas si es necesario */
  }
}

.admin-modal-content {
  border-radius: 10px;
  background-color: var(--tukuypacha-card-bg);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
  border: none;
}

.admin-modal-header {
  background-color: var(--tukuypacha-accent);
  color: #fff;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
  padding: 1rem 1.5rem;
  border-bottom: none;
}

.admin-modal-header .modal-title {
  color: #fff;
  font-weight: 600;
  font-size: 1.5rem;
}

.admin-modal-header .btn-close {
  filter: invert(1);
  opacity: 1;
}

.admin-modal-body {
  padding: 1.5rem;
}

.admin-modal-footer {
  border-top: 1px solid var(--tukuypacha-border-color);
  padding: 1rem 1.5rem;
  background-color: var(--tukuypacha-bg-light);
  border-bottom-left-radius: 10px;
  border-bottom-right-radius: 10px;
}

/* --- Tabla de Usuarios dentro del Modal --- */
.admin-table {
  font-size: 0.9rem !important;
  color: var(--tukuypacha-dark-text) !important;
  border-collapse: collapse !important; /* Asegura que los bordes se fusionen bien */
  width: 100% !important; /* Asegura que la tabla ocupe el 100% del contenedor */
  table-layout: fixed; /* Esto ayuda a que colgroup funcione mejor */
}

/* Ajuste de anchos para las columnas en PC (desktop) */
.admin-table colgroup col:nth-child(1) { width: 5%; } /* ID */
.admin-table colgroup col:nth-child(2) { width: 20%; } /* Nombre */
.admin-table colgroup col:nth-child(3) { width: 25%; } /* Correo */
.admin-table colgroup col:nth-child(4) { width: 15%; } /* Contraseña */
.admin-table colgroup col:nth-child(5) { width: 15%; } /* Rol */
.admin-table colgroup col:nth-child(6) { width: 20%; } /* Acciones */


.admin-table thead th {
  background-color: var(--tukuypacha-accent) !important; /* Color principal de Tukuypacha para el encabezado */
  color: #fff !important; /* Texto blanco para el encabezado sobre el fondo naranja */
  font-weight: 600 !important;
  border-bottom: 2px solid var(--tukuypacha-border-color) !important; /* Mantener un borde inferior fuerte */
  padding: 0.8rem 1rem !important; /* Aumentar el padding para más espacio */
  text-align: center !important; /* Asegurar que el texto del encabezado esté alineado a la izquierda */
}

.admin-table tbody tr {
  border-bottom: 1px solid var(--tukuypacha-border-color) !important; /* Añadir un borde inferior suave a las filas */
}

.admin-table tbody tr:last-child {
  border-bottom: none !important; /* Eliminar el borde de la última fila */
}

.admin-table tbody tr:hover {
  background-color: var(--tukuypacha-hover-bg) !important; /* Fondo más claro al pasar el mouse */
}

.admin-table tbody td {
  padding: 0.7rem 1rem !important; /* Ajustar el padding de las celdas de datos */
  vertical-align: middle !important; /* Centrar verticalmente el contenido de la celda */
  text-align: center; /* Alineación por defecto para las celdas de datos */
  /* Ajustar texto-align para celdas específicas si es necesario */
  &:nth-child(2), /* Nombre */
  &:nth-child(3) { /* Correo */
    text-align: left;
  }
}

/* Mejoras visuales para inputs y selects dentro de la tabla */
.admin-input-table,
.admin-select-table {
  font-size: 0.85rem !important;
  padding: 0.4rem 0.7rem !important; /* Ligeramente más padding */
  border-radius: 4px !important;
  border: 1px solid var(--tukuypacha-border-color) !important; /* Borde visible */
  box-shadow: none !important; /* Eliminar sombras por defecto si las hubiera */
  transition: border-color 0.2s ease;
  width: 100%; /* Asegura que los inputs/selects dentro de la tabla ocupen todo el ancho de su celda */
}

.admin-input-table:focus,
.admin-select-table:focus {
  border-color: var(--tukuypacha-accent) !important; /* Resaltar con el color de Tukuypacha al enfocar */
  box-shadow: 0 0 0 0.2rem rgba(240, 90, 48, 0.2) !important; /* Sombra ligera al enfocar */
}

/* Botón secundario para "Cancelar" */
.btn-tukuypacha-secondary {
  background-color: var(--tukuypacha-secondary-btn) !important;
  border-color: var(--tukuypacha-secondary-btn) !important;
  color: #fff !important;
  font-weight: 500;
  border-radius: 5px !important;
  padding: 0.6rem 1.2rem !important;
  transition: background-color 0.2s ease, opacity 0.2s ease;
}

.btn-tukuypacha-secondary:hover {
  background-color: #5a6268 !important; /* Un gris un poco más oscuro al pasar el mouse */
  border-color: #545b62 !important;
  opacity: 0.9;
}

/* Ajuste para los botones dentro de la tabla para que se vean bien en tamaño pequeño */
.admin-table .btn-sm {
  padding: 0.3rem 0.6rem !important; /* Ajustar el padding de los botones pequeños */
  font-size: 0.75rem !important; /* Ajustar el tamaño de fuente de los botones pequeños */
  min-width: 80px !important; /* Mantenemos este para uniformidad */
  text-align: center !important; /* Asegura que el texto se centre */
}

/* Asegurar que el modal tenga un padding adecuado en el cuerpo */
.admin-modal-body {
    padding: 1.5rem; /* Mantener un buen padding dentro del cuerpo del modal */
}

/* --- Responsive adjustments --- */
@media (max-width: 768px) {
  .admin-dashboard-wrapper {
    flex-direction: column;
  }

  .admin-sidebar {
    width: 100%;
    min-height: auto;
    border-right: none;
    border-bottom: 1px solid var(--tukuypacha-border-color);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
    padding: 1rem !important;
    flex-direction: column; /* Asegura que los elementos se apilen */
    align-items: center;
  }

  .admin-logo {
    max-height: 70px;
    margin-bottom: 1rem !important;
    margin-right: 0;
  }

  .sidebar-profile-info {
    text-align: center;
    margin-bottom: 1rem !important;
    padding-bottom: 0.5rem;
    border-bottom: none;
  }

  /* Ajuste para los botones en móviles dentro de la sidebar */
  .sidebar-buttons {
      width: 80%; /* Asegura que ocupen un buen ancho en móvil */
      align-items: center; /* Centra los botones si el div es más ancho */
  }
  .admin-sidebar .btn-tukuypacha-sidebar,
  .admin-sidebar .btn-tukuypacha-danger {
    width: 100% !important; /* Ocupan todo el ancho del contenedor sidebar-buttons */
    margin-bottom: 0.5rem !important; /* Espacio entre ellos */
  }
  .admin-sidebar .btn-tukuypacha-danger {
      margin-top: 0.5rem !important; /* Margen para el botón de cerrar sesión */
  }


  .admin-main-content {
    padding: 1.5rem !important;
  }

  .admin-main-title {
    font-size: 1.7rem;
    margin-bottom: 1.5rem !important;
    text-align: center;
  }

  .admin-card-header h5 {
    font-size: 1.1rem;
  }

  .admin-input {
    font-size: 1rem;
    padding: 0.5rem 0.8rem;
  }

  .btn-tukuypacha,
  .btn-tukuypacha-outline,
  .btn-tukuypacha-success {
    font-size: 1rem;
    padding: 0.5rem 1rem;
  }

  .participant-title {
    font-size: 1.3rem;
    text-align: center;
  }

  .participant-photo {
    max-height: 150px;
  }

  .participant-card p {
    font-size: 0.9rem;
  }

  .admin-list-item {
    padding: 1rem !important;
    font-size: 0.9rem;
  }

  .admin-modal-dialog {
    width: 95%;
    max-width: 95%;
    margin: 1rem auto;
  }

  .admin-modal-header h5 {
    font-size: 1.3rem;
  }

  .admin-table {
    font-size: 0.8rem;
  }

  .admin-table thead th {
    padding: 0.5rem;
    font-size: 0.8rem;
  }

  .admin-table tbody td {
    padding: 0.5rem;
    font-size: 0.8rem;
  }

  .admin-input-table,
  .admin-select-table {
    font-size: 0.8rem !important;
    padding: 0.2rem 0.4rem !important;
  }

  /* Reset de anchos de columna para móviles, dejando que el contenido defina el ancho */
  .admin-table colgroup col { width: auto !important; }
}

/* Estilos para pantallas aún más pequeñas (ej., teléfonos muy estrechos) */
@media (max-width: 480px) {
  .sidebar-buttons {
      width: 95%; /* Ocupa casi todo el ancho en móviles muy pequeños */
  }
  .admin-sidebar .btn-tukuypacha-sidebar,
  .admin-sidebar .btn-tukuypacha-danger {
    width: 100% !important;
  }

  .admin-main-title {
    font-size: 1.5rem;
  }

  .admin-card-header h5 {
    font-size: 1rem;
  }

  .admin-input {
    font-size: 0.9rem;
  }

  .btn-tukuypacha,
  .btn-tukuypacha-outline,
  .btn-tukuypacha-success {
    font-size: 0.9rem;
  }

  .participant-title {
    font-size: 1.2rem;
  }

  .admin-table {
    font-size: 0.7rem;
  }

  .admin-table thead th,
  .admin-table tbody td {
    padding: 0.3rem;
    font-size: 0.7rem;
  }
}
</style>