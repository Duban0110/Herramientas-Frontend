const API_URL = "http://localhost:8081/api";

// --- 1. GESTIÓN DE SESIÓN Y LOGIN ---
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
            
            const base64Url = data.token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(window.atob(base64));
            
            localStorage.setItem('usuarioId', payload.id || payload.userId); 
            localStorage.setItem('rol', payload.roles[0]);
            localStorage.setItem('username', payload.sub);

            mostrarDashboard();
        } else {
            alert("Acceso denegado: Credenciales incorrectas");
        }
    } catch (error) {
        console.error("Error en login:", error);
        alert("Error de conexión con el servidor.");
    }
});

function mostrarDashboard() {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('dashboard-container').style.display = 'block';
    
    const rol = localStorage.getItem('rol');
    const user = localStorage.getItem('username');
    document.getElementById('user-info').innerText = `${user} (${rol})`;
    
    cargarVistaPorRol(rol);
}

function logout() {
    localStorage.clear();
    location.reload();
}

// --- 2. ENRUTADOR DE VISTAS ---
function cargarVistaPorRol(rol) {
    const content = document.getElementById('content');
    
    if (rol === 'ADMINISTRADOR') {
        content.innerHTML = `
            <section class="admin-panel">
                <h2>Panel de Administración</h2>
                <div class="stats-grid">
                    <div class="card"><h3>Usuarios</h3><p id="count-usuarios">-</p></div>
                    <div class="card" style="border-top-color: var(--success)"><h3>Ingresos Totales</h3><p id="total-ventas">$0</p></div>
                    <div class="card" style="border-top-color: var(--warning)"><h3>Herramientas Disp.</h3><p id="count-disponibles">-</p></div>
                </div>
                <div class="actions" style="margin-bottom: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
                    <button onclick="listarUsuarios()" class="btn-primary" style="width: auto;">Usuarios</button>
                    <button onclick="verReporteVentas()" class="btn-primary" style="width: auto; background: var(--success);">Ver Ingresos</button>
                    <button onclick="cargarHerramientas()" class="btn-primary" style="width: auto; background: var(--dark);">Inventario</button>
                </div>
                <div id="data-display" class="data-table"><p>Seleccione una acción para ver los detalles...</p></div>
            </section>
        `;
        actualizarEstadisticasAdmin();
    } else {
        content.innerHTML = `
            <section class="cliente-panel">
                <div class="header-flex">
                    <h2>🛠️ Catálogo de Herramientas</h2>
                    <div style="display:flex; gap:10px;">
                        <button onclick="cargarHerramientas()" class="btn-primary" style="background:var(--dark); width:auto;">Ver Catálogo</button>
                        <button onclick="verMisReservas()" class="btn-primary" style="width:auto;">Mis Alquileres</button>
                    </div>
                </div>
                <div id="herramientas-grid" class="tools-grid">Cargando herramientas...</div>
            </section>
        `;
        cargarHerramientas();
    }
}

