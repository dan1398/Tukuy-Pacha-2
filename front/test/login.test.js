// login.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import Login from '../src/views/Login.vue';
import axios from 'axios';

// Mock de las dependencias externas
vi.mock('axios');

// Mockea vue-router para simular la navegación
const mockRouterPush = vi.fn();
vi.mock('vue-router', () => ({
    useRouter: () => ({
        push: mockRouterPush,
    }),
}));

// Mock unificado de localStorage con un objeto interno para almacenar datos
const mockLocalStorage = {
    store: {},
    getItem: vi.fn(key => mockLocalStorage.store[key] || null),
    setItem: vi.fn((key, value) => { mockLocalStorage.store[key] = value.toString(); }),
    removeItem: vi.fn(key => { delete mockLocalStorage.store[key]; }),
    clear: vi.fn(() => { mockLocalStorage.store = {}; }),
};

Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
});

describe('Login.vue', () => {
    beforeEach(() => {
        // Restablece los mocks antes de cada prueba para asegurar que no se interfieran
        vi.clearAllMocks();
        mockLocalStorage.clear();
    });

    it('debería renderizar el formulario de login correctamente', () => {
        const wrapper = mount(Login);
        expect(wrapper.find('h3').text()).toBe('Iniciar Sesión');
        expect(wrapper.find('input[type="email"]').exists()).toBe(true);
        expect(wrapper.find('input[type="password"]').exists()).toBe(true);
        expect(wrapper.find('button[type="submit"]').text()).toBe('Ingresar');
    });

    it('debería iniciar sesión correctamente para un Administrador', async () => {
        axios.post.mockResolvedValue({
            data: {
                token: 'mock-token-admin',
                usuario: { rol: 'Administrador' },
            },
        });

        const wrapper = mount(Login);
        await wrapper.find('input[type="email"]').setValue('admin@test.com');
        await wrapper.find('input[type="password"]').setValue('password123');
        await wrapper.find('form').trigger('submit.prevent');

        expect(axios.post).toHaveBeenCalledWith('http://localhost:3000/api/auth/login', {
            correo: 'admin@test.com',
            contraseña: 'password123',
        });

        expect(localStorage.setItem).toHaveBeenCalledWith('token', 'mock-token-admin');
        expect(localStorage.setItem).toHaveBeenCalledWith('usuario', JSON.stringify({ rol: 'Administrador' }));

        expect(mockRouterPush).toHaveBeenCalledWith('/adminDashboard');
    });

    it('debería iniciar sesión correctamente para un usuario Personal', async () => {
        axios.post.mockResolvedValue({
            data: {
                token: 'mock-token-personal',
                usuario: { rol: 'Personal' },
            },
        });

        const wrapper = mount(Login);
        await wrapper.find('input[type="email"]').setValue('user@test.com');
        await wrapper.find('input[type="password"]').setValue('password123');
        await wrapper.find('form').trigger('submit.prevent');

        expect(axios.post).toHaveBeenCalledWith('http://localhost:3000/api/auth/login', {
            correo: 'user@test.com',
            contraseña: 'password123',
        });
        expect(localStorage.setItem).toHaveBeenCalledWith('token', 'mock-token-personal');
        expect(localStorage.setItem).toHaveBeenCalledWith('usuario', JSON.stringify({ rol: 'Personal' }));

        expect(mockRouterPush).toHaveBeenCalledWith('/personalDashboard');
    });

    it('debería mostrar una alerta en caso de credenciales incorrectas', async () => {
        axios.post.mockRejectedValue({ response: { status: 401 } });
        
        const mockAlert = vi.fn();
        window.alert = mockAlert;

        const wrapper = mount(Login);
        await wrapper.find('input[type="email"]').setValue('wrong@test.com');
        await wrapper.find('input[type="password"]').setValue('wrongpass');
        await wrapper.find('form').trigger('submit.prevent');

        await vi.waitFor(() => {
            expect(axios.post).toHaveBeenCalled();
            expect(mockAlert).toHaveBeenCalledWith('Credenciales incorrectas');
        });

        expect(mockRouterPush).not.toHaveBeenCalled();
        expect(localStorage.setItem).not.toHaveBeenCalled();
    });
});