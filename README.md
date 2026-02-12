# 🛠️ Herramientas Frontend

Interfaz de usuario moderna y responsiva para la plataforma de renta de herramientas. Desarrollada con **JavaScript Vanilla**, **CSS3** y **HTML5**, enfocada en la velocidad y una experiencia de usuario fluida.

🔗 **Repositorio del Backend:** [Herramientas-Backend](https://github.com/Duban0110/Herramientas-Backend.git)

---

## 🎨 Características Visuales

* **Dashboard Dinámico:** Cambia según el rol del usuario (Admin, Proveedor, Cliente).
* **Catálogo Interactivo:** Galería de herramientas con carga dinámica de imágenes y estados de stock.
* **Sistema de Modales:** Formularios emergentes para reservas y publicación de productos sin recargar la página.
* **Diseño Responsivo:** Adaptado para una navegación cómoda en diferentes tamaños de pantalla.



---

## 🚀 Funcionalidades por Rol

### 🛡️ Administrador
- Visualización de métricas de ingresos globales.
- Gestión y listado de usuarios registrados.

### 📦 Proveedor
- Publicación de nuevas herramientas con URL de imagen.
- Panel de control para gestionar herramientas propias.
- Confirmación de devoluciones y gestión de alquileres recibidos.

### 👤 Cliente
- Exploración de catálogo con precios por día.
- Proceso de reserva con selección de fechas.
- Historial de alquileres y descarga de facturas en PDF.

---

## 🛠️ Tecnologías Utilizadas

* **HTML5 & CSS3:** Estructura y estilos con variables personalizadas para temas.
* **JavaScript (ES6+):** Lógica de consumo de API mediante `fetch` y manipulación del DOM.
* **JWT (Local Storage):** Gestión de persistencia de sesión y roles.
* **Integración API:** Comunicación directa con el Backend en Spring Boot.

---

## ⚙️ Instalación y Uso

1. **Clonar el repositorio:**
   bash
   git clone [https://github.com/Duban0110/Herramientas-Frontend.git](https://github.com/Duban0110/Herramientas-Frontend.git)

2. **Configuración de la API:**
Asegúrate de que la URL en la primera línea de tu archivo principal de JavaScript coincida con tu servidor local:

JavaScript
const API_URL = "http://localhost:8081/api";   

3. ***Ejecución:***
Simplemente abre el archivo index.html en tu navegador o utiliza una extensión como Live Server en VS Code para una mejor experiencia

👨‍💻 Autor
Desarrollado por Duban.