// --- 3. FUNCIONES DE ADMINISTRADOR ---
async function actualizarEstadisticasAdmin() {
    const token = localStorage.getItem('jwt');
    try {
        const resH = await fetch(`${API_URL}/herramientas`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (resH.ok) {
            const data = await resH.json();
            const disp = data.filter(h => h.stock > 0).length;
            document.getElementById('count-disponibles').innerText = `${disp} / ${data.length}`;
        }
        verReporteVentas(true); // Carga silenciosa para el card
    } catch (e) { console.error(e); }
}

async function listarUsuarios() {
    const token = localStorage.getItem('jwt');
    const display = document.getElementById('data-display');
    try {
        const response = await fetch(`${API_URL}/usuarios`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (response.ok) {
            const usuarios = await response.json();
            document.getElementById('count-usuarios').innerText = usuarios.length;
            let html = `<table class="styled-table"><thead><tr><th>ID</th><th>Nombre</th><th>Correo</th><th>Rol</th></tr></thead><tbody>`;
            usuarios.forEach(u => {
                html += `<tr><td>${u.id}</td><td>${u.nombre}</td><td>${u.correo}</td><td><span class="badge ${u.rol.toLowerCase()}">${u.rol}</span></td></tr>`;
            });
            display.innerHTML = html + `</tbody></table>`;
        }
    } catch (e) { console.error(e); }
}

async function verReporteVentas(soloCard = false) {
    const token = localStorage.getItem('jwt');
    try {
        const response = await fetch(`${API_URL}/admin/reportes/ingresos`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (response.ok) {
            const data = await response.json();
            const totalVal = data.totalIngresos || data;
            const formatMoney = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(totalVal);
            
            document.getElementById('total-ventas').innerText = formatMoney;
            
            if (!soloCard) {
                document.getElementById('data-display').innerHTML = `
                    <div class="card" style="text-align:center; border-top-color: var(--success)">
                        <h3>Ingresos Acumulados</h3>
                        <p style="font-size: 3rem; color: var(--success);">${formatMoney}</p>
                        <small>Basado en todas las reservas finalizadas y activas</small>
                    </div>`;
            }
        }
    } catch (e) { console.error(e); }
}

// --- 4. FUNCIONES DE CLIENTE ---
async function cargarHerramientas() {
    const token = localStorage.getItem('jwt');
    const grid = document.getElementById('herramientas-grid') || document.getElementById('data-display');
    try {
        const response = await fetch(`${API_URL}/herramientas`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (response.ok) {
            const herramientas = await response.json();
            grid.innerHTML = herramientas.map(h => `
                <div class="tool-card">
                    <div class="tool-status ${h.stock > 0 ? 'disponible' : 'alquilado'}">${h.stock > 0 ? 'DISPONIBLE' : 'AGOTADO'}</div>
                    <img src="https://via.placeholder.com/300x180?text=${encodeURIComponent(h.nombre)}" alt="${h.nombre}">
                    <div class="tool-info">
                        <h3>${h.nombre}</h3>
                        <p>${h.descripcion}</p>
                        <p style="margin-top:10px; font-size:0.9rem;">Stock: <strong>${h.stock}</strong> unidades</p>
                        <p class="price"><span>$${h.precioDia}</span> / día</p>
                        <button onclick="prepararReserva(${h.id}, '${h.nombre}')" class="btn-primary" ${h.stock <= 0 ? 'disabled' : ''}>
                            ${h.stock > 0 ? 'Reservar Ahora' : 'Sin Stock'}
                        </button>
                    </div>
                </div>`).join('');
        }
    } catch (e) { console.error(e); }
}

async function verMisReservas() {
    const token = localStorage.getItem('jwt');
    const grid = document.getElementById('herramientas-grid') || document.getElementById('data-display');
    try {
        const res = await fetch(`${API_URL}/reservas/mis-reservas`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
            const reservas = await res.json();
            let html = `<h3>Mis Alquileres Activos</h3><table class="styled-table"><thead><tr><th>Herramienta</th><th>Desde</th><th>Hasta</th><th>Estado</th></tr></thead><tbody>`;
            reservas.forEach(r => {
                html += `<tr><td>${r.nombreHerramienta}</td><td>${r.fechaInicio}</td><td>${r.fechaFin}</td><td><span class="badge activo">ACTIVO</span></td></tr>`;
            });
            grid.innerHTML = html + `</tbody></table>`;
        }
    } catch (e) { console.error(e); }
}

// --- 5. LÓGICA DE MODAL ---
function prepararReserva(id, nombre) {
    document.getElementById('reserva-tool-id').value = id;
    document.getElementById('reserva-tool-name').innerText = nombre;
    document.getElementById('modal-reserva').style.display = 'block';
}

function cerrarModal() {
    document.getElementById('modal-reserva').style.display = 'none';
}

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

    const response = await fetch(`${API_URL}/reservas`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if (response.ok) {
        alert("✅ Reserva exitosa.");
        cerrarModal();
        cargarHerramientas();
    } else {
        alert("❌ Error: " + await response.text());
    }
});

window.onload = () => { if (localStorage.getItem('jwt')) mostrarDashboard(); };