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
          <input v-model="participante.codigo" type="text" class="form-control admin-input" required />
        </div>
        <div class="col-md-4 mb-3">
          <label class="form-label">Nombre</label>
          <input v-model="participante.nombre" type="text" class="form-control admin-input" required />
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
          <label class="form-label">CI</label>
          <input v-model="participante.CI" type="text" class="form-control admin-input" required />
        </div>

        <div class="col-md-4 mb-3">
          <label class="form-label">Fecha de Nacimiento</label>
          <input v-model="participante.fecha_nacimiento" type="date" class="form-control admin-input" required />
        </div>
        <div class="col-md-4 mb-3">
          <label class="form-label">Dirección</label>
          <input v-model="participante.direccion" type="text" class="form-control admin-input" required />
        </div>
        <div class="col-md-4 mb-3">
          <label class="form-label">Celular</label>
          <input v-model="participante.celular" type="text" class="form-control admin-input" required />
        </div>

        <div class="col-md-6 mb-3">
          <label class="form-label">Nombre del Patrocinador</label>
          <input v-model="participante.nombre_patrocinador" type="text" class="form-control admin-input" required />
        </div>
        <div class="col-md-6 mb-3">
          <label class="form-label">Contacto del Patrocinador</label>
          <input v-model="participante.contacto" type="text" class="form-control admin-input" required />
        </div>

        <div class="col-12 mb-3">
          <h5 class="mt-4 admin-section-title">Documentos Acompañados</h5>
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
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const participante = ref(null)
const documentos = ref([])
const nuevaFoto = ref(null) // Para la nueva foto que se subirá
const participanteCargado = ref(false)
const mensaje = ref('')
const mensajeTipo = ref('')
const eliminarFotoActual = ref(false); // Checkbox para eliminar foto
const documentosAEliminar = ref([]); // IDs de documentos a eliminar de la DB

onMounted(async () => {
  const participanteId = route.params.id_participante;
  if (!participanteId) {
    console.error("ID de participante no proporcionado en la ruta.");
    router.push('/adminDashboard'); // Redirige si no hay ID
    return;
  }
  await cargarParticipante(participanteId);
});

async function cargarParticipante(id) {
  try {
    const [resParticipante, resDocumentos] = await Promise.all([
      axios.get(`http://localhost:3000/api/participantes/${id}`),
      axios.get(`http://localhost:3000/api/documentos?participanteId=${id}`)
    ]);

    participante.value = {
      ...resParticipante.data,
      // Formatear la fecha para el input type="date"
      fecha_nacimiento: resParticipante.data.fecha_nacimiento ? new Date(resParticipante.data.fecha_nacimiento).toISOString().split('T')[0] : ''
    };
    documentos.value = resDocumentos.data.map(doc => ({
      ...doc,
      nuevoArchivo: null // Añadir una propiedad para nuevos archivos
    }));
    participanteCargado.value = true;
  } catch (error) {
    console.error("Error al cargar participante o documentos:", error);
    mensaje.value = 'Error al cargar los datos del participante. Por favor, inténtelo de nuevo.';
    mensajeTipo.value = 'danger';
    participanteCargado.value = true; // Terminar la carga incluso con error
  }
}

function agregarDocumento() {
  // Asegúrate de que los campos iniciales sean consistentes con tu base de datos
  documentos.value.push({ tipo_documento: '', nuevoArchivo: null, id_documento: null, ruta_archivo: null, nombre_archivo: null });
}

function eliminarDocumento(index) {
  // Si el documento que se va a eliminar ya existe en la DB (tiene id_documento), agrégalo a la lista de eliminación
  if (documentos.value[index].id_documento) {
    documentosAEliminar.value.push(documentos.value[index].id_documento);
  }
  // Eliminar el documento del array local para que no se muestre
  documentos.value.splice(index, 1);
}

function handleArchivo(e, index) {
  if (!e || !e.target || !e.target.files || !e.target.files[0]) return;
  const selected = e.target.files[0];
  const tiposPermitidos = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  if (!tiposPermitidos.includes(selected.type)) {
    alert('Tipo de archivo no permitido. Solo se permiten PDF, imágenes (JPEG, PNG) y hojas de cálculo (Excel).');
    e.target.value = '';
    return;
  }
  documentos.value[index].nuevoArchivo = selected; 
  // Limpia la ruta anterior para que se muestre el "Nuevo archivo seleccionado" en la UI
  documentos.value[index].ruta_archivo = null; 
  documentos.value[index].nombre_archivo = selected.name; // Actualiza el nombre del archivo en la UI
}

function handleFoto(e) {
  const file = e.target.files[0];
  if (!file) {
    nuevaFoto.value = null; // Si el usuario cancela la selección, reinicia
    return;
  }
  const tiposPermitidos = ['image/jpeg', 'image/png'];
  if (!tiposPermitidos.includes(file.type)) {
    alert('Solo se permiten imágenes JPG o PNG para la foto del participante.');
    e.target.value = ''; // Limpia el input del archivo
    nuevaFoto.value = null;
    return;
  }
  nuevaFoto.value = file;
  eliminarFotoActual.value = false; // Si se selecciona una nueva foto, desmarca eliminar la actual
}

