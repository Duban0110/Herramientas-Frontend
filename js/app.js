const API_URL = "http://localhost:8081/api";

/**
 * --- GESTIÓN DE INTERFAZ Y NAVEGACIÓN ---
 */

// Alterna entre los formularios de Login y Registro
window.toggleAuth = function(showRegister) {
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
    if(document.getElementById('modal-reserva')) window.cerrarModal();
    if(document.getElementById('modal-herramienta')) window.cerrarModalHerramienta();
    
    cargarVistaPorRol(rol);
}

window.logout = function() { 
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
                <section class="admin-panel">
                    <div class="header-flex" style="display:flex; justify-content:space-between; margin-bottom:20px;">
                        <h2>🛡️ Panel de Administración</h2>
                        <div style="display:flex; gap:10px;">
                            <button onclick="window.verDashboardAdmin()" class="btn-primary">📈 Reportes</button>
                            <button onclick="window.listarUsuarios()" class="btn-primary">👥 Usuarios</button>
                        </div>
                    </div>
                    <div id="data-display" class="tools-grid">Cargando...</div>
                </section>`;
            callback = () => window.verDashboardAdmin();
            break;

        case 'ROLE_PROVEEDOR':
            htmlContent = `
                <section class="proveedor-panel">
                    <div class="header-flex" style="display:flex; justify-content:space-between; margin-bottom:20px;">
                        <h2>📦 Mis Herramientas</h2>
                        <div style="display:flex; gap:10px;">
                            <button onclick="window.verEntregasPendientes()" class="btn-primary">Ver Alquileres</button>
                            <button onclick="window.abrirModalHerramienta()" class="btn-primary" style="background:var(--success);">+ Publicar</button>
                        </div>
                    </div>
                    <div id="data-display" class="tools-grid">Cargando...</div>
                </section>
                
                <div id="modal-herramienta" class="modal" style="display:none; position:fixed; z-index:10000; left:0; top:0; width:100%; height:100%; background:rgba(0,0,0,0.6);">
                    <div class="modal-content" style="background:#1e293b; color:white; margin:5% auto; padding:25px; width:450px; border-radius:12px; border:1px solid #334155;">
                        <h3 style="margin-top:0;">Publicar Nueva Herramienta</h3>
                        <form id="herramienta-form">
                            <input type="text" id="h-nombre" placeholder="Nombre de la herramienta" required class="form-control" style="margin-bottom:12px; width:100%;">
                            <textarea id="h-desc" placeholder="Descripción breve" class="form-control" style="margin-bottom:12px; width:100%; min-height:80px;"></textarea>
                            <input type="number" id="h-precio" placeholder="Precio por día ($)" required class="form-control" style="margin-bottom:12px; width:100%;">
                            <input type="number" id="h-stock" placeholder="Cantidad disponible (Stock)" required class="form-control" style="margin-bottom:12px; width:100%;">
                            <input type="text" id="h-imagen" placeholder="URL de la imagen (JPG, PNG)" class="form-control" style="margin-bottom:20px; width:100%;">
                            
                            <div style="display:flex; gap:10px;">
                                <button type="submit" class="btn-primary" style="background:#10b981; flex:1;">Publicar</button>
                                <button type="button" onclick="window.cerrarModalHerramienta()" class="btn-primary" style="background:#ef4444; flex:1;">Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>`;
            callback = () => window.cargarHerramientas();
            break;

        default: // VISTA CLIENTE
            htmlContent = `
                <section class="cliente-panel">
                    <div class="header-flex" style="display:flex; justify-content:space-between; margin-bottom:20px;">
                        <h2>🛠️ Catálogo de Herramientas</h2>
                        <div style="display:flex; gap:10px;">
                            <button onclick="window.cargarHerramientas()" class="btn-primary">Explorar</button>
                            <button onclick="window.verMisReservas()" class="btn-primary">Mis Alquileres</button>
                        </div>
                    </div>
                    <div id="herramientas-grid" class="tools-grid">Cargando...</div>
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

window.cargarHerramientas = async function() {
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
                <div class="tool-card" style="background:#1e293b; border-radius:12px; overflow:hidden; border: 1px solid #334155;">
                    <div style="width:100%; height:160px; position:relative;">
                        <img src="${imgSource}" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='https://via.placeholder.com/300x160?text=Sin+Imagen'">
                        <div style="position:absolute; top:10px; right:10px;" class="tool-status ${tieneStock ? 'disponible' : 'alquilado'}">
                            ${tieneStock ? 'DISPONIBLE' : 'AGOTADO'}
                        </div>
                    </div>
                    <div style="padding:15px; color:white;">
                        <h3 style="margin:0; font-size:1.1rem;">${h.nombre}</h3>
                        <p style="font-size:0.85rem; color:#94a3b8; margin:8px 0; height:32px; overflow:hidden;">${h.descripcion || 'Sin descripción'}</p>
                        <p style="color:#38bdf8; font-weight:bold; font-size:1.2rem; margin:10px 0;">$${h.precioDia} <span style="font-size:0.8rem; color:#64748b;">/ día</span></p>
                        
                        <button onclick="window.prepararReserva(${h.id}, '${h.nombre}')" 
                                class="btn-primary" 
                                ${!tieneStock ? 'disabled style="background:#475569; cursor:not-allowed;"' : 'style="background:#2563eb;"'}>
                            ${tieneStock ? 'Reservar Ahora' : 'No Disponible'}
                        </button>
                    </div>
                </div>`;
            }).join('');
        }
    } catch (e) { console.error("Error cargando herramientas:", e); }
};

// Captura global para el formulario dinámico de herramientas
document.addEventListener('submit', async (e) => {
    if (e.target && e.target.id === 'herramienta-form') {
        e.preventDefault();
        const token = localStorage.getItem('jwt');
        const usuarioId = localStorage.getItem('usuarioId');
        const stockVal = parseInt(document.getElementById('h-stock').value);

        const nuevaHerramienta = {
            nombre: document.getElementById('h-nombre').value,
            descripcion: document.getElementById('h-desc').value,
            precioDia: parseFloat(document.getElementById('h-precio').value),
            stock: stockVal,
            disponible: stockVal > 0,
            imagenUrl: document.getElementById('h-imagen').value,
            proveedor: { id: parseInt(usuarioId) } 
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
                window.cargarHerramientas();
            }
        } catch (error) { console.error("Error al publicar:", error); }
    }
});

/**
 * --- GESTIÓN DE RESERVAS Y PAGOS ---
 */

window.prepararReserva = function(id, nombre) {
    const modal = document.getElementById('modal-reserva');
    if(modal) {
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

window.procesarPagoYDescargarFactura = async function(reservaId, monto) {
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

window.abrirModalHerramienta = () => document.getElementById('modal-herramienta').style.display = 'block';
window.cerrarModalHerramienta = () => document.getElementById('modal-herramienta').style.display = 'none';
window.cerrarModal = () => document.getElementById('modal-reserva').style.display = 'none';

window.onload = () => { 
    if (localStorage.getItem('jwt')) mostrarDashboard(); 
};