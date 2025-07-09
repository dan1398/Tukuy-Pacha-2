<template>
  <div class="tukuypacha-login-wrapper d-flex justify-content-center align-items-center vh-100">
    <div class="card tukuypacha-login-card shadow-sm p-4 p-md-5">
      <div class="text-center mb-4">
        <h3 class="tukuypacha-login-title">Iniciar Sesión</h3>
      </div>
      
      <form @submit.prevent="iniciarSesion">
        <div class="mb-3">
          <label for="correo" class="form-label tukuypacha-label">Correo electrónico</label>
          <input type="email" id="correo" class="form-control tukuypacha-input" v-model="correo" required />
        </div>
        <div class="mb-3">
          <label for="password" class="form-label tukuypacha-label">Contraseña</label>
          <input type="password" id="password" class="form-control tukuypacha-input" v-model="password" required />
        </div>
        <button type="submit" class="btn btn-primary w-100 mt-3 tukuypacha-button">Ingresar</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const correo = ref('')
const password = ref('')
const router = useRouter()

async function iniciarSesion() {
  try {
    const response = await axios.post('http://localhost:3000/api/auth/login', {
      correo: correo.value,
      contraseña: password.value
    })

    const { token, usuario } = response.data
    localStorage.setItem('token', token)
    localStorage.setItem('usuario', JSON.stringify(usuario))

    // Redirigir según rol
    if (usuario.rol === 'Admin') {
      router.push('/adminDashboard') 
    } else if (usuario.rol === 'Personal') {
      router.push('/personalDashboard')  
    } else {
      alert('Rol no reconocido')
    }

  } catch (error) {
    alert('Credenciales incorrectas')
    console.error(error)
  }
}
</script>

<style scoped>
/* --- Importar la fuente Poppins --- */
/* Esta línea DEBE ir al principio del bloque <style> */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');


/* --- Variables de Color basadas EXACTAMENTE en Tukuypacha.com --- */
:root {
  --tukuypacha-accent: #f05a30; /* Color principal para títulos y algunos textos */
  --tukuypacha-button-bg: #e76124; /* Color de fondo para el botón principal */
  --tukuypacha-dark-text: #333333; /* Texto oscuro general */
  --tukuypacha-light-text: #666666; /* Texto secundario/etiquetas */
  --tukuypacha-background-card: #fdfdfd; /* Blanco casi puro para la tarjeta */
  --tukuypacha-border-color: #d0d0d0; /* Borde de input más suave */
  --tukuypacha-body-bg: #f5f5f5; /* Fondo general de la página */
}

/* --- Estilos Generales --- */
body {
  background-color: var(--tukuypacha-body-bg) !important; /* Añadir !important aquí también */
  font-family: 'Poppins', Helvetica, Arial, Lucida, sans-serif !important; 
  font-weight: 400 !important; 
  font-size: 16px !important; 
  color: var(--tukuypacha-dark-text) !important;
}

.tukuypacha-login-wrapper {
  /* Mantener este bloque, si es necesario quitar el comentario anidado: */
  /* background-color: rgba(0, 0, 0, 0.05);  */ /* Puedes descomentarlo si quieres un ligero overlay */
}

/* --- Tarjeta de Inicio de Sesión --- */
.tukuypacha-login-card {
  max-width: 420px !important; 
  border-radius: 8px !important; 
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1) !important; 
  background-color: var(--tukuypacha-background-card) !important; 
  padding: 2.5rem !important; 
  border: 1px solid var(--tukuypacha-border-color) !important; 
}

/* --- Título de Iniciar Sesión --- */
.tukuypacha-login-title {
  color: var(--tukuypacha-accent) !important; 
  font-family: 'Poppins', Helvetica, Arial, Lucida, sans-serif !important; 
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

/* --- Campos de Entrada (Inputs) --- */
.tukuypacha-input {
  border-radius: 5px !important; 
  padding: 0.7rem 1rem !important; 
  border: 1px solid var(--tukuypacha-border-color) !important; 
  font-size: 16px !important; 
  font-family: 'Poppins', Helvetica, Arial, Lucida, sans-serif !important; 
  font-weight: 500 !important; 
  color: var(--tukuypacha-dark-text) !important;
  box-shadow: inset 0 1px 2px rgba(0,0,0,.075) !important; 
  transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out !important;
  -webkit-appearance: none !important; /* Eliminar estilos predeterminados del navegador */
  -moz-appearance: none !important;
  appearance: none !important;
}

/* Esto es CRÍTICO para el foco y el contorno azul de Bootstrap */
.tukuypacha-input:focus {
  border-color: var(--tukuypacha-accent) !important; /* Color de borde de tu marca */
  outline: 0 !important; /* ¡Muy importante! Elimina el contorno azul por defecto */
  box-shadow: 0 0 0 0.25rem rgba(240, 90, 48, 0.25) !important; /* Sombra de enfoque con transparencia del color accent */
}

/* --- Botón de Ingresar --- */
.tukuypacha-button {
  background-color: var(--tukuypacha-button-bg) !important; 
  border-color: var(--tukuypacha-button-bg) !important;
  color: #fff !important; 
  border-radius: 5px !important; 
  font-weight: 500 !important; 
  font-size: 16px !important; 
  font-family: 'Poppins', Helvetica, Arial, Lucida, sans-serif !important; 
  padding: 0.75rem 1.5rem !important;
  
  transition: opacity .2s ease, background-color .2s ease !important;
  letter-spacing: 0.5px !important;
  
  /* Asegurar que el padding y line-height no sean sobreescritos */
  line-height: 1.5 !important;
}

.tukuypacha-button:hover {
  background-color: #d1581f !important; /* Un poco más oscuro que #e76124 */
  border-color: #d1581f !important;
  opacity: 0.9 !important; 
  transform: none !important; 
  box-shadow: none !important; 
}

/* --- Estilos Responsivos --- */
@media (max-width: 576px) {
  .tukuypacha-login-card {
    margin: 15px !important; 
    padding: 1.8rem !important; 
  }
  .tukuypacha-login-title {
    font-size: 1.8rem !important;
  }
}
</style>