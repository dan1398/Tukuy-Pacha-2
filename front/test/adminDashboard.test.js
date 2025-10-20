// test/adminDashboard.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import AdminDashboard from '@/views/AdminDashboard.vue';
import axios from 'axios';
import { nextTick } from 'vue';

// Mock de localStorage
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

// Mock de vue-router
const mockRouterPush = vi.fn();
vi.mock('vue-router', () => ({
    useRouter: () => ({
        push: mockRouterPush,
    }),
}));

// Mock de axios
vi.mock('axios');

// Mock de html2pdf
const mockHtml2pdf = {
    from: vi.fn(() => mockHtml2pdf),
    set: vi.fn(() => mockHtml2pdf),
    save: vi.fn(() => Promise.resolve()),
};
vi.mock('html2pdf.js', () => ({
    __esModule: true,
    default: vi.fn(() => mockHtml2pdf),
}));

// Mock de la librería vue-tel-input
vi.mock('vue-tel-input', () => ({
    VueTelInput: {
        template: '<input type="tel" class="vue-tel-input" @input="$emit(\'update:modelValue\', $event.target.value)" />',
        props: ['modelValue'],
    },
}));

// Mocks de los componentes que no se quieren renderizar
vi.mock('@/views/Registrar.vue', () => ({
  __esModule: true,
  default: {
    name: 'Registrar',
    template: '<div>Mocked Registrar</div>'
  }
}));
vi.mock('@/views/RegistrarPatrocinador.vue', () => ({
  __esModule: true,
  default: {
    name: 'RegistrarPatrocinador',
    template: '<div>Mocked RegistrarPatrocinador</div>'
  }
}));
vi.mock('@/views/EditarParticipante.vue', () => ({
  __esModule: true,
  default: {
    name: 'EditarParticipante',
    template: '<div>Mocked EditarParticipante</div>'
  }
}));

// Función de ayuda para esperar a que un elemento exista
async function waitForElement(wrapper, selector, timeout = 2000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        const element = wrapper.find(selector);
        if (element.exists()) {
            return element;
        }
        await nextTick();
    }
    throw new Error(`Element with selector "${selector}" not found within timeout.`);
}


