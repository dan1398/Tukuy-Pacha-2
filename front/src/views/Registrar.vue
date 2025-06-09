<template>
    <div class="container py-4">
      <h3>Registrar Usuario</h3>
      <form @submit.prevent="registrarUsuario" class="row g-3">
        <div class="col-md-6">
          <label class="form-label">Nombre</label>
          <input v-model="nombre" type="text" class="form-control" required />
        </div>
        <div class="col-md-6">
          <label class="form-label">Correo</label>
          <input v-model="correo" type="email" class="form-control" required />
        </div>
        <div class="col-md-6">
          <label class="form-label">Contraseña</label>
          <input v-model="contraseña" type="password" class="form-control" required />
        </div>
        <div class="col-md-6">
          <label class="form-label">Rol</label>
          <select v-model="rol" class="form-select" required>
            <option value="Admin">Admin</option>
            <option value="Personal">Personal</option>
          </select>
        </div>
        <div class="col-12">
          <button type="submit" class="btn btn-primary">Registrar</button>
          <button type="button" class="btn btn-secondary ms-2" @click="volver">Cancelar</button>
        </div>
      </form>
      <div v-if="mensaje" class="alert alert-info mt-3">{{ mensaje }}</div>
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
  .container {
    max-width: 800px;
  }
  </style>
  