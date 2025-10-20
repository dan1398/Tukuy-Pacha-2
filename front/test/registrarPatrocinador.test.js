// @vitest-environment jsdom
import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRouter, createMemoryHistory } from 'vue-router';
import { nextTick } from 'vue';
import axios from 'axios';
import RegistrarPatrocinador from '@/views/RegistrarPatrocinador.vue';

// Mock axios
vi.mock('axios');

describe('RegistrarPatrocinador.vue', () => {
  let router;
  let pushSpy;

  beforeEach(async () => {
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/adminDashboard', name: 'adminDashboard', component: { template: '<div>Dashboard</div>' } },
        { path: '/registrarPatrocinador', name: 'RegistrarPatrocinador', component: RegistrarPatrocinador },
      ],
    });

    vi.clearAllMocks();
    pushSpy = vi.spyOn(router, 'push');

    await router.push('/registrarPatrocinador');
    await router.isReady();
  });

  const mountComponent = async () => {
    const wrapper = mount(RegistrarPatrocinador, {
      global: {
        plugins: [router],
        stubs: {
          // Quitar el mock de VueTelInput
          'VueTelInput': true
        }
      },
    });
    await nextTick();
    return wrapper;
  };

  it('renderiza el formulario correctamente', async () => {
    const wrapper = await mountComponent();
    expect(wrapper.find('h3').text()).toBe('Registrar Patrocinador');
    expect(wrapper.find('form').exists()).toBe(true);
    expect(wrapper.find('#nombre').exists()).toBe(true);
    expect(wrapper.find('input[type="email"]').exists()).toBe(true);
    expect(wrapper.find('button[type="submit"]').text()).toBe('Registrar');
    expect(wrapper.find('button[type="button"]').text()).toBe('Cancelar');
  });

  it('registra un patrocinador con éxito y limpia los campos', async () => {
    const mockResponse = { data: { mensaje: 'Patrocinador registrado con éxito.' } };
    axios.post.mockResolvedValueOnce(mockResponse);

    const wrapper = await mountComponent();

    await wrapper.find('#nombre').setValue('Patrocinador Test');
    await wrapper.find('#apellido_paterno').setValue('Paterno');
    await wrapper.find('#correo').setValue('test@example.com');
    
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    expect(axios.post).toHaveBeenCalledWith(
      'http://localhost:3000/api/patrocinadores',
      {
        nombre: 'Patrocinador Test',
        apellido_paterno: 'Paterno',
        apellido_materno: null,
        celular: null,
        correo: 'test@example.com'
      }
    );

    await nextTick();
    expect(wrapper.find('.alert-info').text()).toBe('Patrocinador registrado con éxito.');
    expect(wrapper.find('#nombre').element.value).toBe('');
  });

  it('permite campos opcionales vacíos (apellido paterno, materno, correo, celular)', async () => {
    const mockResponse = { data: { mensaje: 'Patrocinador registrado con éxito.' } };
    axios.post.mockResolvedValueOnce(mockResponse);

    const wrapper = await mountComponent();

    await wrapper.find('#nombre').setValue('Patrocinador sin apellidos');
    
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    expect(axios.post).toHaveBeenCalledWith(
      'http://localhost:3000/api/patrocinadores',
      {
        nombre: 'Patrocinador sin apellidos',
        apellido_paterno: null,
        apellido_materno: null,
        celular: null,
        correo: null
      }
    );
  });
  
  it('muestra mensaje de error si el registro falla', async () => {
    axios.post.mockRejectedValueOnce({ response: { data: { error: 'Error del servidor' } } });

    const wrapper = await mountComponent();

    await wrapper.find('#nombre').setValue('Patrocinador Test');
    
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    await nextTick();
    expect(wrapper.find('.alert-info').text()).toBe('Error al registrar el patrocinador.');
  });
  
  it('no envía el formulario si el nombre está vacío', async () => {
    const wrapper = await mountComponent();
    await wrapper.find('#nombre').setValue('');
    await wrapper.find('form').trigger('submit.prevent');
    await nextTick();
    expect(axios.post).not.toHaveBeenCalled();
  });
  
  it('muestra un mensaje de error si el correo es inválido', async () => {
    const wrapper = await mountComponent();
    await wrapper.find('#nombre').setValue('Test');
    await wrapper.find('#correo').setValue('correo-invalido');
    await wrapper.find('form').trigger('submit.prevent');
    await nextTick();
    expect(wrapper.find('.alert-info').text()).toBe('El correo debe ser válido y terminar en .com');
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('navega a adminDashboard al hacer clic en el botón Cancelar', async () => {
    const wrapper = await mountComponent();

    await wrapper.find('button[type="button"]').trigger('click');
    await flushPromises();

    expect(pushSpy).toHaveBeenCalledWith('/adminDashboard');
  });
});