async function actualizarParticipante() {
  mensaje.value = ''; // Limpiar mensajes anteriores
  mensajeTipo.value = '';

  try {
    const id_participante = participante.value.id_participante;
    const id_usuario = JSON.parse(localStorage.getItem('usuario') || '{}').id;

    if (!id_usuario) {
      throw new Error('No se encontró el ID de usuario en el almacenamiento local. Inicie sesión nuevamente.');
    }

    // --- 1. Actualizar Datos del Participante Principal ---
    const formDataParticipante = new FormData();
    formDataParticipante.append('codigo', participante.value.codigo);
    formDataParticipante.append('nombre', participante.value.nombre);
    formDataParticipante.append('CI', participante.value.CI);
    formDataParticipante.append('fecha_nacimiento', participante.value.fecha_nacimiento);
    formDataParticipante.append('direccion', participante.value.direccion);
    formDataParticipante.append('celular', participante.value.celular);
    formDataParticipante.append('nombre_patrocinador', participante.value.nombre_patrocinador);
    formDataParticipante.append('contacto', participante.value.contacto);

    if (nuevaFoto.value) {
      formDataParticipante.append('foto', nuevaFoto.value);
    } else if (eliminarFotoActual.value) {
      // Si se marcó el checkbox para eliminar y no hay nueva foto
      formDataParticipante.append('mantener_foto', 'false'); // Señal para el backend
    }
    // Si no hay nueva foto y no se marcó eliminar, el backend por defecto mantiene la foto existente

    await axios.put(`http://localhost:3000/api/participantes/${id_participante}`, formDataParticipante);

    // --- 2. Procesar Eliminación de Documentos ---
    // Usamos Promise.all para enviar todas las solicitudes DELETE simultáneamente
    const deletePromises = documentosAEliminar.value.map(docId => 
      axios.delete(`http://localhost:3000/api/documentos/${docId}`)
    );
    await Promise.all(deletePromises);
    documentosAEliminar.value = []; // Limpiar la lista después de eliminar

    // --- 3. Procesar Adición/Actualización de Documentos ---
    const documentPromises = [];
    for (const doc of documentos.value) {
      const docForm = new FormData();
      docForm.append('tipo_documento', doc.tipo_documento);
      docForm.append('id_participante', id_participante);
      docForm.append('id_usuario', id_usuario);

      if (doc.nuevoArchivo) { // Si hay un nuevo archivo (o se actualizó uno existente)
        docForm.append('archivo', doc.nuevoArchivo);
        if (doc.id_documento) { // Es un documento existente que se actualiza con un nuevo archivo
          documentPromises.push(axios.put(`http://localhost:3000/api/documentos/${doc.id_documento}`, docForm));
        } else { // Es un documento completamente nuevo
          documentPromises.push(axios.post('http://localhost:3000/api/documentos', docForm));
        }
      } else if (doc.id_documento) { 
        // Si es un documento existente y NO se cambió el archivo, pero sí el tipo (o solo se mantiene)
        // Se envía PUT solo con los datos de texto, el backend no buscará un archivo si no se envía uno
        documentPromises.push(axios.put(`http://localhost:3000/api/documentos/${doc.id_documento}`, {
            tipo_documento: doc.tipo_documento,
            id_participante: id_participante, // Reconfirmar
            id_usuario: id_usuario // Reconfirmar
        }));
      }
    }
    await Promise.all(documentPromises);

    mensaje.value = 'Participante y documentos actualizados correctamente.';
    mensajeTipo.value = 'success';
    
    // Opcional: recargar los datos para reflejar los cambios (ej. si una ruta de archivo cambió)
    await cargarParticipante(id_participante);
    nuevaFoto.value = null; // Limpiar la foto seleccionada después de guardar
    eliminarFotoActual.value = false; // Resetear checkbox
    
  } catch (err) {
    console.error("Error al actualizar participante o documentos:", err);
    // Mejorar el mensaje de error para el usuario
    const errorMessage = err.response?.data?.mensaje || err.response?.data?.error || err.message;
    mensaje.value = 'Error al actualizar participante o documentos. Detalles: ' + errorMessage;
    mensajeTipo.value = 'danger';
  }
}

function volver() {
  router.push('/adminDashboard');
}
</script>

<style scoped>
/* Estilos específicos para este formulario de edición, consistentes con AdminDashboard.vue */
.container {
  max-width: 900px; /* Un poco más amplio para el formulario de edición */
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
  color: var(--tukuypacha-dark-text); /* Color para títulos de sección */
  font-weight: 600;
  font-size: 1.4rem;
  margin-top: 1rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid var(--tukuypacha-border-color); /* Separador visual */
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

/* Estilos para los botones del formulario */
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
  background-color: #218838; /* Color un poco más oscuro al pasar el ratón */
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
  background-color: #5a6268; /* Color un poco más oscuro al pasar el ratón */
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

/* Estilos para el checkbox de eliminar foto */
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