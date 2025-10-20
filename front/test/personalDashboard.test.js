import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import PersonalDashboard from '@/views/PersonalDashboard.vue';
import axios from 'axios';
import { nextTick } from 'vue';

// Mock de localStorage para simular el almacenamiento del navegador
const localStorageMock = {
    store: {},
    getItem: vi.fn(key => localStorageMock.store[key] || null),
    setItem: vi.fn((key, value) => { localStorageMock.store[key] = value.toString(); }),
    removeItem: vi.fn(key => { delete localStorageMock.store[key]; }),
    clear: vi.fn(() => { localStorageMock.store = {}; }),
};
Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
});

// Mock de vue-router para simular la navegación
const mockRouterPush = vi.fn();
vi.mock('vue-router', () => ({
    useRouter: () => ({
        push: mockRouterPush,
    }),
}));

// Mock de axios para simular las llamadas a la API
vi.mock('axios');

// Mock de html2pdf para simular la generación de PDF
const mockHtml2pdf = {
    from: vi.fn(() => mockHtml2pdf),
    set: vi.fn(() => mockHtml2pdf),
    save: vi.fn(() => Promise.resolve()),
};
vi.mock('html2pdf.js', () => ({
    __esModule: true,
    default: vi.fn(() => mockHtml2pdf),
}));

// Mocks para los componentes que se importan pero no se quieren renderizar en el test
vi.mock('@/views/Registrar.vue', () => ({
  __esModule: true,
  default: {
    name: 'Registrar',
    template: '<div>Mocked Registrar</div>'
  }
}));

describe('PersonalDashboard.vue', () => {
    // Configuración inicial antes de cada prueba
    beforeEach(() => {
        vi.clearAllMocks();
        localStorageMock.clear();
        // Simular un usuario logueado
        localStorageMock.setItem('usuario', JSON.stringify({ nombre: 'Personal User', rol: 'Personal' }));
    });

    // Test: El componente se renderiza correctamente y muestra el nombre y rol del usuario
    it('debería renderizar y mostrar el nombre y rol del usuario', async () => {
        const wrapper = mount(PersonalDashboard, {
            global: {
                stubs: {
                    teleport: true
                }
            }
        });
        await nextTick();
        expect(wrapper.find('.user-name').text()).toBe('Personal User');
        expect(wrapper.find('.user-role').text()).toBe('Perfil: Personal');
    });

    // Test: Redirecciona a la página de login si no hay usuario en localStorage
    it('debería redirigir a /login si no hay usuario en localStorage', () => {
        localStorageMock.clear();
        mount(PersonalDashboard, {
            global: {
                stubs: {
                    teleport: true
                }
            }
        });
        expect(mockRouterPush).toHaveBeenCalledWith('/login');
    });

    // Test: Cierra la sesión y redirecciona a la página de login
    it('debería cerrar sesión y redirigir a /login', async () => {
        const wrapper = mount(PersonalDashboard, {
            global: {
                stubs: {
                    teleport: true
                }
            }
        });
        await wrapper.find('.btn-tukuypacha-danger').trigger('click');
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('usuario');
        expect(localStorageMock.clear).toHaveBeenCalled();
        expect(mockRouterPush).toHaveBeenCalledWith('/login');
    });

    // Test: Navega a la ruta de registro de participante
    it('debería navegar a la ruta /nuevo-participante', async () => {
        const wrapper = mount(PersonalDashboard, {
            global: {
                stubs: {
                    teleport: true
                }
            }
        });
        // Click en el botón de la barra lateral
        await wrapper.find('.sidebar-buttons button').trigger('click');
        expect(mockRouterPush).toHaveBeenCalledWith('/nuevo-participante');
    });

    // Test: Busca participantes con un retraso de 300ms al escribir 3 o más caracteres
    it('debería buscar participantes después de 300ms de escribir 3 o más caracteres', async () => {
        vi.useFakeTimers();
        axios.get.mockResolvedValueOnce({ data: [] });
        const wrapper = mount(PersonalDashboard, {
            global: {
                stubs: {
                    teleport: true
                }
            }
        });

        const input = wrapper.find('input[type="text"]');
        await input.setValue('test');
        
        // La llamada a la API no debería ocurrir inmediatamente
        expect(axios.get).not.toHaveBeenCalled();

        await vi.advanceTimersByTime(300);

        // La llamada a la API debería ocurrir después del retraso
        expect(axios.get).toHaveBeenCalledWith(`http://localhost:3000/api/participantes/buscar?termino=test`);

        vi.useRealTimers();
    });

    // Test: No debería buscar si la cadena de búsqueda es menor a 3 caracteres
    it('no debería buscar participantes si la cadena de búsqueda es menor a 3 caracteres', async () => {
        vi.useFakeTimers();
        const wrapper = mount(PersonalDashboard, {
            global: {
                stubs: {
                    teleport: true
                }
            }
        });

        const input = wrapper.find('input[type="text"]');
        await input.setValue('te'); // Solo 2 caracteres
        
        await vi.advanceTimersByTime(500);

        expect(axios.get).not.toHaveBeenCalled();
        vi.useRealTimers();
    });

    // Test: Selecciona un participante y carga sus documentos si hay un solo resultado
    it('debería seleccionar un participante y cargar sus documentos si hay un solo resultado', async () => {
        vi.useFakeTimers();
        const mockParticipante = { id_participante: 1, nombre: 'Juan', apellido_paterno: 'Perez', apellido_materno: null, codigo: 'ABC1234' };
        const mockDocumentos = [{ id_documento: 101, nombre_archivo: 'doc1.pdf', ruta_archivo: 'ruta/doc1.pdf' }];

        axios.get.mockResolvedValueOnce({ data: [mockParticipante] }); // Mock para la búsqueda
        axios.get.mockResolvedValueOnce({ data: mockDocumentos }); // Mock para los documentos

        const wrapper = mount(PersonalDashboard, {
            global: {
                stubs: {
                    teleport: true,
                }
            }
        });

        await wrapper.find('input[type="text"]').setValue('juan');
        await vi.advanceTimersByTime(300);
        await nextTick();

        // Se verifica que el participante y los documentos se hayan cargado correctamente
        expect(wrapper.vm.participanteSeleccionado).toEqual(mockParticipante);
        expect(wrapper.vm.documentos).toEqual(mockDocumentos);

        await nextTick();

        // Se verifica que la información del participante se muestre en el DOM
        expect(wrapper.find('.participant-title').text()).toBe('Juan Perez');
        expect(wrapper.find('button.btn-tukuypacha-success').text()).toBe('Descargar PDF');

        vi.useRealTimers();
    });

    // Test: Descarga el PDF del participante seleccionado
    it('debería descargar el PDF del participante seleccionado', async () => {
        const mockParticipante = { id_participante: 1, nombre: 'Juan', codigo: 'ABC1234' };
        const wrapper = mount(PersonalDashboard, {
            global: {
                stubs: {
                    teleport: true
                }
            }
        });

        // Simular que un participante ya está seleccionado
        wrapper.vm.participanteSeleccionado = mockParticipante;
        await nextTick();

        // Simular el clic en el botón de descarga
        await wrapper.find('button.btn-tukuypacha-success').trigger('click');

        // Verificar que las funciones de html2pdf se llamaron correctamente
        expect(mockHtml2pdf.from).toHaveBeenCalledWith(wrapper.vm.$refs.cardParticipante);
        expect(mockHtml2pdf.set).toHaveBeenCalledWith(expect.objectContaining({ filename: 'Participante_ABC1234.pdf' }));
        expect(mockHtml2pdf.save).toHaveBeenCalled();
    });
});
