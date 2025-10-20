// @vitest-environment jsdom
import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRouter, createMemoryHistory } from 'vue-router';
import { nextTick } from 'vue';
import axios from 'axios';
import EditarParticipante from '@/views/EditarParticipante.vue';

// Mock axios
vi.mock('axios');

// Mockear setTimeout para poder controlarlo en los tests
vi.useFakeTimers();

const mockParticipanteId = '123e4567-e89b-12d3-a456-426614174000';

const mockParticipante = {
  id_participante: mockParticipanteId,
  codigo: 'TKC 2905',
  nombre: 'Juan',
  apellido_paterno: 'Perez',
  apellido_materno: 'Gomez',
  CI: '1234567',
  fecha_nacimiento: '2000-01-01T00:00:00.000Z',
  direccion: 'Calle Falsa 123, Cochabamba',
  celular: '70012345',
  patrocinador: { id_patrocinador: 'pat1', nombre: 'Patrocinador A' },
  patrocinador_nombre: 'Patrocinador A',
  patrocinador_apellido_paterno: 'PaternoA',
  patrocinador_apellido_materno: 'MaternoA',
  patrocinador_celular: '77777777',
  patrocinador_correo: 'pat@test.com'
};

const mockDocumentos = [
  { id_documento: 'doc1', tipo_documento: 'Formulario', ruta_archivo: 'ruta/doc1.pdf', nombre_archivo: 'doc1.pdf' },
  { id_documento: 'doc2', tipo_documento: 'Correspondencia', ruta_archivo: 'ruta/doc2.jpg', nombre_archivo: 'doc2.jpg' },
];

const mockPatrocinadores = [
  { id_patrocinador: 'pat1', nombre: 'Patrocinador A', apellido_paterno: 'PaternoA', apellido_materno: 'MaternoA' },
  { id_patrocinador: 'pat2', nombre: 'Patrocinador B', apellido_paterno: 'PaternoB', apellido_materno: 'MaternoB' },
];

