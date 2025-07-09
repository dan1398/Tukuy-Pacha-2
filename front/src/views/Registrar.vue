<template>
  <div class="tukuypacha-register-wrapper d-flex justify-content-center align-items-center vh-100">
    <div class="card tukuypacha-register-card shadow-sm p-4 p-md-5">
      <div class="text-center mb-4">
        <h3 class="tukuypacha-register-title">Registrar Usuario</h3>
      </div>
      <form @submit.prevent="registrarUsuario" class="row g-3">
        <div class="col-md-6">
          <label for="nombre" class="form-label tukuypacha-label">Nombre</label>
          <input v-model="nombre" type="text" id="nombre" class="form-control tukuypacha-input" required />
        </div>
        <div class="col-md-6">
          <label for="correo" class="form-label tukuypacha-label">Correo</label>
          <input v-model="correo" type="email" id="correo" class="form-control tukuypacha-input" required />
        </div>
        <div class="col-md-6">
          <label for="contrasena" class="form-label tukuypacha-label">Contraseña</label>
          <input v-model="contraseña" type="password" id="contrasena" class="form-control tukuypacha-input" required />
        </div>
        <div class="col-md-6">
          <label for="rol" class="form-label tukuypacha-label">Rol</label>
          <select v-model="rol" id="rol" class="form-select tukuypacha-select" required>
            <option value="Admin">Administrador</option>
            <option value="Personal">Personal</option>
          </select>
        </div>
        <div class="col-12 d-flex justify-content-between gap-2 mt-4">
          <button type="submit" class="btn btn-tukuypacha flex-grow-1">Registrar</button>
          <button type="button" class="btn btn-tukuypacha-secondary flex-grow-1" @click="volver">Cancelar</button>
        </div>
      </form>
      <div v-if="mensaje" class="alert alert-info mt-3">{{ mensaje }}</div>
    </div>
  </div>
</template>
  
  <script setup>
  import { ref } from 'vue'
  import axios from 'axios'
  import { useRouter } from 'vue-router'
  
  const router = useRouter()
  const nombre = ref('')
  const correo = ref('')
  const contraseña = ref('')
  const rol = ref('Personal')
  const mensaje = ref('')
  
  const registrarUsuario = async () => {
    try {
      const res = await axios.post('http://localhost:3000/api/usuarios', {
        nombre: nombre.value,
        correo: correo.value,
        contraseña: contraseña.value,
        rol: rol.value
      })
      mensaje.value = `Usuario registrado correctamente (ID: ${res.data.id})`
      nombre.value = correo.value = contraseña.value = ''
      rol.value = 'Personal'
    } catch (error) {
      mensaje.value = 'Error al registrar usuario'
      console.error(error)
    }
  }
  
  const volver = () => {
    router.push('/adminDashboard')
  }
  </script>
  
  <style scoped>
/* --- Importar la fuente Poppins --- */
/* ESTA LÍNEA DEBE IR AL PRINCIPIO DEL BLOQUE <style> */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

/* --- Variables de Color de Tukuypacha.com --- */
:root {
  --tukuypacha-accent: #f05a30; /* Naranja rojizo para acentos y títulos */
  --tukuypacha-button-bg: #e76124; /* Naranja más intenso para el botón principal */
  --tukuypacha-dark-text: #333333; /* Texto oscuro general */
  --tukuypacha-light-text: #666666; /* Texto secundario/etiquetas */
  --tukuypacha-background-card: #ffffff; /* Blanco casi puro para la tarjeta */
  --tukuypacha-border-color: #d0d0d0; /* Borde de input más suave */
  --tukuypacha-body-bg: #f5f5f5; /* Fondo general de la página */
  --tukuypacha-secondary-btn: #6c757d; /* Gris para botón secundario (Cancelar) */
}

/* --- Estilos Generales para el Fondo de la Página de Registro --- */
/* Asegúrate que el body también tenga Poppins si no lo has hecho globalmente */
body {
  font-family: 'Poppins', sans-serif !important;
  background-color: var(--tukuypacha-body-bg) !important;
  color: var(--tukuypacha-dark-text) !important;
}