describe('AdminDashboard.vue', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorageMock.clear();
        localStorageMock.setItem('usuario', JSON.stringify({ nombre: 'Admin', rol: 'Administrador' }));
    });

    it('debería renderizar y mostrar el nombre y rol del usuario', async () => {
        const wrapper = mount(AdminDashboard, {
            global: {
                stubs: {
                    teleport: true
                }
            }
        });
        await nextTick();
        expect(wrapper.find('.user-name').text()).toBe('Admin');
        expect(wrapper.find('.user-role').text()).toBe('Perfil: Administrador');
    });

    it('debería redirigir a /login si no hay usuario en localStorage', () => {
        localStorageMock.clear();
        mount(AdminDashboard, {
            global: {
                stubs: {
                    teleport: true
                }
            }
        });
        expect(mockRouterPush).toHaveBeenCalledWith('/login');
    });

    it('debería cerrar sesión y redirigir a /login', async () => {
        const wrapper = mount(AdminDashboard, {
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

    it('debería navegar a la ruta /registrar al hacer clic en "Registrar Nuevo Usuario"', async () => {
        const wrapper = mount(AdminDashboard, {
            global: {
                stubs: {
                    teleport: true
                }
            }
        });
        await wrapper.find('button.btn-tukuypacha-sidebar:nth-of-type(1)').trigger('click');
        expect(mockRouterPush).toHaveBeenCalledWith('/registrar');
    });

    it('debería navegar a la ruta /registrarPatrocinador al hacer clic en "Registrar Nuevo Patrocinador"', async () => {
        const wrapper = mount(AdminDashboard, {
            global: {
                stubs: {
                    teleport: true
                }
            }
        });
        await wrapper.find('button.btn-tukuypacha-sidebar:nth-of-type(3)').trigger('click');
        expect(mockRouterPush).toHaveBeenCalledWith('/registrarPatrocinador');
    });

    it('debería navegar a la ruta /nuevo-participante al hacer clic en "Nuevo Participante"', async () => {
        const wrapper = mount(AdminDashboard, {
            global: {
                stubs: {
                    teleport: true
                }
            }
        });
        await nextTick();
        await wrapper.find('button.btn-tukuypacha').trigger('click');
        expect(mockRouterPush).toHaveBeenCalledWith('/nuevo-participante');
    });

    it('debería buscar participantes después de 300ms de escribir 3 o más caracteres', async () => {
        vi.useFakeTimers();
        axios.get.mockResolvedValueOnce({ data: [] });
        const wrapper = mount(AdminDashboard, {
            global: {
                stubs: {
                    teleport: true
                }
            }
        });

        const input = wrapper.find('input[type="text"]');
        await input.setValue('test');

        expect(axios.get).not.toHaveBeenCalled();

        await vi.advanceTimersByTime(300);

        expect(axios.get).toHaveBeenCalledWith(`http://localhost:3000/api/participantes/buscar?termino=test`);

        vi.useRealTimers();
    });

    it('debería seleccionar un participante y cargar sus documentos si hay un solo resultado', async () => {
        vi.useFakeTimers();
        const mockParticipante = { id_participante: 1, nombre: 'Juan', apellido_paterno: 'Perez', apellido_materno: null };
        const mockDocumentos = [{ id_documento: 101, nombre_archivo: 'doc1.pdf', ruta_archivo: 'ruta/doc1.pdf' }];

        axios.get.mockResolvedValueOnce({ data: [mockParticipante] });
        axios.get.mockResolvedValueOnce({ data: mockDocumentos });

        const wrapper = mount(AdminDashboard, {
            global: {
                stubs: {
                    teleport: true,
                    VueTelInput: true,
                }
            }
        });

        await wrapper.find('input[type="text"]').setValue('juan');
        await vi.advanceTimersByTime(300);
        await nextTick();

        expect(wrapper.vm.participanteSeleccionado).toEqual(mockParticipante);
        expect(wrapper.vm.documentos).toEqual(mockDocumentos);

        await nextTick();

        expect(wrapper.find('.participant-title').text()).toBe('Juan Perez');
        expect(wrapper.find('button.btn-tukuypacha-success').text()).toBe('Descargar PDF');

        vi.useRealTimers();
    });

    it('debería descargar el PDF del participante seleccionado', async () => {
        const mockParticipante = { id_participante: 1, nombre: 'Juan', codigo: 'ABC1234' };
        const wrapper = mount(AdminDashboard, {
            global: {
                stubs: {
                    teleport: true
                }
            }
        });

        wrapper.vm.participanteSeleccionado = mockParticipante;
        await nextTick();

        await wrapper.find('button.btn-tukuypacha-success').trigger('click');

        expect(mockHtml2pdf.from).toHaveBeenCalledWith(wrapper.vm.$refs.cardParticipante);
        expect(mockHtml2pdf.set).toHaveBeenCalledWith(expect.objectContaining({ filename: 'Participante_ABC1234.pdf' }));
        expect(mockHtml2pdf.save).toHaveBeenCalled();
    });

    it('debería cargar la lista de usuarios al abrir el modal', async () => {
        const mockUsuarios = [{ id_usuario: 1, nombre: 'Test', correo: 'test@example.com', rol: 'Personal' }];
        axios.get.mockResolvedValue({ data: mockUsuarios });

        const wrapper = mount(AdminDashboard, {
            global: {
                stubs: {
                    teleport: true
                }
            }
        });

        await wrapper.find('button.btn-tukuypacha-sidebar:nth-of-type(2)').trigger('click');
        await nextTick();

        expect(axios.get).toHaveBeenCalledWith('http://localhost:3000/api/usuarios');
        expect(wrapper.vm.usuarios).toEqual(mockUsuarios);
        expect(wrapper.find('.modal-title').text()).toBe('Lista de Usuarios');
        expect(wrapper.find('table tbody tr').exists()).toBe(true);
    });

    it('debería permitir editar y guardar un usuario', async () => {
        const mockUsuarios = [{ id_usuario: 1, nombre: 'Test', apellido_paterno: 'User', apellido_materno: null, correo: 'test@example.com', rol: 'Personal' }];
        axios.get.mockResolvedValueOnce({ data: mockUsuarios });
        axios.put.mockResolvedValueOnce({});

        const wrapper = mount(AdminDashboard, {
            global: {
                stubs: {
                    teleport: true
                }
            }
        });

        await wrapper.find('button.btn-tukuypacha-sidebar:nth-of-type(2)').trigger('click');
        await nextTick();

        const userRow = wrapper.find('tr[data-id="1"]');
        expect(userRow.exists()).toBe(true);
        
        await userRow.find('.fa-edit').trigger('click');

        // Espera de forma robusta a que el input aparezca
        const nombreInput = await waitForElement(userRow, 'input.admin-input-table');
        
        expect(nombreInput.exists()).toBe(true);
        await nombreInput.setValue('NuevoNombre');
        await nextTick();

        await userRow.find('.fa-save').trigger('click');
        await nextTick();
        
        expect(axios.put).toHaveBeenCalledWith('http://localhost:3000/api/usuarios/1', {
            nombre: 'NuevoNombre',
            correo: 'test@example.com',
            apellido_paterno: 'User',
            apellido_materno: null,
            rol: 'Personal'
        });
    });

    it('debería permitir editar y guardar un patrocinador', async () => {
        const mockPatrocinadores = [{ id_patrocinador: 1, nombre: 'Sponsor', apellido_paterno: 'Inc.', apellido_materno: null, celular: '123456789', correo: 'sponsor@example.com' }];
        axios.get.mockResolvedValueOnce({ data: mockPatrocinadores });
        axios.put.mockResolvedValueOnce({});

        const wrapper = mount(AdminDashboard, {
            global: {
                stubs: {
                    teleport: true,
                    VueTelInput: true,
                }
            }
        });

        await wrapper.find('button.btn-tukuypacha-sidebar:nth-of-type(4)').trigger('click');
        await nextTick();

        const patrocinadorRow = wrapper.find('tr[data-id="1"]');
        expect(patrocinadorRow.exists()).toBe(true);

        await patrocinadorRow.find('.fa-edit').trigger('click');
        
        // Espera de forma robusta a que el input aparezca
        const nombreInput = await waitForElement(patrocinadorRow, 'input.admin-input-table');
        
        expect(nombreInput.exists()).toBe(true);
        await nombreInput.setValue('NuevoNombreSponsor');
        await nextTick();
        
        await patrocinadorRow.find('.fa-save').trigger('click');
        await nextTick();

        expect(axios.put).toHaveBeenCalledWith('http://localhost:3000/api/patrocinadores/1', {
            nombre: 'NuevoNombreSponsor',
            apellido_paterno: 'Inc.',
            apellido_materno: null,
            celular: '123456789',
            correo: 'sponsor@example.com'
        });
    });

    it('debería eliminar un usuario', async () => {
        const mockUsuarios = [{ id_usuario: 1, nombre: 'Test', correo: 'test@example.com', rol: 'Personal' }];
        axios.get.mockResolvedValue({ data: mockUsuarios });
        axios.delete.mockResolvedValue({});

        const wrapper = mount(AdminDashboard, {
            global: {
                stubs: {
                    teleport: true
                }
            }
        });

        await wrapper.find('button.btn-tukuypacha-sidebar:nth-of-type(2)').trigger('click');
        await nextTick();

        const deleteButton = wrapper.find('.fa-trash-alt');
        await deleteButton.trigger('click');

        expect(axios.delete).toHaveBeenCalledWith('http://localhost:3000/api/usuarios/1');
    });

    it('debería eliminar un patrocinador', async () => {
        const mockPatrocinadores = [{ id_patrocinador: 1, nombre: 'Sponsor' }];
        axios.get.mockResolvedValue({ data: mockPatrocinadores });
        axios.delete.mockResolvedValue({});

        const wrapper = mount(AdminDashboard, {
            global: {
                stubs: {
                    teleport: true,
                    VueTelInput: true,
                }
            }
            });

        await wrapper.find('button.btn-tukuypacha-sidebar:nth-of-type(4)').trigger('click');
        await nextTick();

        const deleteButton = wrapper.find('.fa-trash-alt');
        await deleteButton.trigger('click');

        expect(axios.delete).toHaveBeenCalledWith('http://localhost:3000/api/patrocinadores/1');
    });
});