describe('editarParticipante.vue', () => {
  let router;
  let pushSpy;

  beforeEach(async () => {
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/adminDashboard', name: 'adminDashboard', component: { template: '<div>Dashboard</div>' } },
        { path: '/editarParticipante/:id_participante', name: 'editarParticipante', component: EditarParticipante, props: true },
      ],
    });

    vi.resetAllMocks();
    vi.clearAllMocks();
    
    // Configura los mocks de axios
    axios.get.mockImplementation((url, config = {}) => {
      if (url.includes(`/participantes/${mockParticipanteId}`)) {
        return Promise.resolve({ data: mockParticipante });
      }
      if (url.includes(`/documentos?participanteId=${mockParticipanteId}`)) {
        return Promise.resolve({ data: mockDocumentos });
      }
      if (url.includes('/patrocinadores')) {
        const query = config.params?.busqueda;
        if (query === 'NoExiste') {
          return Promise.resolve({ data: [] });
        }
        return Promise.resolve({ data: mockPatrocinadores });
      }
      return Promise.reject(new Error(`URL no simulada: ${url}`));
    });

    axios.put.mockResolvedValue({ status: 200, data: {} });
    axios.post.mockResolvedValue({ status: 201, data: {} });
    axios.delete.mockResolvedValue({ status: 200, data: {} });

    Object.defineProperty(window, 'localStorage', {
      writable: true,
      value: {
        getItem: vi.fn(() => JSON.stringify({ id: 'user123' })),
      },
    });

    pushSpy = vi.spyOn(router, 'push');

    await router.push({ name: 'editarParticipante', params: { id_participante: mockParticipanteId } });
    await router.isReady();
  });

  const mountComponent = async () => {
    const wrapper = mount(EditarParticipante, {
      global: {
        plugins: [router],
        stubs: { 'router-link': true },
      },
    });
    await flushPromises();
    await nextTick();
    return wrapper;
  };

  it('muestra un mensaje de carga inicial y luego los datos', async () => {
    const freshWrapper = mount(EditarParticipante, { global: { plugins: [router] } });
    expect(freshWrapper.find('div.text-center').text()).toContain('Cargando datos');
    await flushPromises();
    await nextTick();
    expect(freshWrapper.find('div.text-center').exists()).toBe(false);
    expect(freshWrapper.find('form').exists()).toBe(true);
  });

  it('muestra error si el código es inválido', async () => {
    const wrapper = await mountComponent();
    await wrapper.find('input[name="codigo"]').setValue('P-001');
    await wrapper.find('input[name="codigo"]').trigger('blur');
    await nextTick();
    expect(wrapper.find('div.text-danger').text()).toContain('Formato inválido');
  });

  it('no muestra error si el código es válido', async () => {
    const wrapper = await mountComponent();
    await wrapper.find('input[name="codigo"]').setValue('TKC 2905');
    await wrapper.find('input[name="codigo"]').trigger('blur');
    await nextTick();
    expect(wrapper.find('div.text-danger').exists()).toBe(false);
  });

  it('muestra error si el nombre del participante está vacío', async () => {
    const wrapper = await mountComponent();
    await wrapper.find('input[name="nombre"]').setValue('');
    await wrapper.find('input[name="nombre"]').trigger('blur');
    await nextTick();
    expect(wrapper.find('div.text-danger').text()).toContain('El nombre del participante es obligatorio.');
  });

  it('no muestra error si el nombre del participante es válido', async () => {
    const wrapper = await mountComponent();
    await wrapper.find('input[name="nombre"]').setValue('Test Name');
    await wrapper.find('input[name="nombre"]').trigger('blur');
    await nextTick();
    expect(wrapper.find('div.text-danger').exists()).toBe(false);
  });

  it('muestra error si el apellido paterno del participante está vacío', async () => {
    const wrapper = await mountComponent();
    await wrapper.find('input[name="apellidoPaterno"]').setValue('');
    await wrapper.find('input[name="apellidoPaterno"]').trigger('blur');
    await nextTick();
    expect(wrapper.find('div.text-danger').text()).toContain('El apellido paterno del participante es obligatorio.');
  });

  it('no muestra error si el apellido paterno del participante es válido', async () => {
    const wrapper = await mountComponent();
    await wrapper.find('input[name="apellidoPaterno"]').setValue('Test Apellido');
    await wrapper.find('input[name="apellidoPaterno"]').trigger('blur');
    await nextTick();
    expect(wrapper.find('div.text-danger').exists()).toBe(false);
  });

  it('muestra error si el apellido materno del participante está vacío', async () => {
    const wrapper = await mountComponent();
    await wrapper.find('input[name="apellidoMaterno"]').setValue('');
    await wrapper.find('input[name="apellidoMaterno"]').trigger('blur');
    await nextTick();
    expect(wrapper.find('div.text-danger').text()).toContain('El apellido materno del participante es obligatorio.');
  });

  it('no muestra error si el apellido materno del participante es válido', async () => {
    const wrapper = await mountComponent();
    await wrapper.find('input[name="apellidoMaterno"]').setValue('Test Apellido');
    await wrapper.find('input[name="apellidoMaterno"]').trigger('blur');
    await nextTick();
    expect(wrapper.find('div.text-danger').exists()).toBe(false);
  });

  it('muestra error si la dirección no contiene departamento válido', async () => {
    const wrapper = await mountComponent();
    await wrapper.find('input[name="direccion"]').setValue('Calle Falsa 123, Miami');
    await wrapper.find('input[name="direccion"]').trigger('blur');
    await nextTick();
    expect(wrapper.find('div.text-danger').text()).toContain('departamento boliviano válido');
  });

  it('no muestra error si la dirección contiene departamento válido', async () => {
    const wrapper = await mountComponent();
    await wrapper.find('input[name="direccion"]').setValue('Av. Arce 1234, La Paz');
    await wrapper.find('input[name="direccion"]').trigger('blur');
    await nextTick();
    expect(wrapper.find('div.text-danger').exists()).toBe(false);
  });

  it('muestra error si el celular es inválido', async () => {
    const wrapper = await mountComponent();
    await wrapper.find('input[name="celular"]').setValue('12345');
    await wrapper.find('input[name="celular"]').trigger('blur');
    await nextTick();
    expect(wrapper.find('div.text-danger').text()).toContain('Número inválido');
  });

  it('no muestra error si el celular es válido', async () => {
    const wrapper = await mountComponent();
    await wrapper.find('input[name="celular"]').setValue('70012345');
    await wrapper.find('input[name="celular"]').trigger('blur');
    await nextTick();
    expect(wrapper.find('div.text-danger').exists()).toBe(false);
  });

  it('actualiza participante con éxito', async () => {
    const wrapper = await mountComponent();
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();
    expect(axios.put).toHaveBeenCalledWith(
      expect.stringContaining(`/participantes/${mockParticipanteId}`),
      expect.any(FormData)
    );
    expect(wrapper.find('.alert-success').text()).toContain('actualizados correctamente');
  });

  it('muestra error si la actualización falla', async () => {
    axios.put.mockRejectedValueOnce({
      response: { data: { error: 'Error de actualización' } }
    });
    const wrapper = await mountComponent();
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();
    expect(wrapper.find('.alert-danger').text()).toContain('Error al actualizar participante o documentos.');
  });
  
  it('realiza una búsqueda de patrocinadores y muestra los resultados', async () => {
    const wrapper = await mountComponent();
    await wrapper.find('input[name="busquedaPatrocinador"]').setValue('Patrocinador A');
    
    // Avanzar en el tiempo para que el setTimeout se ejecute
    await vi.runAllTimers();
    await flushPromises();
    await nextTick();

    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('/patrocinadores'),
      expect.objectContaining({ params: { busqueda: 'Patrocinador A' } })
    );
    expect(wrapper.findAll('li.list-group-item')).toHaveLength(2);
    expect(wrapper.findAll('li.list-group-item')[0].text()).toContain('Patrocinador A');
  });

    it('selecciona un patrocinador de la lista y rellena los campos', async () => {
    const wrapper = await mountComponent();
    await wrapper.find('input[name="busquedaPatrocinador"]').setValue('Patrocinador A');

    // Avanzar en el tiempo para que el setTimeout se ejecute
    await vi.runAllTimers();
    await flushPromises();
    await nextTick();

    await wrapper.findAll('li.list-group-item')[0].trigger('click');
    await nextTick();

    // Comprueba que los inputs readonly se han rellenado correctamente
    expect(wrapper.find('input[name="patrocinador_nombre"]').element.value).toBe('Patrocinador A');
    expect(wrapper.find('input[name="patrocinador_apellido_paterno"]').element.value).toBe('PaternoA');
    expect(wrapper.find('input[name="patrocinador_apellido_materno"]').element.value).toBe('MaternoA');

    // Comprueba que los campos del participante se han actualizado
    expect(wrapper.vm.participante.id_patrocinador).toBe('pat1');
    expect(wrapper.vm.participante.patrocinador_nombre).toBe('Patrocinador A');
    expect(wrapper.vm.participante.patrocinador_apellido_paterno).toBe('PaternoA');
    expect(wrapper.vm.participante.patrocinador_apellido_materno).toBe('MaternoA');
  });

  it('muestra mensaje si no hay patrocinadores', async () => {
    const wrapper = await mountComponent();
    await wrapper.find('input[name="busquedaPatrocinador"]').setValue('NoExiste');
    
    // Avanzar en el tiempo para que el setTimeout se ejecute
    await vi.runAllTimers();
    await flushPromises();
    await nextTick();

    expect(wrapper.findAll('li.list-group-item')).toHaveLength(0);
  });
  
  it('limpia los campos de patrocinador al hacer clic en el botón "Limpiar"', async () => {
    const wrapper = await mountComponent();
    // Primero, seleccionamos un patrocinador para llenar los campos
    await wrapper.find('input[name="busquedaPatrocinador"]').setValue('Patrocinador A');
    
    // Avanzar en el tiempo para que el setTimeout se ejecute
    await vi.runAllTimers();
    await flushPromises();
    await nextTick();

    await wrapper.findAll('li.list-group-item')[0].trigger('click');
    await nextTick();

    // Verificamos que los campos están llenos
    expect(wrapper.vm.participante.patrocinador_nombre).toBe('Patrocinador A');
    
    // Hacemos clic en el botón "Limpiar"
    await wrapper.find('button.btn-outline-secondary').trigger('click');
    await nextTick();

    // Verificamos que los campos se han vaciado
    expect(wrapper.vm.participante.id_patrocinador).toBeNull();
    expect(wrapper.vm.participante.patrocinador_nombre).toBe('');
    expect(wrapper.vm.participante.patrocinador_apellido_paterno).toBe('');
    expect(wrapper.vm.participante.patrocinador_apellido_materno).toBe('');
    expect(wrapper.vm.participante.patrocinador_celular).toBe('');
    expect(wrapper.vm.participante.patrocinador_correo).toBe('');
    expect(wrapper.vm.busquedaPatrocinador).toBe('');
    expect(wrapper.vm.resultadosBusqueda).toHaveLength(0);
  });

  it('agrega un documento', async () => {
    const wrapper = await mountComponent();
    const initial = wrapper.findAll('.col-md-12.mb-3').length;
    await wrapper.find('button.admin-btn-outline').trigger('click');
    await nextTick();
    expect(wrapper.findAll('.col-md-12.mb-3')).toHaveLength(initial + 1);
  });

  it('elimina documento existente', async () => {
    const wrapper = await mountComponent();
    const initial = wrapper.findAll('.col-md-12.mb-3').length;
    await wrapper.find('button.btn-danger').trigger('click');
    await nextTick();
    expect(wrapper.findAll('.col-md-12.mb-3')).toHaveLength(initial - 1);
    expect(wrapper.vm.documentosAEliminar).toContain(mockDocumentos[0].id_documento);
  });

  it('navega al dashboard al cancelar', async () => {
    const wrapper = await mountComponent();
    await wrapper.find('button.admin-btn-secondary').trigger('click');
    await flushPromises();
    
    expect(pushSpy).toHaveBeenCalledWith('/adminDashboard');
  });
});