const API_URL = "http://localhost:8081/api";

/**
 * --- GESTIÓN DE INTERFAZ Y NAVEGACIÓN ---
 */

// Alterna entre los formularios de Login y Registro
window.toggleAuth = function (showRegister) {
    const loginCont = document.getElementById('login-container');
    const regCont = document.getElementById('register-container');
    if (loginCont && regCont) {
        loginCont.style.display = showRegister ? 'none' : 'block';
        regCont.style.display = showRegister ? 'block' : 'none';
    }
};

// Controla la visibilidad del dashboard y limpia residuos de modales
function mostrarDashboard() {
    document.getElementById('auth-wrapper').style.display = 'none';
    document.getElementById('dashboard-container').style.display = 'block';

    const rol = localStorage.getItem('rol');
    const user = localStorage.getItem('username');
    document.getElementById('user-info').innerText = `${user} (${rol})`;

    // Asegura que los modales inicien cerrados al cargar la vista
    if (document.getElementById('modal-reserva')) window.cerrarModal();
    if (document.getElementById('modal-herramienta')) window.cerrarModalHerramienta();

    cargarVistaPorRol(rol);
}

window.logout = function () {
    localStorage.clear();
    location.reload();
};

/**
 * --- AUTENTICACIÓN Y REGISTRO ---
 */

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const correo = document.getElementById('email').value;
    const contrasena = document.getElementById('password').value;

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo, contrasena })
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('jwt', data.token);

            // Decodificación manual del Payload del JWT para extraer info del usuario
            const payload = JSON.parse(window.atob(data.token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));

            localStorage.setItem('usuarioId', payload.id || payload.userId || payload.sub);
            localStorage.setItem('rol', (payload.roles ? payload.roles[0] : (payload.role || "")).replace("ROLE_", ""));
            localStorage.setItem('username', payload.sub || correo);

            alert("¡Bienvenido!");
            mostrarDashboard();
        } else {
            alert("Credenciales incorrectas.");
        }
    } catch (error) { console.error("Error en login:", error); }
});

document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        nombre: document.getElementById('reg-nombre').value,
        apellido: document.getElementById('reg-apellido').value,
        correo: document.getElementById('reg-correo').value,
        contrasena: document.getElementById('reg-pass').value,
        rol: document.getElementById('reg-rol').value
    };
    try {
        const res = await fetch(`${API_URL}/usuarios`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (res.ok) {
            alert("✅ Registro exitoso");
            window.toggleAuth(false);
        }
    } catch (err) { console.error("Error en registro:", err); }
});

/**
 * --- ENRUTADOR DINÁMICO POR ROL ---
 */

