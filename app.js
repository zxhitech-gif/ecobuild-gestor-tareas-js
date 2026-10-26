/**
 * CLASE TAREA
 * Representa cada tarea individual con su estado y métodos de negocio (POO).
 */
class Tarea {
    constructor(id, nombre, completada = false) {
        this.id = id;
        this.nombre = nombre;
        this.completada = completada;
        this.eliminada = false;
    }

    // Método para actualizar el estado de la tarea (Completa / Incompleta)
    actualizarEstado() {
        this.completada = !this.completada;
    }

    // Método para editar el contenido de la tarea
    editarContenido(nuevoNombre) {
        this.nombre = nuevoNombre.trim();
    }

    // Método para marcar la tarea como eliminada dentro de su ciclo de vida
    eliminar() {
        this.eliminada = true;
    }
}

/**
 * CLASE GESTOR DE TAREAS
 * Controla la lista de tareas, la persistencia en LocalStorage y la manipulación del DOM.
 */
class GestorDeTareas {
    constructor() {
        this.storageKey = 'ecobuild_tareas_v1';
        this.tareas = [];
        this.idEnEdicion = null;

        // Selección de nodos del DOM
        this.formulario = document.querySelector('#formulario-tareas');
        this.inputTarea = document.getElementById('nueva-tarea');
        this.listaTareas = document.getElementById('lista-tareas');
        this.mensajeFeedback = document.getElementById('mensaje-feedback');
        this.contadorTareas = document.getElementById('contador-tareas');

        this.inicializarEventos();
        this.cargarDesdeStorage();
    }

    /**
     * Registra los eventos principales usando funciones flecha y delegación de eventos.
     */
    inicializarEventos() {
        // Evento para agregar tarea previniendo recarga de página
        this.formulario.addEventListener('submit', (evento) => {
            evento.preventDefault();
            this.agregarTarea();
        });

        // Delegación de eventos sobre la lista <ul> para gestionar botones dinámicos
        this.listaTareas.addEventListener('click', (evento) => {
            const boton = evento.target.closest('button');
            if (!boton) return;

            const itemTarea = boton.closest('.tarea-item');
            if (!itemTarea) return;

            const idTarea = Number(itemTarea.dataset.id);

            if (boton.classList.contains('btn-estado')) {
                this.cambiarEstadoTarea(idTarea);
            } else if (boton.classList.contains('btn-editar')) {
                this.activarModoEdicion(idTarea);
            } else if (boton.classList.contains('btn-guardar')) {
                const inputEdicion = itemTarea.querySelector('.input-edicion');
                this.guardarEdicionTarea(idTarea, inputEdicion.value);
            } else if (boton.classList.contains('btn-cancelar')) {
                this.cancelarModoEdicion();
            } else if (boton.classList.contains('btn-eliminar')) {
                this.eliminarTarea(idTarea);
            }
        });

        // Permitir guardar con Enter o cancelar con Escape durante la edición en línea
        this.listaTareas.addEventListener('keydown', (evento) => {
            if (!evento.target.classList.contains('input-edicion')) return;

            const itemTarea = evento.target.closest('.tarea-item');
            const idTarea = Number(itemTarea.dataset.id);

            if (evento.key === 'Enter') {
                evento.preventDefault();
                this.guardarEdicionTarea(idTarea, evento.target.value);
            } else if (evento.key === 'Escape') {
                this.cancelarModoEdicion();
            }
        });
    }

    /**
     * Valida que la entrada no esté vacía ni duplicada.
     */
    validarEntrada(nombre, idExcluido = null) {
        const textoLimpio = nombre.trim();

        if (textoLimpio === '') {
            this.mostrarFeedback('Error: El nombre de la tarea no puede estar vacío.', 'error');
            return false;
        }

        const existeDuplicado = this.tareas.some(
            (tarea) => tarea.nombre.toLowerCase() === textoLimpio.toLowerCase() && tarea.id !== idExcluido
        );

        if (existeDuplicado) {
            this.mostrarFeedback('Error: Esta tarea ya se encuentra registrada en la lista.', 'error');
            return false;
        }

        return true;
    }

    /**
     * Muestra mensajes de retroalimentación visual al usuario.
     */
    mostrarFeedback(mensaje, tipo = 'error') {
        this.mensajeFeedback.textContent = mensaje;
        this.mensajeFeedback.className = `feedback-texto ${
            tipo === 'error' ? 'feedback-error' : 'feedback-exito'
        }`;
    }

    ocultarFeedback() {
        this.mensajeFeedback.textContent = '';
        this.mensajeFeedback.className = 'oculto feedback-texto';
    }

    /**
     * Crea una nueva instancia de Tarea y la agrega a la lista.
     */
    agregarTarea() {
        const nombreTarea = this.inputTarea.value;

        if (!this.validarEntrada(nombreTarea)) return;

        const nuevaTarea = new Tarea(Date.now(), nombreTarea.trim());
        this.tareas.push(nuevaTarea);

        this.inputTarea.value = '';
        this.inputTarea.focus();
        this.mostrarFeedback('Tarea agregada correctamente.', 'exito');
        this.sincronizarCambios();
    }

    /**
     * Activa el campo de edición directamente en el elemento del DOM seleccionado.
     */
    activarModoEdicion(id) {
        this.idEnEdicion = id;
        this.ocultarFeedback();
        this.renderizar();

        const inputActivo = this.listaTareas.querySelector('.input-edicion');
        if (inputActivo) {
            inputActivo.focus();
            inputActivo.select();
        }
    }

