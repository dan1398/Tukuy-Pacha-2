import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRouter, createWebHistory } from 'vue-router';
import AdminDashboard from '@/views/AdminDashboard.vue';
import PersonalDashboard from '@/views/PersonalDashboard.vue';
import Login from '@/views/Login.vue';

// Mockear localStorage para controlar el estado de autenticación en los tests
const localStorageMock = (function() {
    let store = {};
    return {
        getItem: vi.fn(key => store[key] || null),
        setItem: vi.fn((key, value) => { store[key] = value.toString(); }),
        clear: vi.fn(() => { store = {}; }),
        removeItem: vi.fn(key => { delete store[key]; })
    };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// La función 'beforeEach' de tu router ahora se prueba como un middleware
const routerGuard = (to, from, next) => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('usuario');
    const isAuthenticated = token && token !== 'undefined' && token.trim() !== '';

    if (to.meta.requiresAuth && !isAuthenticated) {
        next({ name: 'login' });
    } else if (to.path === '/adminDashboard') {
        if (!userData) return next({ name: 'login' });
        const user = JSON.parse(userData);
        if (user.rol === 'Administrador') {
            next();
        } else {
            next({ name: 'personalDashboard' });
        }
    } else if (to.path === '/personalDashboard') {
        if (!userData) return next({ name: 'login' });
        const user = JSON.parse(userData);
        if (user.rol === 'Personal') {
            next();
        } else {
            next({ name: 'adminDashboard' });
        }
    } else {
        next();
    }
};

// Crear un enrutador de prueba con el guardián
const createTestRouter = () => {
    const routes = [
        { path: '/login', name: 'login', component: Login, meta: { requiresAuth: false } },
        { path: '/adminDashboard', name: 'adminDashboard', component: AdminDashboard, meta: { requiresAuth: true } },
        { path: '/personalDashboard', name: 'personalDashboard', component: PersonalDashboard, meta: { requiresAuth: true } },
        { path: '/registrar', name: 'registrar', meta: { requiresAuth: true }, component: { template: '<div>Registrar</div>' } },
        { path: '/registrarPatrocinador', name: 'registrarPatrocinador', meta: { requiresAuth: true }, component: { template: '<div>RegistrarPatrocinador</div>' } },
        { path: '/nuevo-participante', name: 'nuevoParticipante', meta: { requiresAuth: true }, component: { template: '<div>NuevoParticipante</div>' } },
        { path: '/editar-participante/:id', name: 'editarParticipante', meta: { requiresAuth: true }, component: { template: '<div>EditarParticipante</div>' } },
        { path: '/', redirect: '/login' },
    ];
    const router = createRouter({
        history: createWebHistory(),
        routes,
    });
    router.beforeEach(routerGuard);
    return router;
};

describe('Pruebas del guardián de rutas del Router', () => {
    beforeEach(() => {
        localStorageMock.clear();
    });

    // Tests existentes
    it('debería redirigir de "/" a "/login"', async () => {
        const testRouter = createTestRouter();
        testRouter.push('/');
        await testRouter.isReady();
        expect(testRouter.currentRoute.value.name).toBe('login');
    });

    it('debería permitir el acceso si una ruta no requiere autenticación', async () => {
        const next = vi.fn();
        const to = { meta: { requiresAuth: false } };
        const from = {};
        await routerGuard(to, from, next);
        expect(next).toHaveBeenCalledWith();
    });

    it('debería redirigir a "/login" si la ruta requiere autenticación y no hay token', async () => {
        const next = vi.fn();
        const to = { name: 'adminDashboard', meta: { requiresAuth: true } };
        const from = {};
        localStorageMock.removeItem('token');
        await routerGuard(to, from, next);
        expect(next).toHaveBeenCalledWith({ name: 'login' });
    });

    it('debería permitir el acceso a "/adminDashboard" a un usuario con rol "Administrador"', async () => {
        const next = vi.fn();
        const token = 'fake-token';
        const user = { rol: 'Administrador' };
        localStorageMock.setItem('token', token);
        localStorageMock.setItem('usuario', JSON.stringify(user));
        const to = { path: '/adminDashboard', meta: { requiresAuth: true } };
        const from = {};
        await routerGuard(to, from, next);
        expect(next).toHaveBeenCalledWith();
    });

    it('debería redirigir a "/personalDashboard" si un usuario de rol "Personal" intenta acceder a "/adminDashboard"', async () => {
        const next = vi.fn();
        const token = 'fake-token';
        const user = { rol: 'Personal' };
        localStorageMock.setItem('token', token);
        localStorageMock.setItem('usuario', JSON.stringify(user));
        const to = { path: '/adminDashboard', meta: { requiresAuth: true } };
        const from = {};
        await routerGuard(to, from, next);
        expect(next).toHaveBeenCalledWith({ name: 'personalDashboard' });
    });

    it('debería permitir el acceso a "/personalDashboard" a un usuario con rol "Personal"', async () => {
        const next = vi.fn();
        const token = 'fake-token';
        const user = { rol: 'Personal' };
        localStorageMock.setItem('token', token);
        localStorageMock.setItem('usuario', JSON.stringify(user));
        const to = { path: '/personalDashboard', meta: { requiresAuth: true } };
        const from = {};
        await routerGuard(to, from, next);
        expect(next).toHaveBeenCalledWith();
    });

    it('debería redirigir a "/adminDashboard" si un usuario de rol "Administrador" intenta acceder a "/personalDashboard"', async () => {
        const next = vi.fn();
        const token = 'fake-token';
        const user = { rol: 'Administrador' };
        localStorageMock.setItem('token', token);
        localStorageMock.setItem('usuario', JSON.stringify(user));
        const to = { path: '/personalDashboard', meta: { requiresAuth: true } };
        const from = {};
        await routerGuard(to, from, next);
        expect(next).toHaveBeenCalledWith({ name: 'adminDashboard' });
    });
    
    // Nuevos tests para las rutas adicionales
    // ---------------------------------------

    it('debería permitir el acceso a "/registrar" a un usuario autenticado', async () => {
        const next = vi.fn();
        const token = 'fake-token';
        const user = { rol: 'Administrador' }; // Rol arbitrario, solo se necesita que esté autenticado
        localStorageMock.setItem('token', token);
        localStorageMock.setItem('usuario', JSON.stringify(user));
        const to = { path: '/registrar', meta: { requiresAuth: true } };
        const from = {};
        await routerGuard(to, from, next);
        expect(next).toHaveBeenCalledWith();
    });

    it('debería permitir el acceso a "/registrarPatrocinador" a un usuario autenticado', async () => {
        const next = vi.fn();
        const token = 'fake-token';
        const user = { rol: 'Personal' }; // Rol arbitrario, solo se necesita que esté autenticado
        localStorageMock.setItem('token', token);
        localStorageMock.setItem('usuario', JSON.stringify(user));
        const to = { path: '/registrarPatrocinador', meta: { requiresAuth: true } };
        const from = {};
        await routerGuard(to, from, next);
        expect(next).toHaveBeenCalledWith();
    });

    it('debería permitir el acceso a "/nuevo-participante" a un usuario autenticado', async () => {
        const next = vi.fn();
        const token = 'fake-token';
        const user = { rol: 'Administrador' };
        localStorageMock.setItem('token', token);
        localStorageMock.setItem('usuario', JSON.stringify(user));
        const to = { path: '/nuevo-participante', meta: { requiresAuth: true } };
        const from = {};
        await routerGuard(to, from, next);
        expect(next).toHaveBeenCalledWith();
    });

    it('debería permitir el acceso a "/editar-participante" a un usuario autenticado', async () => {
        const next = vi.fn();
        const token = 'fake-token';
        const user = { rol: 'Administrador' };
        localStorageMock.setItem('token', token);
        localStorageMock.setItem('usuario', JSON.stringify(user));
        // Se prueba una ruta con parámetro dinámico
        const to = { path: '/editar-participante/123', meta: { requiresAuth: true } };
        const from = {};
        await routerGuard(to, from, next);
        expect(next).toHaveBeenCalledWith();
    });
});