function cargarVistaPorRol(rol) {
    const content = document.getElementById('content');
    if (!content) return;

    const userRol = rol.startsWith('ROLE_') ? rol : `ROLE_${rol}`;
    let htmlContent = '';
    let callback = null;

    switch (userRol) {
        case 'ROLE_ADMINISTRADOR':
            htmlContent = `
    <section class="admin-panel fade-in">
        <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:2rem; border-bottom:2px solid var(--primary); padding-bottom:1rem;">
            <h2 style="text-transform:uppercase; font-weight:900; letter-spacing:1px;">🛡️ Control de Gestión</h2>
            <div style="display:flex; gap:10px;">
                <button onclick="window.verDashboardAdmin()" class="btn-primary" style="width:auto; padding:0.6rem 1.2rem;">📈 Reportes Globales</button>
                <button onclick="window.listarUsuarios()" class="btn-primary" style="width:auto; padding:0.6rem 1.2rem; background:var(--accent);">👥 Base de Usuarios</button>
            </div>
        </div>
        <div id="data-display">
            <div class="loader" style="padding:20px; color:var(--primary); font-weight:bold;">Sincronizando datos...</div>
        </div>
    </section>`;
callback = () => window.verDashboardAdmin();
break;

        case 'ROLE_PROVEEDOR':

        htmlContent = `
        <section class="proveedor-panel fade-in">
            <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:2rem; border-bottom:2px solid var(--primary); padding-bottom:1rem;">
                <h2 style="text-transform:uppercase; font-weight:900; letter-spacing:1px;">⚒️ Gestión de Inventario</h2>
                <div style="display:flex; gap:10px;">
                    <button onclick="window.verEntregasPendientes()" class="btn-primary" style="width:auto; padding:0.6rem 1.2rem;">Ver Alquileres</button>
                    <button onclick="window.abrirModalHerramienta()" class="btn-primary" style="width:auto; padding:0.6rem 1.2rem; background:var(--accent);">+ Publicar Herramienta</button>
                </div>
            </div>
            <div id="data-display" class="tools-grid">Cargando herramientas...</div>
        </section>
        
        <div id="modal-herramienta-proveedor" class="modal">
            <div class="modal-content" style="border-top: 8px solid var(--primary); border-radius: 0; background: var(--bg-card);">
                <span class="close-btn" onclick="window.cerrarModalHerramienta()">&times;</span>
                <h3 style="text-transform:uppercase; font-weight:900; margin-bottom:1.5rem; color:var(--primary);">Nueva Entrada de Equipo</h3>
                
                <form id="herramienta-form-proveedor">
                    <div class="input-group">
                        <label>Nombre del Equipo</label>
                        <input type="text" id="hp-nombre" placeholder="Ej. Mezcladora de Cemento" required>
                    </div>
                    
                    <div class="input-group">
                        <label>Especificaciones Técnicas</label>
                        <textarea id="hp-desc" placeholder="Detalles de potencia, capacidad, etc." style="min-height:80px;"></textarea>
                    </div>
                    
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
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
                        <label>Enlace de Imagen</label>
                        <input type="text" id="hp-imagen" placeholder="URL de la fotografía">
                    </div>
                    
                    <div style="display:flex; gap:10px; margin-top:1rem;">
                        <button type="submit" class="btn-primary" style="flex:2;">Confirmar Publicación</button>
                        <button type="button" onclick="window.cerrarModalHerramienta()" class="btn-primary" style="background:var(--danger); flex:1;">Cancelar</button>
                    </div>
                </form>
            </div>
        </div>`;
            callback = () => window.cargarHerramientas();
            break;

        default: // VISTA CLIENTE
        htmlContent = `
        <section class="cliente-panel fade-in">
            <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:2rem; border-bottom:2px solid var(--primary); padding-bottom:1rem;">
                <h2 style="text-transform:uppercase; font-weight:900; letter-spacing:1px;">⚒️ Catálogo de Equipos</h2>
                <div style="display:flex; gap:10px;">
                    <button onclick="window.cargarHerramientas()" class="btn-primary" style="width:auto; padding:0.6rem 1.2rem;">Explorar Equipos</button>
                    <button onclick="window.verMisReservas()" class="btn-primary" style="width:auto; padding:0.6rem 1.2rem; background:var(--accent);">Mis Alquileres</button>
                </div>
            </div>
            
            <div id="herramientas-grid" class="tools-grid">
                <div class="loader" style="padding:20px; color:var(--primary); font-weight:bold;">Localizando herramientas disponibles...</div>
            </div>
        </section>`;
    callback = () => window.cargarHerramientas();
    break;
    }
    content.innerHTML = htmlContent;
    if (callback) setTimeout(callback, 50);
}

/**
 * --- GESTIÓN DE HERRAMIENTAS ---
 */