    /**
     * Cancela el modo de edición actual y restaura la vista normal.
     */
    cancelarModoEdicion() {
        this.idEnEdicion = null;
        this.ocultarFeedback();
        this.renderizar();
    }

    /**
     * Ejecuta el método editarContenido() de la instancia Tarea y actualiza el DOM.
     */
    guardarEdicionTarea(id, nuevoNombre) {
        if (!this.validarEntrada(nuevoNombre, id)) return;

        const tarea = this.tareas.find((t) => t.id === id);
        if (tarea) {
            tarea.editarContenido(nuevoNombre);
            this.idEnEdicion = null;
            this.mostrarFeedback('Tarea editada y actualizada correctamente.', 'exito');
            this.sincronizarCambios();
        }
    }

    /**
     * Ejecuta el método eliminar() de la instancia Tarea y la remueve de la colección.
     */
    eliminarTarea(id) {
        const tarea = this.tareas.find((t) => t.id === id);
        if (tarea) {
            tarea.eliminar();
            this.tareas = this.tareas.filter((t) => !t.eliminada);
            if (this.idEnEdicion === id) this.idEnEdicion = null;
            this.mostrarFeedback('Tarea eliminada de la lista.', 'exito');
            this.sincronizarCambios();
        }
    }

    /**
     * Ejecuta el método actualizarEstado() de la instancia Tarea.
     */
    cambiarEstadoTarea(id) {
        const tarea = this.tareas.find((t) => t.id === id);
        if (tarea) {
            tarea.actualizarEstado();
            this.ocultarFeedback();
            this.sincronizarCambios();
        }
    }

    /**
     * Almacena la lista de tareas en LocalStorage utilizando Promesas y JSON.stringify.
     */
    guardarEnStorage() {
        return new Promise((resolve, reject) => {
            try {
                const datosSerializados = JSON.stringify(this.tareas);
                localStorage.setItem(this.storageKey, datosSerializados);
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Carga las tareas desde LocalStorage y reconstruye las instancias de la clase Tarea.
     */
    cargarDesdeStorage() {
        return new Promise((resolve, reject) => {
            try {
                const datosGuardados = localStorage.getItem(this.storageKey);
                if (datosGuardados) {
                    const arregloPlano = JSON.parse(datosGuardados);
                    this.tareas = arregloPlano.map(
                        (obj) => new Tarea(obj.id, obj.nombre, obj.completada)
                    );
                }
                resolve();
            } catch (error) {
                reject(error);
            }
        })
        .then(() => this.renderizar())
        .catch((error) => console.error('Error al leer LocalStorage:', error));
    }

    /**
     * Sincroniza la persistencia en LocalStorage y vuelve a dibujar el DOM en tiempo real.
     */
    sincronizarCambios() {
        this.guardarEnStorage()
            .then(() => this.renderizar())
            .catch((error) => console.error('Error al guardar en LocalStorage:', error));
    }

    /**
     * Renderiza dinámicamente la lista de tareas en el DOM usando forEach y Template Literals.
     */
    renderizar() {
        this.listaTareas.innerHTML = '';

        if (this.tareas.length === 0) {
            this.listaTareas.innerHTML = `
                <li class="lista-vacia">
                    No hay tareas registradas. Agrega una nueva tarea para comenzar.
                </li>
            `;
        } else {
            this.tareas.forEach((tarea) => {
                const li = document.createElement('li');
                li.className = `tarea-item ${tarea.completada ? 'completada' : ''}`;
                li.dataset.id = tarea.id;

                if (this.idEnEdicion === tarea.id) {
                    // Vista interactiva de edición en línea
                    li.innerHTML = `
                        <div class="contenido-tarea">
                            <input 
                                type="text" 
                                class="input-edicion" 
                                value="${tarea.nombre}" 
                                aria-label="Editar nombre de la tarea"
                            >
                        </div>
                        <div class="acciones">
                            <button type="button" class="btn-accion btn-estado btn-guardar">Guardar</button>
                            <button type="button" class="btn-accion btn-cancelar">Cancelar</button>
                        </div>
                    `;
                } else {
                    // Vista estándar de la tarea
                    li.innerHTML = `
                        <div class="contenido-tarea">
                            <span class="badge-estado">
                                ${tarea.completada ? 'Completada' : 'Pendiente'}
                            </span>
                            <span class="texto-tarea">${tarea.nombre}</span>
                        </div>
                        <div class="acciones">
                            <button type="button" class="btn-accion btn-estado">
                                ${tarea.completada ? 'Reabrir' : 'Completar'}
                            </button>
                            <button type="button" class="btn-accion btn-editar">Editar</button>
                            <button type="button" class="btn-accion btn-eliminar">Eliminar</button>
                        </div>
                    `;
                }

                this.listaTareas.appendChild(li);
            });
        }

        // Actualización del contador de estado en tiempo real
        const total = this.tareas.length;
        const completadas = this.tareas.filter((t) => t.completada).length;
        const pendientes = total - completadas;
        this.contadorTareas.textContent = `Total: ${total} | Pendientes: ${pendientes} | Completadas: ${completadas}`;
    }
}

// Inicialización de la aplicación
const appGestor = new GestorDeTareas();
