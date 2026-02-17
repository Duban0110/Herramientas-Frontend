/* ============================================================
   RENTATOOLS — app.js
   Lógica principal: Auth, Router, API calls, UI helpers
============================================================ */

const API_URL = "http://localhost:8081/api";

/* ============================================================
   MÓDULO: TOAST NOTIFICATIONS
   Reemplaza los alert() nativos del navegador
============================================================ */
function notify(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

/* ============================================================
   MÓDULO: AUTENTICACIÓN — toggle login/registro
============================================================ */
window.toggleAuth = function (showRegister) {
    document.getElementById('login-container').style.display    = showRegister ? 'none'  : 'block';
    document.getElementById('register-container').style.display = showRegister ? 'block' : 'none';
};

/* ============================================================
   MÓDULO: DASHBOARD — arranque y sesión
============================================================ */
function mostrarDashboard() {
    document.getElementById('auth-wrapper').style.display        = 'none';
    document.getElementById('dashboard-container').style.display = 'flex';
    document.getElementById('dashboard-container').style.flexDirection = 'column';

    const rol  = localStorage.getItem('rol');
    const user = localStorage.getItem('username');

    document.getElementById('user-info').innerHTML =
        `${user} <span class="badge-rol">${rol}</span>`;

    // Asegura que los modales arranquen cerrados
    cerrarModal();
    cerrarModalHerramienta();

    cargarVistaPorRol(rol);
}

window.logout = function () {
    localStorage.clear();
    location.reload();
};

/* ============================================================
   MÓDULO: ROUTER — carga de vistas por rol
============================================================ */
function cargarVistaPorRol(rol) {
    const content = document.getElementById('content');
    if (!content) return;

    // Normaliza el rol para el switch
    const userRol = rol.startsWith('ROLE_') ? rol : `ROLE_${rol}`;
    let html     = '';
    let callback = null;

    switch (userRol) {

        /* ---- ADMINISTRADOR ---- */
        case 'ROLE_ADMINISTRADOR':
            html = `
            <section>
                <div class="panel-header">
                    <div>
                        <div class="panel-title">Control de <span>Gestión</span></div>
                        <div class="panel-subtitle">// Panel administrativo del sistema</div>
                    </div>
                    <div class="panel-actions">
                        <button onclick="window.verDashboardAdmin()" class="btn-secondary active" id="btn-reportes">Reportes Globales</button>
                        <button onclick="window.listarUsuarios()"    class="btn-secondary"        id="btn-usuarios">Base de Usuarios</button>
                    </div>
                </div>
                <div id="data-display"></div>
            </section>`;
            callback = () => window.verDashboardAdmin();
            break;

        /* ---- PROVEEDOR ---- */
        case 'ROLE_PROVEEDOR':
            html = `
            <section>
                <div class="panel-header">
                    <div>
                        <div class="panel-title">Gestión de <span>Inventario</span></div>
                        <div class="panel-subtitle">// Equipos publicados y alquileres activos</div>
                    </div>
                    <div class="panel-actions">
                        <button onclick="window.verEntregasPendientes()" class="btn-secondary" id="btn-alquileres">Ver Alquileres</button>
                        <button onclick="window.abrirModalHerramienta()" class="btn-secondary">+ Publicar Equipo</button>
                    </div>
                </div>
                <div id="data-display" class="tools-grid"></div>
            </section>

            <!-- Modal exclusivo del proveedor (inyectado dinámicamente) -->
            <div id="modal-herramienta-proveedor" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <button class="close-btn" onclick="window.cerrarModalHerramienta()">×</button>
                        <h2>Nueva Entrada de Equipo</h2>
                        <p>// Publicar en el catálogo</p>
                    </div>
                    <div class="modal-body">
                        <form id="herramienta-form-proveedor">
                            <div class="input-group">
                                <label>Nombre del Equipo</label>
                                <input type="text" id="hp-nombre" placeholder="Ej. Mezcladora de Cemento" required>
                            </div>
                            <div class="input-group">
                                <label>Especificaciones Técnicas</label>
                                <textarea id="hp-desc" placeholder="Detalles de potencia, capacidad, etc." style="min-height:80px; resize:vertical;"></textarea>
                            </div>
                            <div class="input-row">
                                <div class="input-group">
                                    <label>Tarifa Diaria ($)</label>
                                    <input type="number" id="hp-precio" placeholder="0.00" required>
                                </div>
                                <div class="input-group">
                                    <label>Unidades Stock</label>
                                    <input type="number" id="hp-stock" placeholder="1" required>
                                </div>
                            </div>
                            <div class="input-group">
                                <label>URL de Imagen</label>
                                <input type="text" id="hp-imagen" placeholder="https://...">
                            </div>
                            <div style="display:flex; gap:10px;">
                                <button type="submit" class="btn-primary" style="flex:2;">Confirmar Publicación</button>
                                <button type="button" onclick="window.cerrarModalHerramienta()" class="btn-cancel" style="flex:1;">Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>`;
            callback = () => window.cargarHerramientas();
            break;

        /* ---- CLIENTE (default) ---- */
        default:
            html = `
            <section>
                <div class="panel-header">
                    <div>
                        <div class="panel-title">Catálogo de <span>Equipos</span></div>
                        <div class="panel-subtitle">// Herramientas disponibles para alquiler</div>
                    </div>
                    <div class="panel-actions">
                        <button onclick="window.cargarHerramientas()" class="btn-secondary active" id="btn-catalogo">Explorar Equipos</button>
                        <button onclick="window.verMisReservas()"      class="btn-secondary"        id="btn-misreservas">Mis Alquileres</button>
                    </div>
                </div>
                <div id="herramientas-grid" class="tools-grid"></div>
            </section>`;
            callback = () => window.cargarHerramientas();
            break;
    }

    content.innerHTML = html;
    if (callback) setTimeout(callback, 50);
}

/* ============================================================
   MÓDULO: AUTH — Login
============================================================ */
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type=submit]');
    btn.textContent = 'Verificando...';
    btn.disabled = true;

    const correo     = document.getElementById('email').value;
    const contrasena = document.getElementById('password').value;

    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo, contrasena })
        });

        if (res.ok) {
            const data = await res.json();
            localStorage.setItem('jwt', data.token);

            // Decodificación manual del payload JWT
            const payload = JSON.parse(
                window.atob(data.token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
            );

            localStorage.setItem('usuarioId', payload.id || payload.userId || payload.sub);
            localStorage.setItem('rol', (payload.roles ? payload.roles[0] : (payload.role || '')).replace('ROLE_', ''));
            localStorage.setItem('username', payload.sub || correo);

            notify('¡Acceso concedido!', 'success');
            mostrarDashboard();
        } else {
            notify('Credenciales incorrectas.', 'error');
        }
    } catch (err) {
        notify('Error de conexión con el servidor.', 'error');
        console.error('Login error:', err);
    } finally {
        btn.textContent = 'Iniciar Sesión';
        btn.disabled = false;
    }
});

