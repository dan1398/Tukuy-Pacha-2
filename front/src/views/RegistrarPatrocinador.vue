<template>
  <!-- Contenedor principal con los estilos del diseño "tukuypacha" -->
  <div class="tukuypacha-register-wrapper d-flex justify-content-center align-items-center vh-100">
    <div class="card tukuypacha-register-card shadow-sm p-4 p-md-5">
      <div class="text-center mb-4">
        <!-- Título del formulario -->
        <h3 class="tukuypacha-register-title">Registrar Patrocinador</h3>
      </div>
      
      <!-- Formulario para registrar el patrocinador -->
      <form @submit.prevent="registrarPatrocinador" class="row g-3">
        
        <!-- Campo para el nombre del patrocinador (requerido) -->
        <div class="col-12">
          <label for="nombre" class="form-label tukuypacha-label">Nombre</label>
          <input v-model="nombre" type="text" id="nombre" name="nombre" class="form-control tukuypacha-input" required />
        </div>
        
        <!-- Campo para el apellido paterno del patrocinador -->
        <div class="col-12">
          <label for="apellido_paterno" class="form-label tukuypacha-label">Apellido Paterno</label>
          <input v-model="apellido_paterno" type="text" id="apellido_paterno" name="apellido_paterno" class="form-control tukuypacha-input" />
        </div>

        <!-- Campo para el apellido materno del patrocinador -->
        <div class="col-12">
          <label for="apellido_materno" class="form-label tukuypacha-label">Apellido Materno</label>
          <input v-model="apellido_materno" type="text" id="apellido_materno" name="apellido_materno" class="form-control tukuypacha-input" />
        </div>
        
        <!-- Campo para el celular con la librería vue-tel-input -->
        <div class="col-12">
          <label for="telefono" class="form-label tukuypacha-label" >Celular</label>
          <VueTelInput 
            v-model="celularCompleto" 
            mode="international" 
            :inputOptions="{ placeholder: 'Ingresa tu número de celular' }"
            :dropdownOptions="{ showDialCodeInSelection: true, showSearchBox: true, showFlags: true }"
            class="tukuypacha-input-tel"
            ref="telInputRef"
            name="celular"
          ></VueTelInput>
        </div>

        <!-- Campo para el correo electrónico del patrocinador (ya no es requerido) -->
        <div class="col-12">
          <label for="correo" class="form-label tukuypacha-label">Correo</label>
          <input v-model="correo" type="email" id="correo" name="correo" class="form-control tukuypacha-input" />
        </div>
        
        <!-- Contenedor para los botones de acción -->
        <div class="col-12 d-flex justify-content-between gap-2 mt-4">
          <button type="submit" class="btn btn-tukuypacha flex-grow-1">Registrar</button>
          <button type="button" class="btn btn-tukuypacha-secondary flex-grow-1" @click="cancelar">Cancelar</button>
        </div>
      </form>
      
      <!-- Mensaje de respuesta, si existe -->
      <div v-if="mensaje" class="alert alert-info mt-3">{{ mensaje }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { VueTelInput } from 'vue-tel-input';
import 'vue-tel-input/vue-tel-input.css';

const router = useRouter();
const telInputRef = ref(null);

const nombre = ref('');
const apellido_paterno = ref('');
const apellido_materno = ref('');
const celularCompleto = ref('');
const correo = ref('');
const mensaje = ref('');

const registrarPatrocinador = async () => {
  if (!nombre.value) {
    mensaje.value = 'El nombre es un campo obligatorio.';
    return;
  }
  if (correo.value && (!correo.value.includes('@') || !correo.value.includes('.com'))) {
    mensaje.value = 'El correo debe ser válido y terminar en .com';
    return;
  }
  
  if (celularCompleto.value) {
    const phoneObject = telInputRef.value?.phoneObject;
    if (phoneObject && !phoneObject.isValid) {
      mensaje.value = 'El número de celular no es válido para el país seleccionado.';
      return;
    }
  }

  try {
    const res = await axios.post('http://localhost:3000/api/patrocinadores', {
      nombre: nombre.value,
      apellido_paterno: apellido_paterno.value || null,
      apellido_materno: apellido_materno.value || null,
      celular: telInputRef.value?.phoneObject?.international || celularCompleto.value || null,
      correo: correo.value || null,
    });
    mensaje.value = res.data.mensaje;
    
    nombre.value = '';
    apellido_paterno.value = '';
    apellido_materno.value = '';
    celularCompleto.value = '';
    correo.value = '';
  } catch (error) {
    mensaje.value = 'Error al registrar el patrocinador.';
    console.error(error);
  }
};

const cancelar = () => {
  router.push('/adminDashboard');
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

:root {
  --tukuypacha-accent: #f05a30;
  --tukuypacha-button-bg: #e76124;
  --tukuypacha-dark-text: #333333;
  --tukuypacha-light-text: #666666;
  --tukuypacha-background-card: #ffffff;
  --tukuypacha-border-color: #d0d0d0;
  --tukuypacha-body-bg: #f5f5f5;
  --tukuypacha-secondary-btn: #6c757d;
}

body {
  font-family: 'Poppins', sans-serif !important;
  background-color: var(--tukuypacha-body-bg) !important;
  color: var(--tukuypacha-dark-text) !important;
}

.tukuypacha-register-wrapper {
  background-color: var(--tukuypacha-body-bg) !important;
}

.tukuypacha-register-card {
  max-width: 450px !important;
  border-radius: 8px !important;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1) !important;
  background-color: var(--tukuypacha-background-card) !important;
  padding: 2.5rem !important;
  border: 1px solid var(--tukuypacha-border-color) !important;
}

.tukuypacha-register-title {
  color: var(--tukuypacha-accent) !important;
  font-family: 'Poppins', sans-serif !important;
  font-size: 2.2rem !important;
  font-weight: 700 !important;
  margin-bottom: 1.8rem !important;
  text-transform: uppercase !important;
  letter-spacing: 1.5px !important;
}

.tukuypacha-label {
  font-weight: 500 !important;
  color: var(--tukuypacha-light-text) !important;
  font-size: 16px !important;
  margin-bottom: 0.5rem !important;
}

.tukuypacha-input,
.tukuypacha-select {
  border-radius: 5px !important;
  padding: 0.7rem 1rem !important;
  border: 1px solid var(--tukuypacha-border-color) !important;
  font-size: 16px !important;
  font-family: 'Poppins', sans-serif !important;
  font-weight: 500 !important;
  color: var(--tukuypacha-dark-text) !important;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.075) !important;
  transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out !important;
  -webkit-appearance: none !important;
  -moz-appearance: none !important;
  appearance: none !important;
  height: auto !important;
  min-height: 48px !important;
}

