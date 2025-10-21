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
        <button class="btn-tukuypacha-sidebar w-100 mb-2" @click="irARegistrar">Registrar Nuevo Usuario</button>
        <button class="btn-tukuypacha-sidebar w-100 mb-2" @click="mostrarUsuarios = true">Gestionar Usuarios</button>
        <button class="btn-tukuypacha-sidebar w-100 mb-2" @click="irARegistrarPatrocinador">Registrar Nuevo Patrocinador</button>
        <button class="btn-tukuypacha-sidebar w-100 mb-auto" @click="mostrarPatrocinadores = true">Gestionar Patrocinadores</button>
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
            <input v-model="busquedaId" type="text" placeholder="Buscar por Nombre, CI, Código, Celular o Patrocinador" class="form-control admin-input" />
            
            <div class="d-flex align-items-center ms-2" v-if="participanteSeleccionado">
              <button
                class="btn-tukuypacha-outline me-2"
                @click="irAEditarParticipante(participanteSeleccionado.id_participante)"
              >
                Editar Participante
              </button>
              
              <button
                class="btn-tukuypacha-success"
                @click="descargarPDF"
              >
                Descargar PDF
              </button>
            </div>
            
            <button
              v-else
              class="btn-tukuypacha ms-2"
              @click="router.push('/nuevo-participante')"
            >
              Nuevo Participante
            </button>

          </div>

          <div v-if="busquedaId.length >= 3 && participantes.length > 0 && !participanteSeleccionado">
            <h6 class="mt-4">Resultados de la búsqueda:</h6>
            <ul class="list-group list-group-flush admin-list-group">
              <li
                class="list-group-item d-flex justify-content-between align-items-center admin-list-item"
                v-for="p in participantes"
                :key="p.id_participante"
                @click="seleccionarParticipante(p)"
              >
                <div class="d-flex align-items-center">
                  <img
                    v-if="p.foto"
                    :src="`http://localhost:3000/uploads/${p.foto}`"
                    alt="Foto del participante"
                    class="img-thumbnail me-3"
                    style="width: 50px; height: 50px; object-fit: cover;"
                  />
                  <div class="doc-file-name">
                    {{ p.nombre }} {{ p.apellido_paterno }} {{ p.apellido_materno }}
                    <small class="text-muted d-block">Código: {{ p.codigo }}</small>
                  </div>
                </div>
              </li>
            </ul>
          </div>
          <div v-else-if="busquedaId.length >= 3 && participantes.length === 0" class="alert alert-info mt-4" role="alert">
            No se encontraron participantes.
          </div>

          <div v-if="participanteSeleccionado" class="card mt-4 participant-card" ref="cardParticipante">
            <div class="card-body">
              <h5 class="card-title participant-title">
                {{ participanteSeleccionado.nombre}} {{ participanteSeleccionado.apellido_paterno }} {{ participanteSeleccionado.apellido_materno }}
              </h5>
              <div v-if="participanteSeleccionado.foto" class="text-center mb-3">
                <img :src="`${API_URL}/uploads/${participanteSeleccionado.foto}`" alt="Foto del participante" class="img-thumbnail participant-photo" />
              </div>
              <div class="row">
                <div class="col-md-6"><p><strong>Código:</strong> {{ participanteSeleccionado.codigo }}</p></div>
                <div class="col-md-6"><p><strong>CI:</strong> {{ participanteSeleccionado.CI }}</p></div>
                <div class="col-md-6"><p><strong>Fecha de nacimiento:</strong> {{ new Date(participanteSeleccionado.fecha_nacimiento).toLocaleDateString() }}</p></div>
                <div class="col-md-6"><p><strong>Dirección:</strong> {{ participanteSeleccionado.direccion }}</p></div>
                <div class="col-md-6"><p><strong>Celular:</strong> {{ participanteSeleccionado.celular }}</p></div>
                <div class="col-md-6" v-if="participanteSeleccionado.patrocinador_nombre"><p><strong>Nombre del Patrocinador:</strong> {{ participanteSeleccionado.patrocinador_nombre }}</p></div>
                <div class="col-md-6" v-if="participanteSeleccionado.patrocinador_apellido_paterno"><p><strong>Apellido Paterno:</strong> {{ participanteSeleccionado.patrocinador_apellido_paterno }}</p></div>
                <div class="col-md-6" v-if="participanteSeleccionado.patrocinador_apellido_materno"><p><strong>Apellido Materno:</strong> {{ participanteSeleccionado.patrocinador_apellido_materno }}</p></div>
                <div class="col-md-6" v-if="participanteSeleccionado.patrocinador_celular"><p><strong>Celular:</strong> {{ participanteSeleccionado.patrocinador_celular }}</p></div>
                <div class="col-md-6" v-if="participanteSeleccionado.patrocinador_correo"><p><strong>Correo Electrónico:</strong> {{ participanteSeleccionado.patrocinador_correo }}</p></div>
              </div>
            </div>
          </div>
          
          <div v-if="participanteSeleccionado && documentos.length > 0" class="card shadow-sm mb-4 admin-card">
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
                      :href="`${API_URL}/uploads/${doc.ruta_archivo}`"
                      target="_blank"
                      class="btn btn-sm btn-tukuypacha-outline"
                    >
                      Ver
                    </a>
                    <a
                      :href="`${API_URL}/api/documentos/download/${doc.ruta_archivo}`"
                      class="btn btn-sm btn-tukuypacha-success ms-2"
                    >Descargar</a>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="admin-modal-overlay" v-if="mostrarUsuarios">
    <div class="modal-dialog admin-modal-dialog modal-dialog-centered " :class="{ 'admin-modal-expanded': editandoId !== null }">
        <div class="modal-content admin-modal-content">
            
            <div class="modal-header admin-modal-header d-block">
                <div class="d-flex justify-content-start align-items-start mb-2">
                    <h5 class="modal-title admin-modal-title">Lista de Usuarios</h5>
                    <button type="button" class="btn-close" @click="mostrarUsuarios = false"></button>
                </div>

                <div class="col-md-4 col-lg-4 py-1 ">
                    <input 
                        type="text" 
                        class="form-control" 
                        v-model="busquedaUsuario" 
                        placeholder="Buscar por Nombre, Apellido, Correo o Rol..."
                        aria-label="Buscar usuarios"
                    />
                </div>
            </div>
            
            <div class="modal-body admin-modal-body bg-white">
              <div v-if="isLoading" class="text-center py-5">
                Cargando usuarios...
              </div>
              <div v-else>
                <div class="table-responsive-custom">
                  <table class="table table-striped table-hover admin-table">
                    <thead>
                      <tr>
                        <th class="text-center">Nombre</th>
                        <th class="text-center">Apellido Paterno</th>
                        <th class="text-center">Apellido Materno</th>
                        <th class="text-center">Correo</th>
                        <th class="text-center">Rol</th>
                        <th class="text-center">Restablecer Contraseña</th>
                        <th class="text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="u in paginatedUsers" :key="u.id_usuario" :data-id="u.id_usuario">
                        <td>
                          <input v-if="editandoId === u.id_usuario" v-model="u.nombre" class="form-control form-control-sm admin-input-table" />
                          <span v-else>{{ u.nombre }}</span>
                        </td>
                        <td>
                          <input v-if="editandoId === u.id_usuario" v-model="u.apellido_paterno" class="form-control form-control-sm admin-input-table" />
                          <span v-else>{{ u.apellido_paterno }}</span>
                        </td>
                        <td>
                          <input v-if="editandoId === u.id_usuario" v-model="u.apellido_materno" class="form-control form-control-sm admin-input-table" />
                          <span v-else>{{ u.apellido_materno }}</span>
                        </td>
                        <td>
                          <input v-if="editandoId === u.id_usuario" v-model="u.correo" class="form-control form-control-sm admin-input-table" />
                          <span v-else>{{ u.correo }}</span>
                        </td>
                        <td>
                          <select v-if="editandoId === u.id_usuario" v-model="u.rol" class="form-select form-select-sm admin-select-table">
                            <option value="Admin">Administrador</option>
                            <option value="Personal">Personal</option>
                          </select>
                          <span v-else>{{ u.rol }}</span>
                        </td>
                        <td class="actions-cell text-center">
                          <button
                            class="btn btn-sm btn-tukuypacha-success"
                            @click="restablecerContrasena(u.id_usuario)"
                            title="Restablecer Contraseña"
                          >
                            <i class="fas fa-redo-alt"></i>
                          </button>
                        </td>
                        <td class="actions-cell actions-edit-delete text-center">
                          <button class="btn btn-sm btn-tukuypacha-outline me-1" v-if="editandoId !== u.id_usuario" @click="iniciarEdicion(u)" title="Editar">
                            <i class="fas fa-edit"></i>
                          </button>
                          <button class="btn btn-sm btn-tukuypacha me-1" v-else @click="guardarCambios(u)" title="Guardar cambios">
                            <i class="fas fa-save"></i>
                          </button>
                          <button class="btn btn-sm btn-tukuypacha-secondary me-1" v-if="editandoId === u.id_usuario" @click="cancelarEdicion(u)" title="Cancelar">
                            <i class="fas fa-times"></i>
                          </button>
                          <button
                            class="btn btn-sm btn-tukuypacha-danger"
                            @click="eliminarUsuarioLocal(u.id_usuario)"
                            title="Eliminar"
                          >
                            <i class="fas fa-trash-alt"></i>
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <div v-if="mostrarUsuarios">
                  <div class="d-flex justify-content-start align-items-center mt-3">
                    <small class="text-muted">
                      Página {{ totalPages > 0 ? currentPage : 0 }} de {{ totalPages || 0 }} (Total: {{ usuariosFiltrados.length }} usuarios)
                    </small>
                  </div>
                  <div class="d-flex justify-content-center mt-3">
                    <div v-if="totalPages > 1">
                      <nav aria-label="Paginación de Usuarios">
                        <ul class="pagination mb-0">
                          <li class="page-item" :class="{ 'disabled': currentPage === 1 }">
                            <a class="page-link" href="#" @click.prevent="prevUserPage" aria-label="Anterior">
                              <span aria-hidden="true">&laquo;</span>
                            </a>
                          </li>

                          <li 
                            class="page-item" 
                            v-for="pageNumber in totalPages" 
                            :key="pageNumber" 
                            :class="{ 'active': pageNumber === currentPage }"
                          >
                            <a class="page-link" href="#" @click.prevent="currentPage = pageNumber">
                              {{ pageNumber }}
                            </a>
                          </li>
                          
                          <li class="page-item" :class="{ 'disabled': currentPage === totalPages || totalPages === 0 }">
                            <a class="page-link" href="#" @click.prevent="nextUserPage" aria-label="Siguiente">
                              <span aria-hidden="true">&raquo;</span>
                            </a>
                          </li>
                        </ul>
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
            </div>
        </div>
    </div>
    </div> 

    <div class="admin-modal-overlay" v-if="mostrarPatrocinadores">
    <div class="modal-dialog admin-modal-dialog admin-modal-expanded">
        <div class="modal-content admin-modal-content">
            
            <div class="modal-header admin-modal-header d-block">
                <div class="d-flex justify-content-start align-items-start mb-2">
                    <h5 class="modal-title admin-modal-title">Lista de Patrocinadores</h5>
                    <button type="button" class="btn-close" @click="mostrarPatrocinadores = false"></button>
                </div>

                <div class="col-md-5 col-lg-5 py-1 ">
                    <input 
                        type="text" 
                        class="form-control" 
                        v-model="busquedaPatrocinador" 
                        placeholder="Buscar por Nombre, Apellido, Celular o Correo..."
                        aria-label="Buscar patrocinadores"
                    />
                </div>
            </div>
            
            <div class="modal-body admin-modal-body bg-white">
                <div v-if="isLoadingPatrocinadores" class="text-center py-5">
                    Cargando patrocinadores...
                </div>
                <div v-else>
                    <div class="table-responsive-custom">
                        <table class="table table-striped table-hover admin-table">
                            <thead>
                                <tr>
                                    <th class="text-center">Nombre</th>
                                    <th class="text-center">Apellido Paterno</th>
                                    <th class="text-center">Apellido Materno</th>
                                    <th class="text-center">Celular</th>
                                    <th class="text-center">Correo</th>
                                    <th class="text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="p in paginatedPatrocinadores" :key="p.id_patrocinador" :data-id="p.id_patrocinador">
                                    <td>
                                        <input v-if="editandoPatrocinadorId === p.id_patrocinador" v-model="p.nombre" class="form-control form-control-sm admin-input-table" />
                                        <span v-else>{{ p.nombre }}</span>
                                    </td>
                                    <td>
                                        <input v-if="editandoPatrocinadorId === p.id_patrocinador" v-model="p.apellido_paterno" class="form-control form-control-sm admin-input-table" />
                                        <span v-else>{{ p.apellido_paterno }}</span>
                                    </td>
                                    <td>
                                        <input v-if="editandoPatrocinadorId === p.id_patrocinador" v-model="p.apellido_materno" class="form-control form-control-sm admin-input-table" />
                                        <span v-else>{{ p.apellido_materno }}</span>
                                    </td>
                                    <td>
                                        <div v-if="editandoPatrocinadorId === p.id_patrocinador" class="position-relative">
                                            <VueTelInput
                                                :modelValue="p.celular"
                                                @update:modelValue="(value) => {
                                                  if (typeof value === 'object') {
                                                    p.celular = value.international || '';
                                                  } else {
                                                    p.celular = value;
                                                  }
                                                }"
                                                mode="international"
                                                :class="{'is-invalid': patrocinadorValidacionEstado[p.id_patrocinador] === false}"
                                                @validate="onPatrocinadorCelularValidate(p.id_patrocinador, $event)"
                                                @blur="onPatrocinadorCelularBlur(p.id_patrocinador)"
                                                :inputOptions="{
                                                    placeholder: 'Celular',
                                                    class: 'form-control form-control-sm admin-input-table'
                                                }"
                                            ></VueTelInput>
                                            <div class="invalid-feedback d-block" v-if="patrocinadorValidacionEstado[p.id_patrocinador] === false">
                                                Número inválido.
                                            </div>
                                        </div>
                                        <span v-else>{{ p.celular }}</span>
                                    </td>
                                    <td>
                                        <input v-if="editandoPatrocinadorId === p.id_patrocinador" v-model="p.correo" class="form-control form-control-sm admin-input-table" />
                                        <span v-else>{{ p.correo }}</span>
                                    </td>
                                    <td class="actions-cell actions-edit-delete">
                                        <button class="btn btn-sm btn-tukuypacha-outline me-1" v-if="editandoPatrocinadorId !== p.id_patrocinador" @click="iniciarEdicionPatrocinador(p)" title="Editar">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-sm btn-tukuypacha me-1" v-else @click="guardarCambiosPatrocinador(p)" title="Guardar cambios">
                                            <i class="fas fa-save"></i>
                                        </button>
                                        <button class="btn btn-sm btn-tukuypacha-secondary me-1" v-if="editandoPatrocinadorId === p.id_patrocinador" @click="cancelarEdicionPatrocinador(p)" title="Cancelar">
                                            <i class="fas fa-times"></i>
                                        </button>
                                        <button
                                            class="btn btn-sm btn-tukuypacha-danger"
                                            @click="eliminarPatrocinador(p.id_patrocinador)"
                                            title="Eliminar"
                                        >
                                            <i class="fas fa-trash-alt"></i>
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="d-flex justify-content-start align-items-center mt-3">
                        <small class="text-muted">
                            Página {{ totalPatrocinadorPages > 0 ? currentPatrocinadorPage : 0 }} de {{ totalPatrocinadorPages || 0 }} (Total: {{ patrocinadoresFiltrados.length }} patrocinadores)
                        </small>
                    </div>

                    <div class="d-flex justify-content-center mt-3">
                        <div v-if="totalPatrocinadorPages > 1">
                            <nav aria-label="Paginación de Patrocinadores">
                                <ul class="pagination mb-0">
                                    <li class="page-item" :class="{ 'disabled': currentPatrocinadorPage === 1 }">
                                        <a class="page-link" href="#" @click.prevent="prevPatrocinadorPage" aria-label="Anterior">
                                            <span aria-hidden="true">&laquo;</span>
                                        </a>
                                    </li>
                                    
                                    <li 
                                        class="page-item" 
                                        v-for="page in totalPatrocinadorPages" 
                                        :key="page" 
                                        :class="{ 'active': page === currentPatrocinadorPage }"
                                    >
                                        <a class="page-link" href="#" @click.prevent="currentPatrocinadorPage = page">
                                            {{ page }}
                                        </a>
                                    </li>
                                    
                                    <li class="page-item" :class="{ 'disabled': currentPatrocinadorPage === totalPatrocinadorPages || totalPatrocinadorPages === 0 }">
                                        <a class="page-link" href="#" @click.prevent="nextPatrocinadorPage" aria-label="Siguiente">
                                            <span aria-hidden="true">&raquo;</span>
                                        </a>
                                    </li>
                                </ul>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    </div>
  </div>