/* ============================================================
   MÓDULO: AUTH — Registro
============================================================ */
document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type=submit]');
    btn.textContent = 'Creando...';
    btn.disabled = true;

    const data = {
        nombre:     document.getElementById('reg-nombre').value,
        apellido:   document.getElementById('reg-apellido').value,
        correo:     document.getElementById('reg-correo').value,
        contrasena: document.getElementById('reg-pass').value,
        rol:        document.getElementById('reg-rol').value
    };

    try {
        const res = await fetch(`${API_URL}/usuarios`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            notify('Registro exitoso. Ahora inicia sesión.', 'success');
            window.toggleAuth(false);
        } else {
            notify('Error en el registro. Verifica los datos.', 'error');
        }
    } catch (err) {
        notify('Error de conexión.', 'error');
        console.error('Register error:', err);
    } finally {
        btn.textContent = 'Crear Cuenta';
        btn.disabled = false;
    }
});

/* ============================================================
   MÓDULO: HERRAMIENTAS — Carga del catálogo
============================================================ */
window.cargarHerramientas = async function () {
    const token = localStorage.getItem('jwt');
    const grid  = document.getElementById('herramientas-grid') || document.getElementById('data-display');
    if (!grid) return;

    grid.innerHTML = estadoCargando('Localizando equipos disponibles...');

    try {
        const res = await fetch(`${API_URL}/herramientas`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            const herramientas = await res.json();

            if (herramientas.length === 0) {
                grid.innerHTML = estadoVacio('📦', 'No hay equipos registrados.');
                return;
            }

            grid.innerHTML = herramientas.map((h, i) => renderToolCard(h, i)).join('');
        }
    } catch (err) {
        grid.innerHTML = estadoError();
        console.error('cargarHerramientas error:', err);
    }
};