window.cargarHerramientas = async function () {
    const token = localStorage.getItem('jwt');
    const grid = document.getElementById('herramientas-grid') || document.getElementById('data-display');
    if (!grid) return;

    try {
        const response = await fetch(`${API_URL}/herramientas`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const herramientas = await response.json();
            grid.innerHTML = herramientas.map(h => {
                const imgSource = h.imagenUrl || 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=500';
                const tieneStock = h.stock > 0;

                return `
                <div class="tool-card" style="display: flex; flex-direction: column; background: var(--bg-card);">
                    <div style="width:100%; height:180px; position:relative; overflow:hidden;">
                        <img src="${imgSource}" 
                            style="width:100%; height:100%; object-fit:cover; border-bottom:1px solid var(--border);" 
                            onerror="this.src='https://via.placeholder.com/300x180?text=Equipo+Sin+Imagen'">
                        
                        <div style="position:absolute; top:12px; right:12px; padding:4px 10px; font-size:0.65rem; font-weight:900; text-transform:uppercase; color:white; background:${tieneStock ? 'var(--primary)' : 'var(--danger)'};">
                            ${tieneStock ? 'En Stock' : 'Sin Stock'}
                        </div>
                    </div>
                    
                    <div class="tool-info" style="padding:1.5rem; flex-grow:1; display:flex; flex-direction:column;">
                        <h3 style="margin:0; font-size:1rem; text-transform:uppercase; font-weight:800; color:var(--text-dark);">${h.nombre}</h3>
                        <p style="font-size:0.8rem; color:var(--text-muted); margin:10px 0; height:40px; overflow:hidden; line-height:1.4;">
                            ${h.descripcion || 'Sin especificaciones técnicas proporcionadas.'}
                        </p>
                        
                        <div style="background: #f0f0e0; padding: 12px; margin-bottom: 15px; border-left: 4px solid var(--primary);">
                            <span style="display:block; font-size:0.65rem; font-weight:800; color:var(--primary); text-transform:uppercase; letter-spacing:0.5px;">Tarifa Diaria</span>
                            <span style="font-size:1.4rem; font-weight:900; color:var(--text-dark);">$${h.precioDia}</span>
                        </div>

                        <div style="font-size:0.75rem; font-weight:700; color:var(--text-muted); margin-bottom:15px; text-transform:uppercase;">
                            Cantidad: <span style="color:${tieneStock ? 'var(--primary)' : 'var(--danger)'};">${h.stock} Unidades</span>
                        </div>
                        
                        <button onclick="window.prepararReserva(${h.id}, '${h.nombre}')" 
                                class="btn-primary" 
                                ${!tieneStock ? 'disabled' : ''}
                                style="margin-top:auto; padding:0.8rem; font-size:0.75rem;">
                            ${tieneStock ? 'SOLICITAR EQUIPO' : 'AGOTADO TEMPORALMENTE'}
                        </button>
                    </div>
                </div>`;
            }).join('');
        }
    } catch (e) { console.error("Error cargando herramientas:", e); }
};

// Captura global para el formulario dinámico de herramientas
document.addEventListener('submit', async (e) => {
    // Escuchamos el nuevo ID del formulario del proveedor
    if (e.target && e.target.id === 'herramienta-form-proveedor') {
        e.preventDefault();
        const token = localStorage.getItem('jwt');
        const usuarioId = localStorage.getItem('usuarioId');
        
        const stockVal = parseInt(document.getElementById('hp-stock').value);

        const nuevaHerramienta = {
            nombre: document.getElementById('hp-nombre').value,
            descripcion: document.getElementById('hp-desc').value,
            precioDia: parseFloat(document.getElementById('hp-precio').value),
            stock: stockVal,
            disponible: stockVal > 0,
            imagenUrl: document.getElementById('hp-imagen').value || '',
            proveedor: { id: parseInt(usuarioId) } // Importante: Enviamos el objeto proveedor
        };

        try {
            const response = await fetch(`${API_URL}/herramientas`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(nuevaHerramienta)
            });

            if (response.ok) {
                alert("✅ ¡Herramienta publicada!");
                window.cerrarModalHerramienta();
                window.cargarHerramientas(); // Recarga la lista
            } else {
                alert("Error al publicar. Revisa la consola.");
            }
        } catch (error) { console.error("Error al publicar:", error); }
    }
});

/**
 * --- GESTIÓN DE RESERVAS Y PAGOS ---
 */

window.prepararReserva = function (id, nombre) {
    const modal = document.getElementById('modal-reserva');
    if (modal) {
        document.getElementById('reserva-tool-id').value = id;
        document.getElementById('reserva-tool-name').innerText = nombre;
        modal.style.display = 'block';
    }
};

