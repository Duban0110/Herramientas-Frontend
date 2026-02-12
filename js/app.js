const API_URL = "http://localhost:8081/api";

// --- 1. NAVEGACIÓN ENTRE LOGIN Y REGISTRO ---
function toggleAuth(showRegister) {
    document.getElementById('login-container').style.display = showRegister ? 'none' : 'block';
    document.getElementById('register-container').style.display = showRegister ? 'block' : 'none';
}

// --- 2. GESTIÓN DE SESIÓN Y LOGIN ---
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
            
            // Decodificación del Payload del JWT (Manejo robusto de Base64)
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

// --- 3. REGISTRO DE NUEVOS USUARIOS (Mantiene Apellido y Rol) ---
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
            alert("✅ Registro exitoso. Ahora puedes iniciar sesión.");
            toggleAuth(false);
            document.getElementById('register-form').reset();
        } else {
            const errorMsg = await res.text();
            alert("❌ Error al registrar: " + errorMsg);
        }
    } catch (err) {
        console.error(err);
        alert("Error de conexión.");
    }
});

function mostrarDashboard() {
    document.getElementById('auth-wrapper').style.display = 'none';
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

// --- 4. ENRUTADOR DE VISTAS POR ROL (Lógica completa) ---
function cargarVistaPorRol(rol) {
    const content = document.getElementById('content');
    
    // Normalizamos el rol para comparaciones
    const userRol = rol.startsWith('ROLE_') ? rol : `ROLE_${rol}`;

    if (userRol === 'ROLE_ADMINISTRADOR') {
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
        // Pequeño delay para asegurar que el DOM registró los IDs
        setTimeout(() => actualizarEstadisticasAdmin(), 50);

    } else if (userRol === 'ROLE_PROVEEDOR') {
        content.innerHTML = `
            <section class="proveedor-panel">
                <div class="header-flex" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                    <h2>📦 Gestión de Mis Herramientas</h2>
                    <button onclick="abrirModalHerramienta()" class="btn-primary" style="width:auto; background:var(--success);">+ Publicar Herramienta</button>
                </div>
                <div id="data-display" class="tools-grid">Cargando tus publicaciones...</div>
            </section>
        `;
        setTimeout(() => cargarHerramientas(), 50);

    } else {
        content.innerHTML = `
            <section class="cliente-panel">
                <div class="header-flex" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                    <h2>🛠️ Catálogo de Herramientas</h2>
                    <div style="display:flex; gap:10px;">
                        <button onclick="cargarHerramientas()" class="btn-primary" style="background:var(--dark); width:auto;">Ver Catálogo</button>
                        <button onclick="verMisReservas()" class="btn-primary" style="width:auto;">Mis Alquileres</button>
                    </div>
                </div>
                <div id="herramientas-grid" class="tools-grid">Cargando herramientas...</div>
            </section>
        `;
        setTimeout(() => cargarHerramientas(), 50);
    }
}

// --- 5. FUNCIONES DE ADMINISTRADOR (Mantiene toda la lógica de reportes) ---
async function actualizarEstadisticasAdmin() {
    const token = localStorage.getItem('jwt');
    try {
        const resH = await fetch(`${API_URL}/herramientas`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (resH.ok) {
            const data = await resH.json();
            const disp = data.filter(h => h.stock > 0).length;
            const dispElem = document.getElementById('count-disponibles');
            if(dispElem) dispElem.innerText = `${disp} / ${data.length}`;
        }
        verReporteVentas(true); 
    } catch (e) { console.error(e); }
}

async function listarUsuarios() {
    const token = localStorage.getItem('jwt');
    const display = document.getElementById('data-display');
    try {
        const response = await fetch(`${API_URL}/usuarios`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (response.ok) {
            const usuarios = await response.json();
            const countElem = document.getElementById('count-usuarios');
            if(countElem) countElem.innerText = usuarios.length;
            
            let html = `<table class="styled-table"><thead><tr><th>ID</th><th>Nombre Completo</th><th>Correo</th><th>Rol</th></tr></thead><tbody>`;
            usuarios.forEach(u => {
                const nombreCompleto = u.apellido ? `${u.nombre} ${u.apellido}` : u.nombre;
                html += `<tr><td>${u.id}</td><td>${nombreCompleto}</td><td>${u.correo}</td><td><span class="badge ${u.rol.toLowerCase()}">${u.rol}</span></td></tr>`;
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
            
            const ventasElem = document.getElementById('total-ventas');
            if (ventasElem) ventasElem.innerText = formatMoney;
            
            if (!soloCard) {
                const display = document.getElementById('data-display');
                if(display) {
                    display.innerHTML = `
                        <div class="card" style="text-align:center; border-top-color: var(--success)">
                            <h3>Ingresos Acumulados</h3>
                            <p style="font-size: 3rem; color: var(--success);">${formatMoney}</p>
                            <small>Basado en todas las reservas finalizadas y activas</small>
                        </div>`;
                }
            }
        }
    } catch (e) { console.error(e); }
}

// --- 6. FUNCIONES DE CARGA DE HERRAMIENTAS ---
async function cargarHerramientas() {
    const token = localStorage.getItem('jwt');
    const grid = document.getElementById('herramientas-grid') || document.getElementById('data-display');

    if (!grid) {
        console.warn("Contenedor no listo, reintentando...");
        return; 
    }

    try {
        const response = await fetch(`${API_URL}/herramientas`, { 
            headers: { 'Authorization': `Bearer ${token}` } 
        });
        
        if (response.ok) {
            const herramientas = await response.json();
            if (herramientas.length === 0) {
                grid.innerHTML = "<p>No hay herramientas publicadas todavía.</p>";
                return;
            }
            grid.innerHTML = herramientas.map(h => `
                <div class="tool-card">
                    <div class="tool-status ${h.stock > 0 ? 'disponible' : 'alquilado'}">
                        ${h.stock > 0 ? 'DISPONIBLE' : 'AGOTADO'}
                    </div>
                    <div class="tool-info">
                        <h3>${h.nombre}</h3>
                        <p>${h.descripcion}</p>
                        <p style="margin-top:10px; font-size:0.9rem;">Stock: <strong>${h.stock}</strong></p>
                        <p class="price"><span>$${h.precioDia}</span> / día</p>
                        <p style="font-size:0.8rem; color:#666;">Proveedor: ${h.nombreProveedor || 'Sistema'}</p>
                        <button onclick="prepararReserva(${h.id}, '${h.nombre}')" 
                                class="btn-primary" ${h.stock <= 0 ? 'disabled' : ''} style="margin-top:10px;">
                            ${h.stock > 0 ? 'Reservar Ahora' : 'Sin Stock'}
                        </button>
                    </div>
                </div>`).join('');
        }
    } catch (e) { 
        console.error("Error cargando herramientas:", e); 
    }
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

// --- 7. LÓGICA DE MODAL Y RESERVAS ---
function prepararReserva(id, nombre) {
    const modal = document.getElementById('modal-reserva');
    if(modal) {
        document.getElementById('reserva-tool-id').value = id;
        document.getElementById('reserva-tool-name').innerText = nombre;
        modal.style.display = 'block';
    }
}

function cerrarModal() {
    document.getElementById('modal-reserva').style.display = 'none';
    document.getElementById('reserva-form').reset();
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

    try {
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
    } catch (err) { console.error(err); }
});

// --- 8. FUNCIONES DEL PROVEEDOR ---

// Exportamos estas funciones al objeto global para evitar el Uncaught ReferenceError en el HTML
window.abrirModalHerramienta = function() {
    const modal = document.getElementById('modal-herramienta');
    if(modal) modal.style.display = 'block';
}

window.cerrarModalHerramienta = function() {
    const modal = document.getElementById('modal-herramienta');
    if(modal) {
        modal.style.display = 'none';
        document.getElementById('herramienta-form').reset();
    }
}

document.getElementById('herramienta-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('jwt');
    
    // Capturamos y validamos los valores numéricos
    const precio = parseFloat(document.getElementById('h-precio').value);
    const stock = parseInt(document.getElementById('h-stock').value);

    // Creamos el objeto incluyendo el campo 'disponible' que exige tu DB
    const nuevaHerramienta = {
        nombre: document.getElementById('h-nombre').value,
        descripcion: document.getElementById('h-desc').value,
        precioDia: parseFloat(document.getElementById('h-precio').value),
        stock: parseInt(document.getElementById('h-stock').value),
        disponible: parseInt(document.getElementById('h-stock').value) > 0 // Coincide con el nuevo campo en Java
    };
    console.log("Enviando herramienta a la DB:", nuevaHerramienta);

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
            alert("✅ ¡Herramienta publicada con éxito!");
            window.cerrarModalHerramienta();
            cargarHerramientas(); // Refresca la lista automáticamente
        } else {
            const errDetail = await response.text();
            alert("❌ Error del servidor: " + errDetail);
        }
    } catch (error) {
        console.error("Error de red:", error);
        alert("Error de conexión al intentar publicar.");
    }
});

// --- 9. INICIALIZACIÓN ---
window.onload = () => { 
    if (localStorage.getItem('jwt')) {
        mostrarDashboard(); 
    }
};