/** Genera el HTML de una tool card */
function renderToolCard(h, index) {
    const img        = h.imagenUrl || 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=500';
    const tieneStock = h.stock > 0;
    const nombre     = h.nombre.replace(/'/g, "\\'");

    return `
    <div class="tool-card" style="animation-delay:${index * 0.05}s">
        <div class="tool-card-img-wrapper">
            <img class="tool-card-img"
                src="${img}"
                alt="${h.nombre}"
                onerror="this.src='https://images.unsplash.com/photo-1504148455328-c376907d081c?q=80&w=500'">
            <span class="stock-badge ${tieneStock ? 'in-stock' : 'out-stock'}">
                ${tieneStock ? '▲ En Stock' : '■ Agotado'}
            </span>
        </div>
        <div class="tool-info">
            <h3>${h.nombre}</h3>
            <p class="tool-desc">${h.descripcion || 'Sin especificaciones técnicas proporcionadas.'}</p>
            <div class="tool-price-block">
                <span class="price">$${h.precioDia}</span>
                <span class="price-label">/ DÍA</span>
            </div>
            <div class="tool-stock-info">UNIDADES DISPONIBLES: ${h.stock}</div>
            <button onclick="window.prepararReserva(${h.id}, '${nombre}')"
                    class="btn-primary"
                    style="margin-top:auto;"
                    ${!tieneStock ? 'disabled' : ''}>
                ${tieneStock ? 'SOLICITAR EQUIPO' : 'NO DISPONIBLE'}
            </button>
        </div>
    </div>`;
}

/* ============================================================
   MÓDULO: HERRAMIENTAS — Publicar (Proveedor)
   Captura delegada porque el form es inyectado dinámicamente
============================================================ */
document.addEventListener('submit', async (e) => {
    if (!e.target || e.target.id !== 'herramienta-form-proveedor') return;
    e.preventDefault();

    const token     = localStorage.getItem('jwt');
    const usuarioId = localStorage.getItem('usuarioId');
    const stockVal  = parseInt(document.getElementById('hp-stock').value);

    const nuevaHerramienta = {
        nombre:      document.getElementById('hp-nombre').value,
        descripcion: document.getElementById('hp-desc').value,
        precioDia:   parseFloat(document.getElementById('hp-precio').value),
        stock:       stockVal,
        disponible:  stockVal > 0,
        imagenUrl:   document.getElementById('hp-imagen').value || '',
        proveedor:   { id: parseInt(usuarioId) }
    };

    try {
        const res = await fetch(`${API_URL}/herramientas`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(nuevaHerramienta)
        });

        if (res.ok) {
            notify('¡Equipo publicado exitosamente!', 'success');
            window.cerrarModalHerramienta();
            window.cargarHerramientas();
        } else {
            notify('Error al publicar. Verifica los datos.', 'error');
        }
    } catch (err) {
        notify('Error de conexión.', 'error');
        console.error('Publicar herramienta error:', err);
    }
});