</template>

<script setup>  
import { ref, onMounted, watch, computed } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import logo from '../images/logo-top2.png';
import { VueTelInput } from 'vue-tel-input';
import 'vue-tel-input/vue-tel-input.css';
import html2pdf from 'html2pdf.js';

// --- DEFINICIÓN DE LA URL DE LA API DE RENDER ---
const API_URL = 'http://localhost:3000';
// --------------------------------------------------

const router = useRouter()
const usuario = ref({})
const busquedaId = ref('')
const participantes = ref([]);
const participanteSeleccionado = ref(null);
const documentos = ref([])
const mostrarUsuarios = ref(false)
const usuarios = ref([])
const editandoId = ref(null)
const usuarioOriginal = ref(null);
const isLoading = ref(false);

const mostrarPatrocinadores = ref(false);
const patrocinadores = ref([]);
const editandoPatrocinadorId = ref(null);
const patrocinadorOriginal = ref(null);
const isLoadingPatrocinadores = ref(false);
const patrocinadorValidacionEstado = ref({});
let searchTimeout = null;

const cardParticipante = ref(null);

// ===============================================
// === LÓGICA DE BÚSQUEDA Y PAGINACIÓN DE USUARIOS
// ===============================================

// 1. NUEVA PROPIEDAD: Enlazada con el input de búsqueda del HTML
const busquedaUsuario = ref(''); 