document.getElementById('reserva-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('jwt');
    const usuarioId = localStorage.getItem('usuarioId');
    const data = {
        clienteId: parseInt(usuarioId),
        herramientaId: parseInt(document.getElementById('reserva-tool-id').value),
        fechaInicio: document.getElementById('fecha-inicio').value,
        fechaFin: document.getElementById('fecha-fin').value
    };
    try {
        const response = await fetch(`${API_URL}/reservas`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (response.ok) {
            alert("✅ Reserva exitosa.");
            window.cerrarModal();
            window.cargarHerramientas();
        }
    } catch (err) { console.error("Error en reserva:", err); }
});

window.procesarPagoYDescargarFactura = async function (reservaId, monto) {
    const token = localStorage.getItem('jwt');
    try {
        const response = await fetch(`${API_URL}/reservas/pagar/descargar`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ reservaId, monto })
        });
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Factura_${reservaId}.pdf`;
        a.click();
    } catch (error) { console.error("Error al descargar PDF:", error); }
};

/**
 * --- UTILIDADES DE MODALES Y CARGA INICIAL ---
 */

window.abrirModalHerramienta = () => {
    const modal = document.getElementById('modal-herramienta-proveedor') || document.getElementById('modal-herramienta');
    if(modal) modal.style.display = 'block';
};

window.cerrarModalHerramienta = () => {
    const modal = document.getElementById('modal-herramienta-proveedor') || document.getElementById('modal-herramienta');
    if(modal) modal.style.display = 'none';
};
window.cerrarModal = () => document.getElementById('modal-reserva').style.display = 'none';

window.onload = () => {
    if (localStorage.getItem('jwt')) mostrarDashboard();
};

window.verMisReservas = async function () {
    const token = localStorage.getItem('jwt');
    const grid = document.getElementById('herramientas-grid');

    if (!grid) return;

    try {
        grid.innerHTML = '<p style="color:white;">Cargando tus alquileres...</p>';

        // CORRECCIÓN: Usamos el endpoint que sí funciona en Swagger
        const response = await fetch(`${API_URL}/reservas/mis-reservas`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const reservas = await response.json();
            if (reservas.length === 0) {
                grid.innerHTML = '<p style="color:white;">No tienes alquileres activos.</p>';
                return;
            }

            // CORRECCIÓN: Usamos r.nombreHerramienta (como sale en tu JSON de Swagger)
            grid.innerHTML = reservas.map(r => `
                <div class="tool-card" style="background:#1e293b; border-radius:12px; padding:15px; border: 1px solid #334155; color:white;">
                    <h3 style="color:#38bdf8;">${r.nombreHerramienta}</h3> 
                    <p style="font-size: 0.9rem; color: #94a3b8;">Cliente: ${r.nombreCliente}</p>
                    <hr style="border: 0.1px solid #334155; margin: 10px 0;">
                    <p><strong>Desde:</strong> ${r.fechaInicio}</p>
                    <p><strong>Hasta:</strong> ${r.fechaFin}</p>
                    <p style="font-size: 1.2rem; color: #10b981; margin: 10px 0;"><strong>Total:</strong> $${r.total}</p>
                    <span class="tool-status disponible" style="display:inline-block; margin-bottom:10px; background: #1e40af;">${r.estado}</span>
                    <button onclick="window.procesarPagoYDescargarFactura(${r.id}, ${r.total})" class="btn-primary" style="background:#10b981; width:100%;">
                        📄 Descargar Factura
                    </button>
                </div>
            `).join('');
        } else {
            grid.innerHTML = `<p style="color:red;">Error del servidor: ${response.status}</p>`;
        }
    } catch (e) {
        console.error("Error al ver reservas:", e);
        grid.innerHTML = '<p style="color:red;">Error de conexión.</p>';
    }
};

window.verEntregasPendientes = async function () {
    const token = localStorage.getItem('jwt');
    const grid = document.getElementById('data-display');

    if (!grid) return;

    try {
        grid.innerHTML = '<p style="color:white; padding:20px;">Cargando historial de alquileres...</p>';
        
        // CORRECCIÓN: Quitamos el ID de la URL porque el Backend lo saca del Token
        const response = await fetch(`${API_URL}/reservas/proveedor`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            const reservas = await response.json();
            
            if (reservas.length === 0) {
                grid.innerHTML = '<p style="color:white; padding:20px;">No hay alquileres registrados para tus herramientas.</p>';
                return;
            }

            grid.innerHTML = reservas.map(r => `
                <div class="tool-card" style="background:#1e293b; border-radius:12px; padding:15px; border: 1px solid #eab308; color:white;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <h3 style="color:#eab308; margin:0;">${r.nombreHerramienta}</h3>
                        <span style="background:#334155; padding:4px 8px; border-radius:6px; font-size:0.75rem;">ID #${r.id}</span>
                    </div>
                    
                    <div style="font-size:0.9rem; line-height:1.6;">
                        <p>👤 <strong>Cliente:</strong> ${r.nombreCliente}</p>
                        <p>📅 <strong>Periodo:</strong> ${r.fechaInicio} al ${r.fechaFin}</p>
                        <p>💰 <strong>Ganancia Total:</strong> <span style="color:#10b981; font-weight:bold;">$${r.total}</span></p>
                        <p>🏷️ <strong>Estado:</strong> ${r.estado}</p>
                    </div>

                    ${r.estado === 'ACTIVA' ? `
                        <button onclick="window.confirmarDevolucion(${r.id})" 
                                class="btn-primary" 
                                style="background:#f59e0b; width:100%; margin-top:15px;">
                            🔄 Confirmar Devolución
                        </button>
                    ` : ''}
                </div>
            `).join('');
        } else {
            grid.innerHTML = `<p style="color:red; padding:20px;">Error: ${response.status} - No se pudo cargar la información.</p>`;
        }
    } catch (e) {
        console.error("Error en verEntregasPendientes:", e);
        grid.innerHTML = '<p style="color:red; padding:20px;">Error de conexión.</p>';
    }
};

window.confirmarDevolucion = async function (reservaId) {
    if (!confirm("¿Confirmas que la herramienta ha sido devuelta en buen estado?")) return;

    const token = localStorage.getItem('jwt');
    try {
        const response = await fetch(`${API_URL}/reservas/${reservaId}/devolucion`, {
            method: 'PATCH', // O 'PUT' según como lo tengas en tu Controller
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            alert("✅ Devolución procesada. El stock se ha actualizado.");
            window.verEntregasPendientes(); // Refrescar la lista
        } else {
            alert("Error al procesar la devolución.");
        }
    } catch (e) {
        console.error("Error:", e);
    }
};

/**
 * --- GESTIÓN ADMINISTRATIVA ---
 */

// Función para ver el resumen de reportes
window.verDashboardAdmin = async function () {
    const token = localStorage.getItem('jwt');
    const display = document.getElementById('data-display');
    if (!display) return;

    try {
        display.innerHTML = '<p style="color:white; padding:20px;">Generando reporte global...</p>';
        
        // El endpoint debe coincidir con tu AdminController
        const response = await fetch(`${API_URL}/admin/dashboard`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const stats = await response.json();
            display.innerHTML = `
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; width: 100%; padding: 10px;">
                    <div style="background: #1e293b; padding: 25px; border-radius: 12px; border-top: 4px solid #38bdf8; text-align: center;">
                        <h4 style="color: #94a3b8; margin: 0; text-transform: uppercase; font-size: 0.8rem;">Herramientas Totales</h4>
                        <p style="font-size: 2.5rem; color: white; margin: 10px 0; font-weight: bold;">${stats.totalHerramientas || 0}</p>
                    </div>
                    <div style="background: #1e293b; padding: 25px; border-radius: 12px; border-top: 4px solid #10b981; text-align: center;">
                        <h4 style="color: #94a3b8; margin: 0; text-transform: uppercase; font-size: 0.8rem;">Alquileres Realizados</h4>
                        <p style="font-size: 2.5rem; color: white; margin: 10px 0; font-weight: bold;">${stats.totalReservas || 0}</p>
                    </div>
                    <div style="background: #1e293b; padding: 25px; border-radius: 12px; border-top: 4px solid #f59e0b; text-align: center;">
                        <h4 style="color: #94a3b8; margin: 0; text-transform: uppercase; font-size: 0.8rem;">Ingresos Totales</h4>
                        <p style="font-size: 2.5rem; color: #10b981; margin: 10px 0; font-weight: bold;">$${stats.gananciasTotales || 0}</p>
                    </div>
                </div>
            `;
        } else {
            display.innerHTML = `<p style="color:red; padding:20px;">Error al obtener estadísticas (Status: ${response.status}).</p>`;
        }
    } catch (e) {
        console.error("Error en dashboard admin:", e);
        display.innerHTML = '<p style="color:red; padding:20px;">Error de conexión con el servidor.</p>';
    }
};

// Función para ver y gestionar usuarios
window.listarUsuarios = async function () {
    const token = localStorage.getItem('jwt');
    const display = document.getElementById('data-display');

    try {
        display.innerHTML = '<p style="color:white; padding:20px;">Consultando base de datos de usuarios...</p>';
        const response = await fetch(`${API_URL}/usuarios`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const usuarios = await response.json();
            display.innerHTML = `
                <div style="overflow-x: auto; padding: 10px;">
                    <table style="width: 100%; color: white; border-collapse: collapse; background: #1e293b; border-radius: 12px; overflow: hidden;">
                        <thead style="background: #334155; color: #38bdf8;">
                            <tr>
                                <th style="padding: 15px; text-align: left;">ID</th>
                                <th style="padding: 15px; text-align: left;">Usuario</th>
                                <th style="padding: 15px; text-align: left;">Email</th>
                                <th style="padding: 15px; text-align: left;">Rol</th>
                                <th style="padding: 15px; text-align: center;">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${usuarios.map(u => `
                                <tr style="border-bottom: 1px solid #334155; transition: 0.3s; cursor: default;">
                                    <td style="padding: 15px;">#${u.id}</td>
                                    <td style="padding: 15px; font-weight: bold;">${u.nombre} ${u.apellido}</td>
                                    <td style="padding: 15px; color: #94a3b8;">${u.correo}</td>
                                    <td style="padding: 15px;">
                                        <span style="background: ${u.rol === 'ADMINISTRADOR' ? '#7c3aed' : '#2563eb'}; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem;">
                                            ${u.rol}
                                        </span>
                                    </td>
                                    <td style="padding: 15px; text-align: center;">
                                        <button onclick="window.eliminarUsuario(${u.id})" 
                                                style="background: #ef4444; border: none; color: white; padding: 6px 12px; border-radius: 6px; cursor: pointer;">
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }
    } catch (e) {
        console.error("Error listando usuarios:", e);
    }
};

// Función para eliminar usuario (Opcional pero recomendada)
window.eliminarUsuario = async function (id) {
    // 1. Mensaje de confirmación (Ventana emergente del navegador)
    const confirmar = confirm("⚠️ ¿Estás seguro de que deseas eliminar a este usuario? \nEsta acción no se puede deshacer y podría fallar si el usuario tiene registros asociados.");

    if (!confirmar) {
        return; // Si el admin cancela, no hace nada
    }

    const token = localStorage.getItem('jwt');

    try {
        // 2. Petición al servidor
        const response = await fetch(`${API_URL}/usuarios/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            alert("✅ Usuario eliminado exitosamente.");
            
            // 3. Refrescar la lista de usuarios automáticamente
            if (typeof window.listarUsuarios === 'function') {
                window.listarUsuarios();
            }
        } else if (response.status === 403) {
            alert("🚫 No tienes permisos suficientes para realizar esta acción.");
        } else {
            const errorData = await response.json().catch(() => ({}));
            alert(`❌ No se pudo eliminar: ${errorData.message || 'El usuario tiene herramientas o reservas activas.'}`);
        }
    } catch (error) {
        console.error("Error al eliminar usuario:", error);
        alert("conexión perdida con el servidor.");
    }
};