/* ============================================================
   MÓDULO: RESERVAS — Preparar y confirmar
============================================================ */
window.prepararReserva = function (id, nombre) {
    const modal = document.getElementById('modal-reserva');
    if (modal) {
        document.getElementById('reserva-tool-id').value       = id;
        document.getElementById('reserva-tool-name').textContent = nombre;
        modal.classList.add('show');
    }
};

document.getElementById('reserva-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const token     = localStorage.getItem('jwt');
    const usuarioId = localStorage.getItem('usuarioId');

    const data = {
        clienteId:     parseInt(usuarioId),
        herramientaId: parseInt(document.getElementById('reserva-tool-id').value),
        fechaInicio:   document.getElementById('fecha-inicio').value,
        fechaFin:      document.getElementById('fecha-fin').value
    };

    try {
        const res = await fetch(`${API_URL}/reservas`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            notify('Reserva confirmada exitosamente.', 'success');
            cerrarModal();
            window.cargarHerramientas();
        } else {
            notify('Error al confirmar la reserva.', 'error');
        }
    } catch (err) {
        notify('Error de conexión.', 'error');
        console.error('Reserva error:', err);
    }
});

/* ============================================================
   MÓDULO: RESERVAS — Descargar factura PDF
============================================================ */
window.procesarPagoYDescargarFactura = async function (reservaId, monto) {
    const token = localStorage.getItem('jwt');
    try {
        const res = await fetch(`${API_URL}/reservas/pagar/descargar`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reservaId, monto })
        });

        const blob = await res.blob();
        const url  = window.URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `Factura_${reservaId}.pdf`;
        a.click();
        notify('Factura descargada.', 'success');
    } catch (err) {
        notify('Error al descargar la factura.', 'error');
        console.error('Descargar factura error:', err);
    }
};

/* ============================================================
   MÓDULO: MIS RESERVAS (Cliente)
============================================================ */
window.verMisReservas = async function () {
    const token = localStorage.getItem('jwt');
    const grid  = document.getElementById('herramientas-grid');
    if (!grid) return;

    // Actualiza estado de botones de navegación
    document.getElementById('btn-catalogo')?.classList.remove('active');
    document.getElementById('btn-misreservas')?.classList.add('active');

    grid.innerHTML = estadoCargando('Cargando tus alquileres...');

    try {
        const res = await fetch(`${API_URL}/reservas/mis-reservas`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            const reservas = await res.json();

            if (reservas.length === 0) {
                grid.innerHTML = estadoVacio('📋', 'No tienes alquileres registrados.');
                return;
            }

            grid.innerHTML = reservas.map((r, i) => `
            <div class="reservation-card" style="animation-delay:${i * 0.05}s">
                <h3>${r.nombreHerramienta}</h3>
                <div class="res-meta">
                    <div class="res-meta-row"><strong>Cliente:</strong> ${r.nombreCliente}</div>
                    <div class="res-meta-row">
                        <strong>Desde:</strong> ${r.fechaInicio}
                        &nbsp;→&nbsp;
                        <strong>Hasta:</strong> ${r.fechaFin}
                    </div>
                    <div class="res-meta-row">
                        <strong>Estado:</strong>
                        <span class="status-badge ${resolverClaseEstado(r.estado)}">${r.estado}</span>
                    </div>
                </div>
                <div class="res-total">$${r.total} <span>TOTAL</span></div>
                <button onclick="window.procesarPagoYDescargarFactura(${r.id}, ${r.total})" class="btn-download">
                    ↓ Descargar Factura PDF
                </button>
            </div>`).join('');
        } else {
            grid.innerHTML = estadoError(`Error del servidor: ${res.status}`);
        }
    } catch (err) {
        grid.innerHTML = estadoError();
        console.error('verMisReservas error:', err);
    }
};