// Propiedades para la paginación de usuarios
const currentPage = ref(1); // Página actual, inicia en 1
const pageSize = ref(10);   // Elementos por página.

// 2. PROPIEDAD COMPUTADA CLAVE: Filtra los usuarios según el término de búsqueda
const usuariosFiltrados = computed(() => {
    if (!usuarios.value || usuarios.value.length === 0) return [];

    const busqueda = busquedaUsuario.value ? busquedaUsuario.value.toLowerCase().trim() : '';

    // Si no hay término de búsqueda, devuelve la lista completa (Tabla normal)
    if (busqueda.length === 0) {
        return usuarios.value;
    }

    // Filtrar usuarios
    return usuarios.value.filter(u => {
        // Concatenar campos relevantes y convertirlos a minúsculas
        const textoCompleto = [
            u.nombre, 
            u.apellido_paterno, 
            u.apellido_materno, 
            u.correo, 
            u.rol
        ].join(' ').toLowerCase(); 
        
        // Comprueba si el texto completo incluye el término de búsqueda
        return textoCompleto.includes(busqueda);
    });
});

// 3. Propiedad computada para el total de páginas (BASADO EN usuariosFiltrados)
const totalPages = computed(() => {
    if (!usuariosFiltrados.value || usuariosFiltrados.value.length === 0) return 0;
    return Math.ceil(usuariosFiltrados.value.length / pageSize.value);
});

