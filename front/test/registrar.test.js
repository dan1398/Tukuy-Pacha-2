// @vitest-environment jsdom
import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRouter, createMemoryHistory } from 'vue-router';
import { nextTick } from 'vue';
import axios from 'axios';
import Registrar from '@/views/Registrar.vue';

// Mock axios
vi.mock('axios');

describe('Registrar.vue', () => {
  let router;
  let pushSpy;

  beforeEach(async () => {
    // Configurar un router simulado para manejar la navegación
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/adminDashboard', name: 'adminDashboard', component: { template: '<div>Dashboard</div>' } },
        { path: '/registrar', name: 'Registrar', component: Registrar },
      ],
    });

    vi.clearAllMocks();
    
    // Espiar el método push del router para verificar la navegación
    pushSpy = vi.spyOn(router, 'push');

    // Navegar al componente antes de montar
    await router.push('/registrar');
    await router.isReady();
  });

  const mountComponent = async () => {
    const wrapper = mount(Registrar, {
      global: {
        plugins: [router],
      },
    });
    await nextTick();
    return wrapper;
  };

  it('renderiza el formulario de registro correctamente', async () => {
    const wrapper = await mountComponent();
    expect(wrapper.find('h3').text()).toBe('Registrar Usuario');
    expect(wrapper.find('form').exists()).toBe(true);
    expect(wrapper.find('#nombre').exists()).toBe(true);
    expect(wrapper.find('#apellido_paterno').exists()).toBe(true); // Test para el apellido paterno
    expect(wrapper.find('#apellido_materno').exists()).toBe(true); // Test para el apellido materno
    expect(wrapper.find('#correo').exists()).toBe(true);
    expect(wrapper.find('select#rol').exists()).toBe(true);
    expect(wrapper.find('button[type="submit"]').text()).toBe('Registrar');
    expect(wrapper.find('button[type="button"]').text()).toBe('Cancelar');
  });

  it('registra un usuario con éxito y limpia los campos', async () => {
    const mockResponse = { data: { mensaje: 'Usuario registrado con éxito.' } };
    axios.post.mockResolvedValueOnce(mockResponse);

    const wrapper = await mountComponent();

    // Rellenar los campos del formulario
    await wrapper.find('#nombre').setValue('Test');
    await wrapper.find('#apellido_paterno').setValue('User');
    await wrapper.find('#apellido_materno').setValue('Test');
    await wrapper.find('#correo').setValue('test@example.com');
    await wrapper.find('select#rol').setValue('Administrador');

    // Simular el envío del formulario
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    // Verificar que axios.post fue llamado con los datos correctos
    expect(axios.post).toHaveBeenCalledWith(
      'http://localhost:3000/api/usuarios',
      {
        nombre: 'Test',
        apellido_paterno: 'User',
        apellido_materno: 'Test',
        correo: 'test@example.com',
        rol: 'Administrador'
      }
    );

    // Verificar que el mensaje de éxito se muestra
    await nextTick();
    expect(wrapper.find('.alert-info').text()).toBe('Usuario registrado con éxito.');

    // Verificar que los campos se han limpiado y el rol se ha reseteado
    expect(wrapper.find('#nombre').element.value).toBe('');
    expect(wrapper.find('#apellido_paterno').element.value).toBe('');
    expect(wrapper.find('#apellido_materno').element.value).toBe('');
    expect(wrapper.find('#correo').element.value).toBe('');
    expect(wrapper.vm.rol).toBe('Personal');
  });

  it('muestra un mensaje de error si el registro falla', async () => {
    const mockError = { response: { data: { error: 'Error del servidor' } } };
    axios.post.mockRejectedValueOnce(mockError);

    const wrapper = await mountComponent();

    // Rellenar campos para que el formulario sea válido
    await wrapper.find('#nombre').setValue('Test');
    await wrapper.find('#apellido_paterno').setValue('User');
    await wrapper.find('#correo').setValue('test@example.com');
    
    // Simular el envío del formulario
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    // Verificar que el mensaje de error se muestra
    await nextTick();
    expect(wrapper.find('.alert-info').text()).toBe('Error al registrar usuario');
  });

  it('navega a adminDashboard al hacer clic en el botón Cancelar', async () => {
    const wrapper = await mountComponent();

    // Simular clic en el botón de cancelar
    await wrapper.find('button[type="button"]').trigger('click');
    await flushPromises();

    // Verificar que el router fue llamado para navegar
    expect(pushSpy).toHaveBeenCalledWith('/adminDashboard');
  });

  // --- Tests de validación adicionales ---

  it('no envía el formulario si el nombre está vacío', async () => {
    const wrapper = await mountComponent();
    await wrapper.find('#nombre').setValue('');
    await wrapper.find('#apellido_paterno').setValue('User');
    await wrapper.find('#correo').setValue('test@example.com');
    await wrapper.find('form').trigger('submit.prevent');
    await nextTick();
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('no envía el formulario si el apellido paterno está vacío', async () => {
    const wrapper = await mountComponent();
    await wrapper.find('#nombre').setValue('Test');
    await wrapper.find('#apellido_paterno').setValue('');
    await wrapper.find('#correo').setValue('test@example.com');
    await wrapper.find('form').trigger('submit.prevent');
    await nextTick();
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('envía el formulario con éxito si el apellido materno está vacío', async () => {
    const mockResponse = { data: { mensaje: 'Usuario registrado con éxito.' } };
    axios.post.mockResolvedValueOnce(mockResponse);

    const wrapper = await mountComponent();
    
    // Rellenar los campos requeridos, dejando el apellido materno vacío
    await wrapper.find('#nombre').setValue('Test');
    await wrapper.find('#apellido_paterno').setValue('User');
    await wrapper.find('#correo').setValue('test@example.com');
    
    // Simular el envío del formulario
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    // Verificar que axios.post fue llamado y el apellido materno se envió como una cadena vacía
    expect(axios.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        nombre: 'Test',
        apellido_paterno: 'User',
        apellido_materno: '', 
        correo: 'test@example.com',
      })
    );
  });

  it('no envía el formulario si el correo es inválido', async () => {
    const wrapper = await mountComponent();
    await wrapper.find('#nombre').setValue('Test');
    await wrapper.find('#apellido_paterno').setValue('User');
    await wrapper.find('#correo').setValue('correo-invalido');
    await wrapper.find('form').trigger('submit.prevent');
    await nextTick();

    expect(axios.post).not.toHaveBeenCalled();
  });

  it('no envía el formulario si el rol no está seleccionado (aunque el valor por defecto lo evita)', async () => {
    const wrapper = await mountComponent();
    // Simular que el rol no está seleccionado
    await wrapper.find('select#rol').setValue(''); 
    await wrapper.find('form').trigger('submit.prevent');
    await nextTick();
    expect(axios.post).not.toHaveBeenCalled();
  });
});