.tukuypacha-input:focus,
.tukuypacha-select:focus {
  border-color: var(--tukuypacha-accent) !important;
  outline: 0 !important;
  box-shadow: 0 0 0 0.25rem rgba(240, 90, 48, 0.25) !important;
}

.btn-tukuypacha {
  background-color: var(--tukuypacha-button-bg) !important;
  border-color: var(--tukuypacha-button-bg) !important;
  color: #fff !important;
  border-radius: 5px !important;
  font-weight: 500 !important;
  font-size: 16px !important;
  font-family: 'Poppins', sans-serif !important;
  padding: 0.75rem 1.5rem !important;
  transition: opacity 0.2s ease, background-color 0.2s ease !important;
  letter-spacing: 0.5px !important;
  line-height: 1.5 !important;
}

.btn-tukuypacha:hover {
  background-color: #d1581f !important;
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
  transition: opacity 0.2s ease, background-color 0.2s ease !important;
  letter-spacing: 0.5px !important;
  line-height: 1.5 !important;
}

.btn-tukuypacha-secondary:hover {
  background-color: #5a6268 !important;
  border-color: #545b62 !important;
  opacity: 0.9 !important;
}

@media (max-width: 576px) {
  .tukuypacha-register-card {
    margin: 15px !important;
    padding: 1.8rem !important;
    width: calc(100% - 30px) !important;
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

/* SOLUCIÓN PARA VUE-TEL-INPUT */
.tukuypacha-input-tel.vue-tel-input {
  border: 1px solid var(--tukuypacha-border-color) !important;
  border-radius: 5px !important;
  font-family: 'Poppins', sans-serif !important;
  font-weight: 500 !important;
  color: var(--tukuypacha-dark-text) !important;
  height: auto !important;
  min-height: 48px !important;
  display: flex !important;
  align-items: center !important;
}

.tukuypacha-input-tel.vue-tel-input:focus-within {
  box-shadow: 0 0 0 0.25rem rgba(240, 90, 48, 0.25) !important;
  border-color: var(--tukuypacha-accent) !important;
}

.tukuypacha-input-tel.vue-tel-input input {
  font-family: 'Poppins', sans-serif !important;
  padding: 0.7rem 1rem !important;
  border: none !important;
  background-color: transparent !important;
  height: 100% !important;
  flex-grow: 1 !important;
}

.tukuypacha-input-tel .vti__dropdown {
  padding: 0 8px !important;
  border-right: 1px solid var(--tukuypacha-border-color) !important;
  height: 100% !important;
  display: flex !important;
  align-items: center !important;
}

.tukuypacha-input-tel .vti__flag {
  display: inline-block !important;
  width: 20px !important;
  height: 15px !important;
  background-size: contain !important;
  background-repeat: no-repeat !important;
  background-image: inherit !important;
}

.tukuypacha-input-tel .vti__dropdown-list {
  z-index: 1060 !important;
  min-width: 300px !important;
}
</style>