// 4. Propiedad computada para los usuarios paginados (BASADO EN usuariosFiltrados)
const paginatedUsers = computed(() => {
    if (!usuariosFiltrados.value) return [];
    
    // Ajustar la página actual si el filtro reduce los resultados
    const totalItems = usuariosFiltrados.value.length;
    if (currentPage.value > totalPages.value && totalPages.value > 0) {
        currentPage.value = totalPages.value;
    } else if (totalPages.value === 0 && totalItems > 0) {
        currentPage.value = 1;
    } else if (totalPages.value === 0) {
        currentPage.value = 1;
    }
    
    const start = (currentPage.value - 1) * pageSize.value;
    const end = start + pageSize.value;
    
    // Devolver el segmento de la lista FILTRADA
    return usuariosFiltrados.value.slice(start, end);
});

// 5. WATCHER: Reiniciar la paginación a la página 1 cuando se inicia o cambia la búsqueda
watch(busquedaUsuario, () => {
    currentPage.value = 1; 
});


// FUNCIONES DE NAVEGACIÓN AÑADIDAS PARA USUARIOS
const nextUserPage = () => {
    if (currentPage.value < totalPages.value) {
        currentPage.value++;
    }
};

const prevUserPage = () => {
    if (currentPage.value > 1) {
        currentPage.value--;
    }
};