/* ============================================================
   MÓDULO: ALQUILERES DEL PROVEEDOR
============================================================ */
window.verEntregasPendientes = async function () {
    const token = localStorage.getItem('jwt');
    const grid  = document.getElementById('data-display');
    if (!grid) return;

    document.getElementById('btn-alquileres')?.classList.add('active');
    grid.className = 'tools-grid';
    grid.innerHTML = estadoCargando('Cargando historial de alquileres...');

    try {
        const res = await fetch(`${API_URL}/reservas/proveedor`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (res.ok) {
            const reservas = await res.json();

            if (reservas.length === 0) {
                grid.innerHTML = estadoVacio('📋', 'No hay alquileres para tus equipos.');
                return;
            }

            grid.innerHTML = reservas.map((r, i) => `
            <div class="provider-order-card" style="animation-delay:${i * 0.05}s">
                <span class="order-id-tag">#${r.id}</span>
                <h3>${r.nombreHerramienta}</h3>
                <div class="order-details">
                    <div>👤 <strong>Cliente:</strong> ${r.nombreCliente}</div>
                    <div>📅 <strong>Periodo:</strong> ${r.fechaInicio} → ${r.fechaFin}</div>
                    <div>💰 <strong>Ganancia:</strong> <span class="gain-value">$${r.total}</span></div>
                    <div>Estado: <span class="status-badge ${resolverClaseEstado(r.estado)}">${r.estado}</span></div>
                </div>
                ${r.estado === 'ACTIVA' ? `
                <button onclick="window.confirmarDevolucion(${r.id})" class="btn-confirm">
                    ↺ Confirmar Devolución
                </button>` : ''}
            </div>`).join('');
        } else {
            grid.innerHTML = estadoError(`Error ${res.status}`);
        }
    } catch (err) {
        grid.innerHTML = estadoError();
        console.error('verEntregasPendientes error:', err);
    }
};

window.confirmarDevolucion = async function (reservaId) {
    if (!confirm('¿Confirmas que la herramienta ha sido devuelta en buen estado?')) return;

    const token = localStorage.getItem('jwt');
    try {
        const res = await fetch(`${API_URL}/reservas/${reservaId}/devolucion`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            notify('Devolución procesada. Stock actualizado.', 'success');
            window.verEntregasPendientes();
        } else {
            notify('Error al procesar la devolución.', 'error');
        }
    } catch (err) {
        notify('Error de conexión.', 'error');
        console.error('confirmarDevolucion error:', err);
    }
};

/* ============================================================
   MÓDULO: ADMINISTRADOR — Dashboard y estadísticas
============================================================ */
window.verDashboardAdmin = async function () {
    const token   = localStorage.getItem('jwt');
    const display = document.getElementById('data-display');
    if (!display) return;

    display.innerHTML = estadoCargando('Generando reporte global...');

    try {
        const res = await fetch(`${API_URL}/admin/dashboard`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            const stats = await res.json();
            display.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card amber">
                    <div class="stat-label">Herramientas totales</div>
                    <div class="stat-value">${stats.totalHerramientas || 0}</div>
                    <div class="stat-icon">🔧</div>
                </div>
                <div class="stat-card green">
                    <div class="stat-label">Alquileres realizados</div>
                    <div class="stat-value">${stats.totalReservas || 0}</div>
                    <div class="stat-icon">📋</div>
                </div>
                <div class="stat-card green">
                    <div class="stat-label">Ingresos totales</div>
                    <div class="stat-value green">$${stats.gananciasTotales || 0}</div>
                    <div class="stat-icon">💰</div>
                </div>
                <div class="stat-card steel">
                    <div class="stat-label">Usuarios registrados</div>
                    <div class="stat-value">${stats.totalUsuarios || '—'}</div>
                    <div class="stat-icon">👥</div>
                </div>
            </div>`;
        } else {
            display.innerHTML = estadoError(`Error ${res.status} al obtener estadísticas.`);
        }
    } catch (err) {
        display.innerHTML = estadoError();
        console.error('verDashboardAdmin error:', err);
    }
};

/* ============================================================
   MÓDULO: ADMINISTRADOR — Gestión de usuarios
============================================================ */
window.listarUsuarios = async function () {
    const token   = localStorage.getItem('jwt');
    const display = document.getElementById('data-display');
    if (!display) return;

    display.innerHTML = estadoCargando('Consultando base de usuarios...');

    try {
        const res = await fetch(`${API_URL}/usuarios`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            const usuarios = await res.json();
            display.innerHTML = `
            <div class="table-wrapper">
                <table class="styled-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Correo</th>
                            <th>Rol</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${usuarios.map(u => `
                        <tr>
                            <td class="user-id">#${u.id}</td>
                            <td class="user-name">${u.nombre} ${u.apellido}</td>
                            <td class="user-mail">${u.correo}</td>
                            <td>
                                <span class="status-badge ${u.rol === 'ADMINISTRADOR' ? 'pending' : u.rol === 'PROVEEDOR' ? 'active' : 'done'}">
                                    ${u.rol}
                                </span>
                            </td>
                            <td>
                                <button onclick="window.eliminarUsuario(${u.id})" class="btn-danger">Eliminar</button>
                            </td>
                        </tr>`).join('')}
                    </tbody>
                </table>
            </div>`;
        }
    } catch (err) {
        display.innerHTML = estadoError();
        console.error('listarUsuarios error:', err);
    }
};

window.eliminarUsuario = async function (id) {
    if (!confirm('⚠ ¿Eliminar este usuario? Esta acción es irreversible.')) return;

    const token = localStorage.getItem('jwt');
    try {
        const res = await fetch(`${API_URL}/usuarios/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (res.ok) {
            notify('Usuario eliminado.', 'success');
            window.listarUsuarios();
        } else if (res.status === 403) {
            notify('Sin permisos para esta acción.', 'error');
        } else {
            notify('No se pudo eliminar. El usuario puede tener registros activos.', 'error');
        }
    } catch (err) {
        notify('Error de conexión.', 'error');
        console.error('eliminarUsuario error:', err);
    }
};

/* ============================================================
   MÓDULO: MODALES — Abrir y cerrar
============================================================ */
window.abrirModalHerramienta = () => {
    const modal = document.getElementById('modal-herramienta-proveedor')
                || document.getElementById('modal-herramienta');
    if (modal) modal.classList.add('show');
};

window.cerrarModalHerramienta = () => {
    const modal = document.getElementById('modal-herramienta-proveedor')
                || document.getElementById('modal-herramienta');
    if (modal) modal.classList.remove('show');
};

window.cerrarModal = () => {
    const modal = document.getElementById('modal-reserva');
    if (modal) modal.classList.remove('show');
};

// Cierra cualquier modal al hacer click en el overlay
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('show');
    }
});

/* ============================================================
   MÓDULO: HELPERS DE UI — estados reutilizables
============================================================ */

/** Retorna el CSS class correcto según el estado de la reserva */
function resolverClaseEstado(estado) {
    const mapa = { 'ACTIVA': 'active', 'PENDIENTE': 'pending' };
    return mapa[estado] || 'done';
}

/** HTML para el estado de carga */
function estadoCargando(msg = 'Cargando...') {
    return `
    <div class="state-message" style="grid-column:1/-1;">
        <span class="state-icon pulse">⚙</span>
        ${msg}
    </div>`;
}

/** HTML para estado vacío */
function estadoVacio(icon, msg) {
    return `
    <div class="state-message" style="grid-column:1/-1;">
        <span class="state-icon">${icon}</span>
        ${msg}
    </div>`;
}

/** HTML para estado de error */
function estadoError(msg = 'Error de conexión con el servidor.') {
    return `
    <div class="state-message" style="grid-column:1/-1;">
        <span class="state-icon">⚠</span>
        ${msg}
    </div>`;
}

/* ============================================================
   INIT — Comprueba sesión activa al cargar la página
============================================================ */
window.onload = () => {
    if (localStorage.getItem('jwt')) mostrarDashboard();
};
