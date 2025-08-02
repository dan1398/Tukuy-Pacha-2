<template>
  <div class="admin-dashboard-wrapper d-flex">
    <div class="admin-sidebar border-end p-3 d-flex flex-column">
      <img :src="logo" alt="Logo" class="img-fluid mb-4 admin-logo" />

      <div class="sidebar-profile-info mb-4">
        <div class="user-name">{{ usuario.nombre }}</div>
        <div class="user-role">Perfil: {{ usuario.rol }}</div>
      </div>

      <div class="sidebar-buttons flex-grow-1 d-flex flex-column">
        <button class="btn-tukuypacha-sidebar w-100 mb-2" @click="router.push('/nuevo-participante')">Registrar Nuevo Participante</button>
        <button class="btn btn-tukuypacha-danger w-100 mt-auto" @click="cerrarSesion">Cerrar sesión</button>
      </div>
    </div>

    <div class="flex-grow-1 p-4 admin-main-content">
      <h1 class="mb-4 admin-main-title">Panel de Personal</h1>

      <div class="card shadow-sm mb-4 admin-card">
        <div class="card-header admin-card-header">
          <h5>Buscar Participante</h5>
        </div>
        <div class="card-body">
          <div class="input-group mb-3">
            <input v-model="busquedaId" type="text" placeholder="Buscar" class="form-control admin-input" />
            <button class="btn-tukuypacha" @click="buscarParticipante">Buscar</button>
            <button class="btn-tukuypacha ms-2" @click="router.push('/nuevo-participante')">Nuevo Participante</button>
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
                <div class="col-md-6"><p><strong>Nombre del patrocinador:</strong> {{ participante.nombre_patrocinador }}</p></div>
                <div class="col-md-6"><p><strong>Contacto:</strong> {{ participante.contacto }}</p></div>
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import logo from '../images/logo-top2.png'; // Asegúrate de que esta ruta sea correcta para tu logo

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
    // En lugar de buscar por 'codigo', ahora usamos el nuevo endpoint de búsqueda
    const res = await axios.get(
      `http://localhost:3000/api/participantes/buscar?termino=${busquedaId.value}`
    )

    // El resultado de la búsqueda será un array, no un solo participante
    if (res.data.length > 0) {
      // Si la búsqueda devuelve múltiples resultados, puedes tomar el primero
      const encontrado = res.data[0]
      participante.value = encontrado

      // Y luego buscar sus documentos
      const docRes = await axios.get(
        `http://localhost:3000/api/documentos?participanteId=${encontrado.id_participante}`
      )
      console.log('documentos recibidos:', docRes.data)
      documentos.value = docRes.data
    } else {
      // Si no se encuentra nada
      participante.value = null
      documentos.value = []
    }
  } catch (err) {
    console.error('Error en buscarParticipante:', err)
    participante.value = null;
    documentos.value = [];
  }
}
</script>

<style scoped>
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

/* --- Detalles del Participante (Aplicado de tu AdminDashboard.vue) --- */
.participant-card {
  border: none !important; /* El borde y sombra ya los da la card principal */
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

/* --- Responsive adjustments (directamente de tu AdminDashboard.vue) --- */
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
}
</style>