// =========================================================
// === NUEVA LÓGICA DE BÚSQUEDA Y PAGINACIÓN DE PATROCINADORES
// =========================================================

// 1. NUEVA PROPIEDAD: Enlazada con el input de búsqueda del HTML para patrocinadores
const busquedaPatrocinador = ref(''); 

// Propiedades para la paginación de patrocinadores
const currentPatrocinadorPage = ref(1);
const patrocinadorPageSize = ref(10); // Elementos por página de Patrocinadores.

// 2. PROPIEDAD COMPUTADA CLAVE: Filtra los patrocinadores según el término de búsqueda
const patrocinadoresFiltrados = computed(() => {
    if (!patrocinadores.value || patrocinadores.value.length === 0) return [];

    const busqueda = busquedaPatrocinador.value ? busquedaPatrocinador.value.toLowerCase().trim() : '';

    // Si no hay término de búsqueda, devuelve la lista completa
    if (busqueda.length === 0) {
        return patrocinadores.value;
    }

    // Filtrar patrocinadores
    return patrocinadores.value.filter(p => {
        // Concatenar campos relevantes y convertirlos a minúsculas
        const textoCompleto = [
            p.nombre, 
            p.apellido_paterno, 
            p.apellido_materno, 
            p.celular, // Se incluye celular
            p.correo
        ].join(' ').toLowerCase(); 
        
        // Comprueba si el texto completo incluye el término de búsqueda
        return textoCompleto.includes(busqueda);
    });
});

// 3. Propiedad computada para el total de páginas (BASADO EN patrocinadoresFiltrados)
const totalPatrocinadorPages = computed(() => {
    if (!patrocinadoresFiltrados.value || patrocinadoresFiltrados.value.length === 0) return 0;
    return Math.ceil(patrocinadoresFiltrados.value.length / patrocinadorPageSize.value);
});

// 4. Propiedad computada para los patrocinadores paginados (BASADO EN patrocinadoresFiltrados)
const paginatedPatrocinadores = computed(() => {
    if (!patrocinadoresFiltrados.value) return [];

    // Ajustar la página actual si el filtro reduce los resultados
    const totalItems = patrocinadoresFiltrados.value.length;
    if (currentPatrocinadorPage.value > totalPatrocinadorPages.value && totalPatrocinadorPages.value > 0) {
        currentPatrocinadorPage.value = totalPatrocinadorPages.value;
    } else if (totalPatrocinadorPages.value === 0 && totalItems > 0) {
        currentPatrocinadorPage.value = 1;
    } else if (totalPatrocinadorPages.value === 0) {
        currentPatrocinadorPage.value = 1;
    }

    const start = (currentPatrocinadorPage.value - 1) * patrocinadorPageSize.value;
    const end = start + patrocinadorPageSize.value;
    
    // Devolver el segmento de la lista FILTRADA
    return patrocinadoresFiltrados.value.slice(start, end);
});

// 5. WATCHER: Reiniciar la paginación a la página 1 cuando se inicia o cambia la búsqueda de patrocinador
watch(busquedaPatrocinador, () => {
    currentPatrocinadorPage.value = 1; 
});


// Funciones de navegación para PATROCINADORES (ACTUALIZADAS)
const nextPatrocinadorPage = () => {
    if (currentPatrocinadorPage.value < totalPatrocinadorPages.value) {
        currentPatrocinadorPage.value++;
    }
};

const prevPatrocinadorPage = () => {
    if (currentPatrocinadorPage.value > 1) {
        currentPatrocinadorPage.value--;
    }
};


// ===============================================
// === RESTO DEL SCRIPT ORIGINAL
// ===============================================

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
      // CAMBIO: Usar API_URL
      const res = await axios.get(`${API_URL}/api/usuarios`)
      usuarios.value = res.data
      // Aseguramos que la página actual se resetee a 1 al cargar nuevos datos
      currentPage.value = 1; 
      // Limpiar el campo de búsqueda al abrir el modal
      busquedaUsuario.value = '';
    } catch (err) {
      console.error('Error al cargar usuarios:', err)
      console.error('No se pudo cargar la lista de usuarios.');
    } finally {
      isLoading.value = false;
    }
  }
})

