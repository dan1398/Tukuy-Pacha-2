import { createRouter, createWebHistory } from 'vue-router'
import AdminDashboard from '@/views/AdminDashboard.vue'
import PersonalDashboard from '@/views/PersonalDashboard.vue'
import Login from '@/views/Login.vue'
import Registrar from '@/views/Registrar.vue'
import NuevoParticipante from '@/views/NuevoParticipante.vue'


const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes:[
        {
          path: '/',
          redirect: '/login'
        },
        {
            path: '/login',
            name: 'login',
            component: Login,
            meta: { requiresAuth: false }
        },
        {
            path: '/adminDashboard',
            name: 'adminDashboard',
            component: AdminDashboard,
            meta: { requiresAuth: true }
        },
        {
            path: '/personalDashboard',
            name: 'personalDashboard',
            component: PersonalDashboard,
            meta: {requiresAuth: true}
        },
        {
            path: '/registrar',
            name: 'registrar',
            component: Registrar,
            meta: { requiresAuth: true } 
        },
        {
          path: '/nuevo-participante',
          name: 'nuevoParticipante',
          component: NuevoParticipante,
          meta: { requiresAuth: true }
        }
    ]
})

router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('usuario')
    const isAuthenticated = token && token !== 'undefined' && token.trim() !== ''
  
    if (to.meta.requiresAuth && !isAuthenticated) {
      next({ name: 'login' })
    } else if (to.path === '/adminDashboard') {
      if (!userData) return next({ name: 'login' })
      const user = JSON.parse(userData)
      if (user.rol === 'Admin') {
        next()
      } else {
        next({ name: 'personalDashboard' })
      }
    } else if (to.path === '/personalDashboard') {
      if (!userData) return next({ name: 'login' })
      const user = JSON.parse(userData)
      if (user.rol === 'Personal') {
        next()
      } else {
        next({ name: 'adminDashboard' })
      }
    } else {
      next()
    }
  })
export default router