.tukuypacha-register-wrapper {
  background-color: var(--tukuypacha-body-bg) !important;
}

/* --- Tarjeta de Registro --- */
.tukuypacha-register-card {
  max-width: 650px !important; /* Un poco más ancho para el formulario de registro */
  border-radius: 8px !important;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1) !important;
  background-color: var(--tukuypacha-background-card) !important;
  padding: 2.5rem !important;
  border: 1px solid var(--tukuypacha-border-color) !important;
}

/* --- Título del Formulario --- */
.tukuypacha-register-title {
  color: var(--tukuypacha-accent) !important;
  font-family: 'Poppins', sans-serif !important;
  font-size: 2.2rem !important;
  font-weight: 700 !important;
  margin-bottom: 1.8rem !important;
  text-transform: uppercase !important;
  letter-spacing: 1.5px !important;
}

/* --- Etiquetas de Formulario --- */
.tukuypacha-label {
  font-weight: 500 !important;
  color: var(--tukuypacha-light-text) !important;
  font-size: 16px !important;
  margin-bottom: 0.5rem !important;
}

/* --- Campos de Entrada (Inputs y Select) --- */
.tukuypacha-input,
.tukuypacha-select {
  border-radius: 5px !important;
  padding: 0.7rem 1rem !important;
  border: 1px solid var(--tukuypacha-border-color) !important;
  font-size: 16px !important;
  font-family: 'Poppins', sans-serif !important;
  font-weight: 500 !important;
  color: var(--tukuypacha-dark-text) !important;
  box-shadow: inset 0 1px 2px rgba(0,0,0,.075) !important;
  transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out !important;
  -webkit-appearance: none !important;
  -moz-appearance: none !important;
  appearance: none !important;
}

.tukuypacha-input:focus,
.tukuypacha-select:focus {
  border-color: var(--tukuypacha-accent) !important;
  outline: 0 !important;
  box-shadow: 0 0 0 0.25rem rgba(240, 90, 48, 0.25) !important;
}

/* --- Botones --- */
.btn-tukuypacha {
  background-color: var(--tukuypacha-button-bg) !important;
  border-color: var(--tukuypacha-button-bg) !important;
  color: #fff !important;
  border-radius: 5px !important;
  font-weight: 500 !important;
  font-size: 16px !important;
  font-family: 'Poppins', sans-serif !important;
  padding: 0.75rem 1.5rem !important;
  transition: opacity .2s ease, background-color .2s ease !important;
  letter-spacing: 0.5px !important;
  line-height: 1.5 !important;
}

.btn-tukuypacha:hover {
  background-color: #d1581f !important; /* Un poco más oscuro */
  border-color: #d1581f !important;
  opacity: 0.9 !important;
  transform: none !important;
  box-shadow: none !important;
}

.btn-tukuypacha-secondary {
  background-color: var(--tukuypacha-secondary-btn) !important;
  border-color: var(--tukuypacha-secondary-btn) !important;
  color: #fff !important;
  border-radius: 5px !important;
  font-weight: 500 !important;
  font-size: 16px !important;
  font-family: 'Poppins', sans-serif !important;
  padding: 0.75rem 1.5rem !important;
  transition: opacity .2s ease, background-color .2s ease !important;
  letter-spacing: 0.5px !important;
  line-height: 1.5 !important;
}

.btn-tukuypacha-secondary:hover {
  background-color: #5a6268 !important; /* Un poco más oscuro */
  border-color: #545b62 !important;
  opacity: 0.9 !important;
}

/* --- Estilos Responsivos --- */
@media (max-width: 576px) {
  .tukuypacha-register-card {
    margin: 15px !important;
    padding: 1.8rem !important;
    width: calc(100% - 30px) !important; /* Ocupar casi todo el ancho */
  }
  .tukuypacha-register-title {
    font-size: 1.8rem !important;
  }
  .btn-tukuypacha,
  .btn-tukuypacha-secondary {
    font-size: 1rem !important;
    padding: 0.6rem 1rem !important;
  }
}
</style>