watch(mostrarPatrocinadores, async (value) => {
  if (value) {
    isLoadingPatrocinadores.value = true;
    try {
      // CAMBIO: Usar API_URL
      const res = await axios.get(`${API_URL}/api/patrocinadores`)
      patrocinadores.value = res.data;
      // Reiniciar la paginación de patrocinadores al cargar nuevos datos
      currentPatrocinadorPage.value = 1;
      // Opcional: Limpiar el campo de búsqueda al abrir el modal
      busquedaPatrocinador.value = '';
    } catch (err) {
      console.error('Error al cargar patrocinadores:', err)
      console.error('No se pudo cargar la lista de patrocinadores.');
    } finally {
      isLoadingPatrocinadores.value = false;
    }
  }
});

watch(busquedaId, (newValue) => {
  if (!newValue || newValue.trim().length < 3) {
    participantes.value = [];
    participanteSeleccionado.value = null;
    documentos.value = [];
    return;
  }
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    buscarParticipantes();
  }, 300);
});

const buscarParticipantes = async () => {
  try {
    // CAMBIO: Usar API_URL
    const res = await axios.get(
      `${API_URL}/api/participantes/buscar?termino=${busquedaId.value}`
    );
    participantes.value = res.data;
    participanteSeleccionado.value = null;

    if (participantes.value.length === 1) {
      seleccionarParticipante(participantes.value[0]);
    } else {
      documentos.value = [];
    }

  } catch (err) {
    console.error('Error en buscarParticipantes:', err);
    participantes.value = [];
    participanteSeleccionado.value = null;
    documentos.value = [];
  }
};

const seleccionarParticipante = async (participante) => {
  participanteSeleccionado.value = participante;
  
  try {
    // CAMBIO: Usar API_URL
    const docRes = await axios.get(
      `${API_URL}/api/documentos?participanteId=${participante.id_participante}`
    );
    documentos.value = docRes.data;
  } catch (err) {
    console.error('Error al obtener documentos:', err);
    documentos.value = [];
  }
};

