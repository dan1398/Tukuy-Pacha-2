<template>
  <div class="d-flex justify-content-center align-items-center vh-100">
    <div class="card shadow p-4 w-100" style="max-width: 400px;">
      <h3 class="text-center mb-4">Iniciar Sesión</h3>
      <form @submit.prevent="iniciarSesion">
        <div class="mb-3">
          <label for="correo" class="form-label">Correo electrónico</label>
          <input type="email" id="correo" class="form-control" v-model="correo" required />
        </div>
        <div class="mb-3">
          <label for="password" class="form-label">Contraseña</label>
          <input type="password" id="password" class="form-control" v-model="password" required />
        </div>
        <button type="submit" class="btn btn-primary w-100">Ingresar</button>
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

<style>
/* Estilos responsivos adicionales */
.login-card {
  max-width: 400px;
}

@media (min-width: 992px) {
  .container {
    align-items: flex-start !important;
    padding-top: 80px;
  }
}

</style>
