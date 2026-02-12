# 🛠️ Plataforma de Renta de Herramientas (Backend)

Sitema integral para la gestión de alquiler de herramientas, permitiendo la interacción entre **Administradores**, **Proveedores** y **Clientes**. Este repositorio contiene la lógica de negocio, seguridad JWT y persistencia de datos.

🔗 **Repositorio del Frontend:** [Herramientas-Frontend](https://github.com/Duban0110/Herramientas-Frontend.git)

---

## 🚀 Características Principales

* **Autenticación Robusta:** Seguridad basada en **Spring Security** y **JWT** (JSON Web Tokens).
* **Gestión de Roles:**
    * **Admin:** Dashboard de ingresos y reportes de popularidad.
    * **Proveedor:** Publicación de herramientas con stock e imágenes dinámicas.
    * **Cliente:** Catálogo interactivo, sistema de reservas y generación de facturas.
* **Generación de Documentos:** Creación automática de facturas en formato **PDF** para cada alquiler.
* **Base de Datos Normalizada:** Estructura en MySQL con integridad referencial e índices optimizados.

---

## 🛠️ Stack Tecnológico

* **Lenguaje:** Java 17+
* **Framework:** Spring Boot 3.x
* **Seguridad:** Spring Security, JWT
* **Persistencia:** Spring Data JPA, Hibernate
* **Base de Datos:** MySQL 8.0
* **Documentación API:** Swagger / OpenAPI

---

## 📂 Estructura de la Base de Datos

El proyecto utiliza una base de datos MySQL llamada `renta_herramientas`. Las tablas principales son:

1.  **usuarios:** Centraliza credenciales y roles.
2.  **herramientas:** Almacena el catálogo vinculado a cada proveedor.
3.  **reservas:** Gestiona el flujo de alquiler (fechas, estados y montos).
4.  **pagos:** Registro de transacciones vinculadas a las reservas.



---

## ⚙️ Configuración e Instalación

### 1. Requisitos
* JDK 17 o superior.
* Maven 3.6+.
* Instancia de MySQL corriendo.

### 2. Configuración de la Base de Datos
Crea la base de datos y las tablas utilizando el script SQL incluido en la carpeta `/scripts` (o los proporcionados en la documentación del proyecto). Asegúrate de configurar tus credenciales en el archivo `src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/renta_herramientas
spring.datasource.username=TU_USUARIO
spring.datasource.password=TU_CONTRASEÑA
spring.jpa.hibernate.ddl-auto=update