const descargarPDF = () => {
  if (!participanteSeleccionado.value || !cardParticipante.value) {
    // Usar una notificación/modal en lugar de alert()
    console.error('Por favor, seleccione un participante para descargar el PDF.'); 
    return;
  }

  const opt = {
    margin: 1,
    filename: `Participante_${participanteSeleccionado.value.codigo}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true }, // Se añade useCORS: true aquí
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  };

  html2pdf().from(cardParticipante.value).set(opt).save();
};

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
  console.log('Solicitud de eliminación de usuario para el ID:', id);
  try {
    // CAMBIO: Usar API_URL
    await axios.delete(`${API_URL}/api/usuarios/${id}`)
    usuarios.value = usuarios.value.filter(u => u.id_usuario !== id)
    if (editandoId.value === id) editandoId.value = null
    console.log('Usuario eliminado de la base de datos')
    // Lógica para retroceder página si se elimina el último elemento
    if (paginatedUsers.value.length === 0 && currentPage.value > 1) {
      currentPage.value--;
    }
  } catch (err) {
    console.error('Error al eliminar usuario:', err)
    console.error('No se pudo eliminar el usuario');
  }
}

const getPatrocinadores = async () => {
  isLoadingPatrocinadores.value = true;
  try {
    // CAMBIO: Usar API_URL
    const res = await axios.get(`${API_URL}/api/patrocinadores`);
    patrocinadores.value = res.data;
  } catch (err) {
    console.error('Error al cargar patrocinadores:', err);
  } finally {
    isLoadingPatrocinadores.value = false;
  }
};

const guardarCambios = async (usuarioEditado) => {
  try {
    const dataToUpdate = {
      nombre: usuarioEditado.nombre,
      correo: usuarioEditado.correo,
      apellido_paterno: usuarioEditado.apellido_paterno,
      apellido_materno: usuarioEditado.apellido_materno,
      rol: usuarioEditado.rol
    };
    // CAMBIO: Usar API_URL
    await axios.put(`${API_URL}/api/usuarios/${usuarioEditado.id_usuario}`, dataToUpdate);
    console.log('Cambios de usuario guardados en la base de datos');
  } catch (err) {
    console.error('Error al guardar cambios:', err);
    console.error('No se pudieron guardar los cambios');
  } finally {
    editandoId.value = null;
    usuarioOriginal.value = null;
  }
};

const restablecerContrasena = async (id) => {
  console.log('Solicitud de restablecimiento de contraseña para el ID:', id);
  try {
    // CAMBIO: Usar API_URL
    const res = await axios.post(`${API_URL}/api/usuarios/${id}/restablecer-contrasena`);
    console.log(res.data.mensaje);
  } catch (err) {
    console.error('Error al restablecer contraseña:', err);
    console.error('No se pudo restablecer la contraseña. Revisa el correo del usuario.');
  }
};

const cerrarSesion = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('usuario')
  localStorage.clear()
  router.push('/login')
}

const irARegistrar = () => {
  router.push('/registrar')
}

const irARegistrarPatrocinador = () => {
  router.push('/registrarPatrocinador')
}

const irAEditarParticipante = (id) => {
  router.push(`/editar-participante/${id}`);
};

const iniciarEdicionPatrocinador = (p) => {
  editandoPatrocinadorId.value = p.id_patrocinador;
  patrocinadorOriginal.value = { ...p };
  patrocinadorValidacionEstado.value[p.id_patrocinador] = true;
};

const cancelarEdicionPatrocinador = (patrocinadorEnTabla) => {
  if (patrocinadorOriginal.value && patrocinadorOriginal.value.id_patrocinador === patrocinadorEnTabla.id_patrocinador) {
    const index = patrocinadores.value.findIndex(p => p.id_patrocinador === patrocinadorEnTabla.id_patrocinador);
    if (index !== -1) {
      patrocinadores.value[index] = { ...patrocinadorOriginal.value };
    }
  }
  editandoPatrocinadorId.value = null;
  patrocinadorOriginal.value = null;
  delete patrocinadorValidacionEstado.value[patrocinadorEnTabla.id_patrocinador];
};

const guardarCambiosPatrocinador = async (patrocinadorEditado) => {
  if (patrocinadorValidacionEstado.value[patrocinadorEditado.id_patrocinador] === false) {
    return;
  }

  try {
    const dataToUpdate = {
      nombre: patrocinadorEditado.nombre,
      apellido_paterno: patrocinadorEditado.apellido_paterno,
      apellido_materno: patrocinadorEditado.apellido_materno,
      celular: patrocinadorEditado.celular,
      correo: patrocinadorEditado.correo
    };
    // CAMBIO: Usar API_URL
    await axios.put(`${API_URL}/api/patrocinadores/${patrocinadorEditado.id_patrocinador}`, dataToUpdate);
    console.log('Cambios de patrocinador guardados en la base de datos');
  } catch (err) {
    console.error('Error al guardar cambios del patrocinador:', err);
    console.error('No se pudieron guardar los cambios del patrocinador');
  } finally {
    editandoPatrocinadorId.value = null;
    patrocinadorOriginal.value = null;
  }
};

const onPatrocinadorCelularValidate = (id, { isValid }) => {
  patrocinadorValidacionEstado.value[id] = isValid;
};

const onPatrocinadorCelularBlur = (id) => {
  // Aquí puedes dejar la validación visible o ajustarla a tu gusto
};

const eliminarPatrocinador = async (id) => {
  try {
    // CAMBIO: Usar API_URL
    await axios.delete(`${API_URL}/api/patrocinadores/${id}`);
    patrocinadores.value = patrocinadores.value.filter(p => p.id_patrocinador !== id);
    if (editandoPatrocinadorId.value === id) editandoPatrocinadorId.value = null;
    console.log('Patrocinador eliminado de la base de datos');
    // Asegurarse de que si se elimina el último elemento de la página, retrocedemos una página
    // IMPORTANTE: USAR LA LISTA FILTRADA PARA LA CONDICIÓN DE RETROCESO
    if (patrocinadoresFiltrados.value.length % patrocinadorPageSize.value === 0 && patrocinadoresFiltrados.value.length > 0) {
      currentPatrocinadorPage.value--;
    }
  } catch (err) {
    console.error('Error al eliminar patrocinador:', err);
    console.error('No se pudo eliminar el patrocinador');
  }
};
</script>

<style>
/* --- Importar la fuente Poppins y Font Awesome --- */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');

/* --- Variables de Color de Tukuypacha.com --- */
:root {
  --tukuypacha-accent: #f05a30;
  --tukuypacha-button-bg: #e76124;
  --tukuypacha-dark-text: #333333;
  --tukuypacha-light-text: #666666;
  --tukuypacha-bg-light: #f8f9fa;
  --tukuypacha-bg-main: #f5f5f5;
  --tukuypacha-border-color: #d0d0d0;
  --tukuypacha-card-bg: #ffffff;
  --tukuypacha-hover-bg: #e9ecef;
  --tukuypacha-success: #28a745;
  --tukuypacha-danger: #dc3545;
  --tukuypacha-secondary-btn: #6c757d;
}

/* --- Estilos Generales para el Dashboard --- */
body {
  font-family: 'Poppins', sans-serif;
  color: var(--tukuypacha-dark-text);
  background-color: var(--tukuypacha-bg-main);
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
}

.admin-logo {
  max-height: 90px;
  object-fit: contain;
  margin-bottom: 2.5rem !important;
}

.sidebar-profile-info {
  margin-bottom: 2rem !important;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--tukuypacha-border-color);
  text-align: center;
}

.sidebar-profile-info .user-name {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--tukuypacha-accent);
  margin-bottom: 0.2rem;
}

.sidebar-profile-info .user-role {
  font-size: 0.95rem;
  color: var(--tukuypacha-light-text);
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

/* --- Contenido Principal --- */
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

/* --- Tarjetas de Contenido --- */
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

/* --- Inputs y Botones --- */
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
  color: var(--tukuypacha-accent);
  font-weight: 600;
  margin-bottom: 1.5rem;
}

.participant-photo {
  width: 150px;
  height: 150px;
  object-fit: cover;
  border-radius: 50%;
  border: 4px solid var(--tukuypacha-border-color);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.participant-card p {
  margin-bottom: 0.5rem;
  font-size: 1rem;
}

.participant-card strong {
  color: var(--tukuypacha-accent);
  font-weight: 600;
}

/* --- Resultados de Búsqueda y Listas --- */
.admin-list-group .list-group-item {
  cursor: pointer;
  background-color: var(--tukuypacha-card-bg);
  border: 1px solid var(--tukuypacha-border-color);
  margin-bottom: 0.5rem;
  border-radius: 5px;
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
}

.admin-list-group .list-group-item:hover {
  background-color: var(--tukuypacha-hover-bg);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

/* --- Modales --- */
.admin-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1050;
  transition: all 0.3s ease;
}

.admin-modal-dialog {
  max-width: 800px;
  transition: transform 0.3s ease;
}

.admin-modal-expanded {
  max-width: 1200px;
}

.admin-modal-content {
  border-radius: 8px;
  border: none;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  background-color: var(--tukuypacha-card-bg);
}

.admin-modal-header {
  background-color: var(--tukuypacha-accent);
  color: #fff;
  border-bottom: none;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}

.admin-modal-title {
  font-weight: 600;
}

.admin-modal-body {
  padding: 2rem;
}

.btn-close {
  filter: invert(1);
}

/* Estilos para vue-tel-input */
.vue-tel-input {
  border: 1px solid var(--tukuypacha-border-color) !important;
  border-radius: 5px !important;
  box-shadow: none !important;
  font-family: 'Poppins', sans-serif;
}

.vue-tel-input:focus-within {
  box-shadow: 0 0 0 0.25rem rgba(240, 90, 48, 0.2) !important;
  border-color: var(--tukuypacha-accent) !important;
}

.vue-tel-input .dropdown {
  border-right: 1px solid var(--tukuypacha-border-color);
}

.vue-tel-input .dropdown:hover {
  background-color: var(--tukuypacha-hover-bg);
}

.vue-tel-input .dropdown-menu {
  background-color: var(--tukuypacha-card-bg);
  border: 1px solid var(--tukuypacha-border-color);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.vue-tel-input .input-tel {
  border: none !important;
}

.vue-tel-input.is-invalid {
  border-color: var(--tukuypacha-danger) !important;
}
.vue-tel-input.is-invalid:focus-within {
  box-shadow: 0 0 0 0.25rem rgba(220, 53, 69, 0.2) !important;
}
/* --- REGLA CLAVE PARA EL DESPLAZAMIENTO HORIZONTAL --- */
.table-responsive-custom {
  overflow-x: auto; /* Esto garantiza que la barra de desplazamiento aparezca en móvil. */
  width: 100%; /* Asegura que el contenedor ocupe todo el ancho para que el scroll funcione. */
}

/* FIX CRÍTICO: Fuerza a la tabla interna a tener un ancho mínimo y garantiza el scroll. */
.table-responsive-custom .admin-table {
    min-width: 900px; 
}

/* FIX ESPECÍFICO PARA MODALES: Asegura que el cuerpo del modal y el diálogo permitan el desbordamiento horizontal */

/* 1. Permitir el scroll horizontal en el cuerpo del modal */
.admin-modal-body {
    overflow-x: auto; 
    padding: 1rem;
}

/* 2. Asegurar que el modal-dialog no limite el ancho forzado de la tabla en dispositivos pequeños */
@media screen and (max-width: 768px) {
    /* Permitimos que el diálogo del modal se adapte al ancho de su contenido desbordado */
    .admin-modal-dialog {
        max-width: none !important;
        width: 100% !important;
    }
    
    /* FIX AGRESIVO: Deshace cualquier 'hidden' en el body */
    body {
        overflow-x: unset !important; 
    }
}


/* -------------------------------------------------------------
 * ESTILOS DE TABLA BASE (tukuypacha) - REGLAS CONSOLIDADAS
 * -------------------------------------------------------------
 */

/* Estilos de encabezados (th) */
.admin-table th { 
  background-color: var(--tukuypacha-bg-light);
  color: var(--tukuypacha-dark-text);
  font-weight: 600;
  border-bottom: 2px solid var(--tukuypacha-accent);
  padding: 0.75rem;
  vertical-align: middle;
  text-align: center;
}

/* Estilos de celdas (td) */
.admin-table td {
  vertical-align: middle;
  padding: 0.75rem;
  text-align: center;
}

/* Estilos de inputs y selects en la tabla */
.admin-input-table,
.admin-select-table {
  border-color: var(--tukuypacha-border-color);
  transition: border-color 0.2s ease;
}

.admin-input-table:focus,
.admin-select-table:focus {
  border-color: var(--tukuypacha-accent);
  box-shadow: 0 0 0 0.2rem rgba(240, 90, 48, 0.2);
}

/* --- Botones de acciones uniformes --- */
.actions-cell .btn {
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

/* --- Iconos con tamaño uniforme --- */
.actions-cell .btn i {
  font-size: 14px;
}

/* --- Separación entre botones dentro de la celda de acciones --- */
.actions-cell .btn + .btn {
  margin-left: 4px;
}

/* --- Hover más visible para las filas de la tabla --- */
.admin-table tbody tr:hover {
  background-color: rgba(0, 0, 0, 0.04);
}
.actions-edit-delete {
  display: flex;
}
</style>