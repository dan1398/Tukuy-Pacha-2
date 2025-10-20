// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import NuevoParticipante from '@/views/NuevoParticipante.vue';
import axios from 'axios';
import { nextTick } from 'vue';

// Mock de vue-router para simular la navegación
const mockRouterPush = vi.fn();
vi.mock('vue-router', () => ({
    useRouter: () => ({
        push: mockRouterPush,
    }),
}));

// Mock de axios para simular las llamadas a la API
vi.mock('axios');

// Mock para simular un archivo de foto y documento
const mockFotoFile = new File(['dummy content'], 'foto.png', { type: 'image/png' });
const mockDocumentoFile = new File(['dummy content'], 'documento.pdf', { type: 'application/pdf' });

// Mock para localStorage, necesario para obtener el ID de usuario
const localStorageMock = {
    store: {
        usuario: JSON.stringify({ id: 1, nombre: 'Personal Test' })
    },
    getItem: vi.fn(key => localStorageMock.store[key] || null),
};
Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
});

// Mock del objeto window.alert
const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

describe('NuevoParticipante.vue', () => {
    // Habilitar temporizadores falsos para toda la suite de pruebas que usen `debouncing` o `setTimeout`.
    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
    });
    
    // Restaurar temporizadores reales después de cada prueba.
    afterEach(() => {
        vi.useRealTimers();
    });

    // Test: El componente se renderiza correctamente con los campos vacíos
    it('debería renderizar el formulario con campos vacíos', async () => {
        const wrapper = mount(NuevoParticipante);
        await nextTick();
        expect(wrapper.vm.codigo).toBe('');
        expect(wrapper.vm.nombre).toBe('');
        expect(wrapper.findAll('.row.g-2').length).toBe(1); // Un documento por defecto
        expect(wrapper.find('h3').text()).toBe('Registrar Nuevo Participante');
    });

    // Test: El botón de cancelar redirige a la página de administración
    it('debería redirigir a /adminDashboard al hacer clic en Cancelar', async () => {
        const wrapper = mount(NuevoParticipante);
        await wrapper.find('.admin-btn-secondary').trigger('click');
        expect(mockRouterPush).toHaveBeenCalledWith('/adminDashboard');
    });

    // --- Pruebas de validación del formulario ---

    // Test: La validación de código funciona correctamente para un formato inválido
    it('debería mostrar un error si el código tiene un formato inválido', async () => {
        const wrapper = mount(NuevoParticipante);
        const codigoInput = wrapper.find('input[placeholder="Ej: TKC 0005 o TKE 1234"]');
        await codigoInput.setValue('INVALIDO');
        await codigoInput.trigger('blur');
        await nextTick();
        expect(wrapper.vm.errorCodigo).not.toBe('');
        expect(wrapper.find('.text-danger').text()).toContain('Formato inválido.');
    });

    // Test: La validación de código funciona correctamente para un formato válido
    it('debería validar el código correctamente para un formato válido', async () => {
        const wrapper = mount(NuevoParticipante);
        const codigoInput = wrapper.find('input[placeholder="Ej: TKC 0005 o TKE 1234"]');
        await codigoInput.setValue('TKC 1234');
        await codigoInput.trigger('blur');
        await nextTick();
        expect(wrapper.vm.errorCodigo).toBe('');
    });
    
    // Test: La validación de dirección funciona correctamente para un formato inválido
    it('debería mostrar un error si la dirección no incluye un departamento boliviano', async () => {
        const wrapper = mount(NuevoParticipante);
        const direccionInput = wrapper.find('input[placeholder="Ej: Av. Arce 1234, La Paz"]');
        await direccionInput.setValue('Calle 1234, Ciudad X');
        await direccionInput.trigger('blur');
        await nextTick();
        expect(wrapper.vm.errorDireccion).not.toBe('');
        expect(wrapper.find('.text-danger').text()).toContain('La dirección debe incluir un departamento boliviano válido');
    });
    
    // Test: La validación de dirección funciona correctamente para un formato válido
    it('debería validar la dirección correctamente si incluye un departamento boliviano', async () => {
        const wrapper = mount(NuevoParticipante);
        const direccionInput = wrapper.find('input[placeholder="Ej: Av. Arce 1234, La Paz"]');
        await direccionInput.setValue('Calle 1234, La Paz');
        await direccionInput.trigger('blur');
        await nextTick();
        expect(wrapper.vm.errorDireccion).toBe('');
    });

    // Test: La validación de celular funciona correctamente para un formato inválido
    it('debería mostrar un error si el celular tiene un formato inválido', async () => {
        const wrapper = mount(NuevoParticipante);
        const celularInput = wrapper.find('input[placeholder="Ej: 78765432"]');
        await celularInput.setValue('12345678');
        await celularInput.trigger('blur');
        await nextTick();
        expect(wrapper.vm.errorCelular).not.toBe('');
        expect(wrapper.find('.text-danger').text()).toContain('Número inválido. Debe tener 8 dígitos y comenzar con 6 o 7.');
    });

    // Test: La validación de celular funciona correctamente para un formato válido
    it('debería validar el celular correctamente para un formato válido', async () => {
        const wrapper = mount(NuevoParticipante);
        const celularInput = wrapper.find('input[placeholder="Ej: 78765432"]');
        await celularInput.setValue('78765432');
        await celularInput.trigger('blur');
        await nextTick();
        expect(wrapper.vm.errorCelular).toBe('');
    });

    // --- Pruebas de manejo de patrocinadores ---

    // Test: La búsqueda de patrocinadores funciona correctamente
    it('debería buscar patrocinadores y mostrar los resultados', async () => {
        const mockPatrocinadores = [{ id_patrocinador: 1, nombre: 'Patrocinador Test' }];
        axios.get.mockResolvedValueOnce({ data: mockPatrocinadores });

        const wrapper = mount(NuevoParticipante);
        const busquedaInput = wrapper.find('input[placeholder="Buscar por nombre..."]');
        await busquedaInput.setValue('Pat');
        await nextTick();
        
        // Simular el debouncing
        await vi.advanceTimersByTime(300);

        expect(axios.get).toHaveBeenCalledWith('http://localhost:3000/api/patrocinadores', {
            params: { busqueda: 'Pat' }
        });
        await flushPromises(); // Esperar a que las promesas se resuelvan
        expect(wrapper.findAll('li.list-group-item').length).toBe(1);
        expect(wrapper.find('li.list-group-item').text()).toBe('Patrocinador Test');
    });

    // Test: La selección de un patrocinador completa los campos de solo lectura
    it('debería completar los campos de patrocinador al seleccionar uno', async () => {
        const mockPatrocinadores = [{ id_patrocinador: 1, nombre: 'Patrocinador', apellido_paterno: 'Apellido' }];
        axios.get.mockResolvedValueOnce({ data: mockPatrocinadores });

        const wrapper = mount(NuevoParticipante);
        const busquedaInput = wrapper.find('input[placeholder="Buscar por nombre..."]');
        await busquedaInput.setValue('Pat');
        await vi.advanceTimersByTime(300); // Avanzar temporizadores para que se active la búsqueda
        await flushPromises(); // Esperar a que la búsqueda se complete

        await wrapper.find('li.list-group-item').trigger('click');
        await nextTick();

        expect(wrapper.vm.nombrePatrocinador).toBe('Patrocinador');
        expect(wrapper.vm.apellidoPaternoPatrocinador).toBe('Apellido');
        expect(wrapper.vm.idPatrocinador).toBe(1);
    });

    // Test: El botón de limpiar patrocinador borra los campos
    it('debería limpiar los campos de patrocinador al hacer clic en Limpiar', async () => {
        const wrapper = mount(NuevoParticipante);
        wrapper.vm.nombrePatrocinador = 'Patrocinador';
        wrapper.vm.idPatrocinador = 1;
        await nextTick();
        
        await wrapper.find('.btn-outline-secondary').trigger('click');
        await nextTick();

        expect(wrapper.vm.nombrePatrocinador).toBe('');
        expect(wrapper.vm.idPatrocinador).toBe(null);
    });

    // --- Pruebas de manejo de documentos ---

    // Test: Se agrega un nuevo campo de documento al hacer clic en "Añadir Documento"
    it('debería añadir un nuevo campo de documento', async () => {
        const wrapper = mount(NuevoParticipante);
        const initialDocs = wrapper.vm.documentos.length;
        await wrapper.find('.admin-btn-outline').trigger('click');
        expect(wrapper.vm.documentos.length).toBe(initialDocs + 1);
        expect(wrapper.findAll('.row.g-2').length).toBe(initialDocs + 1);
    });

    // Test: Se elimina un campo de documento al hacer clic en "Eliminar"
    it('debería eliminar un campo de documento', async () => {
        const wrapper = mount(NuevoParticipante);
        // Primero agregar uno para que haya al menos dos
        await wrapper.find('.admin-btn-outline').trigger('click');
        const initialDocs = wrapper.vm.documentos.length;
        await wrapper.findAll('.btn-danger')[1].trigger('click');
        expect(wrapper.vm.documentos.length).toBe(initialDocs - 1);
        expect(wrapper.findAll('.row.g-2').length).toBe(initialDocs - 1);
    });
    
    // Test: La carga de un archivo de documento con un tipo inválido muestra una alerta
    it('debería mostrar una alerta si se sube un tipo de archivo de documento inválido', async () => {
        const wrapper = mount(NuevoParticipante);
        const invalidFile = new File(['dummy'], 'invalid.txt', { type: 'text/plain' });
        const docInput = wrapper.find('input[type="file"][accept=".pdf,.jpg,.jpeg,.png,.xls,.xlsx"]');
        
        Object.defineProperty(docInput.element, 'files', {
            value: [invalidFile]
        });
        await docInput.trigger('change');
        
        expect(alertMock).toHaveBeenCalledWith(
            'Tipo de archivo no permitido. Solo se permiten PDF, imágenes (JPEG, PNG) y hojas de cálculo (Excel).'
        );
        expect(wrapper.vm.documentos[0].archivo).toBe(null);
    });

    // Test: La carga de un archivo de foto con un tipo inválido muestra una alerta
    it('debería mostrar una alerta si se sube un tipo de archivo de foto inválido', async () => {
        const wrapper = mount(NuevoParticipante);
        const invalidFile = new File(['dummy'], 'invalid.txt', { type: 'text/plain' });
        const fotoInput = wrapper.find('input[type="file"][name="foto"]');
        
        Object.defineProperty(fotoInput.element, 'files', {
            value: [invalidFile]
        });
        await fotoInput.trigger('change');
        
        expect(alertMock).toHaveBeenCalledWith(
            'Solo se permiten imágenes JPG o PNG para la foto del participante.'
        );
        expect(wrapper.vm.foto).toBe(null);
    });

    // --- Pruebas de envío del formulario ---
    
    // Test: Envío exitoso del formulario
    it('debería registrar un participante y sus documentos con éxito', async () => {
        // Mocks de las respuestas de la API
        axios.post.mockResolvedValueOnce({ data: { id: 101 } });
        axios.post.mockResolvedValue({ data: { id: 201 } }); // Para los documentos

        const wrapper = mount(NuevoParticipante);
        await nextTick();
        
        // Rellenar los campos requeridos
        const codigoInput = wrapper.find('input[placeholder="Ej: TKC 0005 o TKE 1234"]');
        await codigoInput.setValue('TKC 0001');
        const nombreInput = wrapper.find('input[type="text"][name="nombre"]');
        await nombreInput.setValue('Test');
        const ciInput = wrapper.find('input[name="ci"]');
        await ciInput.setValue('1234567');
        const fechaNacimientoInput = wrapper.find('input[name="fechaNacimiento"]');
        await fechaNacimientoInput.setValue('2000-01-01');
        const direccionInput = wrapper.find('input[placeholder="Ej: Av. Arce 1234, La Paz"]');
        await direccionInput.setValue('Calle Falsa 123, Cochabamba');
        const celularInput = wrapper.find('input[placeholder="Ej: 78765432"]');
        await celularInput.setValue('71234567');
        
        // Subir la foto
        const fotoInput = wrapper.find('input[type="file"][name="foto"]');
        Object.defineProperty(fotoInput.element, 'files', {
            value: [mockFotoFile]
        });
        await fotoInput.trigger('change');

        // Subir un documento
        const docSelect = wrapper.find('select');
        await docSelect.setValue('Formulario');
        const docInput = wrapper.find('input[type="file"][accept=".pdf,.jpg,.jpeg,.png,.xls,.xlsx"]');
        Object.defineProperty(docInput.element, 'files', {
            value: [mockDocumentoFile]
        });
        await docInput.trigger('change');

        // Enviar el formulario
        await wrapper.find('form').trigger('submit.prevent');
        await flushPromises(); // Esperar a que las promesas se resuelvan

        // Verificar que las llamadas a la API se hicieron
        expect(axios.post).toHaveBeenCalledTimes(2); // Una para el participante, otra para el documento
        expect(axios.post).toHaveBeenCalledWith('http://localhost:3000/api/participantes', expect.any(FormData));
        expect(axios.post).toHaveBeenCalledWith('http://localhost:3000/api/documentos', expect.any(FormData));

        // Verificar el mensaje de éxito
        expect(wrapper.find('.alert-success').text()).toBe('Participante y documentos registrados correctamente.');

        // Verificar que el formulario se limpió
        expect(wrapper.vm.nombre).toBe('');
    });

    // Test: Envío del formulario fallido
    it('debería mostrar un mensaje de error si la API falla', async () => {
        // Simular un fallo en la API de participantes
        axios.post.mockRejectedValueOnce({ response: { data: { mensaje: 'Error de servidor' } } });

        const wrapper = mount(NuevoParticipante);
        await nextTick();
        
        // Rellenar campos válidos para que las validaciones pasen
        const codigoInput = wrapper.find('input[placeholder="Ej: TKC 0005 o TKE 1234"]');
        await codigoInput.setValue('TKC 0001');
        const nombreInput = wrapper.find('input[type="text"][name="nombre"]');
        await nombreInput.setValue('Test');
        const ciInput = wrapper.find('input[name="ci"]');
        await ciInput.setValue('1234567');
        const fechaNacimientoInput = wrapper.find('input[name="fechaNacimiento"]');
        await fechaNacimientoInput.setValue('2000-01-01');
        const direccionInput = wrapper.find('input[placeholder="Ej: Av. Arce 1234, La Paz"]');
        await direccionInput.setValue('Calle Falsa 123, Cochabamba');
        const celularInput = wrapper.find('input[placeholder="Ej: 78765432"]');
        await celularInput.setValue('71234567');
        
        // Subir la foto
        const fotoInput = wrapper.find('input[type="file"][name="foto"]');
        Object.defineProperty(fotoInput.element, 'files', {
            value: [mockFotoFile]
        });
        await fotoInput.trigger('change');
        
        // Subir un documento
        const docSelect = wrapper.find('select');
        await docSelect.setValue('Formulario');
        const docInput = wrapper.find('input[type="file"][accept=".pdf,.jpg,.jpeg,.png,.xls,.xlsx"]');
        Object.defineProperty(docInput.element, 'files', {
            value: [mockDocumentoFile]
        });
        await docInput.trigger('change');

        // Enviar el formulario
        await wrapper.find('form').trigger('submit.prevent');
        await flushPromises(); // Esperar a que las promesas se resuelvan

        // Verificar el mensaje de error
        expect(wrapper.find('.alert-danger').text()).toContain('Error de servidor');
    });
});
