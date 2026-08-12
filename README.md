# MAVI Backend - Nutrición y Asistencia Alimentaria con IA

**MAVI** (**M**edicación/Nutrición **A**sistida por **V**isión e **I**nteligencia Artificial) es una plataforma backend para asistencia alimentaria y nutricional adaptada a planes médicos. 

Permite procesar planes dietéticos médicos (extraer reglas e ingredientes permitidos/restringidos), recomendar recetas acordes a las restricciones médicas del usuario y validar mediante visión por computadora si el plato cocinado corresponde a la receta sugerida.

---

## 🏗 Arquitectura del Sistema

El sistema está diseñado en una arquitectura de microservicios:

*   **`core-api`** (Puerto `3000`): API REST construida con **Node.js, Express, TypeScript y Prisma ORM**. Gestiona la lógica de negocio, usuarios, autenticación JWT, registro de comidas y consulta de recetas.
*   **`ai-service`** (Puerto `8000`): Microservicio en **Python con FastAPI**. Simula o procesa las capacidades de IA (OCR y procesamiento de lenguaje para extracción de reglas dietéticas, y visión por computadora para validación de platos).
*   **`db`** (Puerto `5432`): Base de datos relacional **PostgreSQL 16**.

---

## 📋 Requisitos Previos

Asegúrate de tener instalado en tu sistema:
- [Docker](https://docs.docker.com/get-docker/) y [Docker Compose](https://docs.docker.com/compose/install/) (Recomendado).
- Alternativamente para desarrollo local sin Docker:
  - **Node.js** (v18 o superior) y **npm**
  - **Python** (v3.10 o superior)
  - **PostgreSQL** (v16 o superior)

---

## ⚙️ Configuración de Variables de Entorno

Antes de iniciar el proyecto, crea el archivo `.env` en la raíz copiando el archivo de ejemplo:

```bash
cp .env.example .env
```

Contenido del archivo `.env`:

```env
# PostgreSQL
POSTGRES_USER=mavi
POSTGRES_PASSWORD=mavi_secret
POSTGRES_DB=mavi

# Core API
DATABASE_URL=postgresql://mavi:mavi_secret@db:5432/mavi
AI_SERVICE_URL=http://ai-service:8000
PORT=3000
UPLOADS_DIR=uploads

# Seguridad JWT
JWT_SECRET=mavi_super_secret_key_change_in_production
JWT_EXPIRES_IN=7d
```

> **Nota:** Si vas a ejecutar `core-api` localmente fuera de Docker, cambia en la variable `DATABASE_URL` el host `db` por `localhost`, y en `AI_SERVICE_URL` cambia `ai-service` por `localhost`.

---

## 🚀 Cómo Levantar el Proyecto

### Opción 1: Con Docker Compose (Recomendado)

1. **Construir y levantar todos los contenedores:**
   ```bash
   docker compose up --build -d
   ```

2. **Aplicar las migraciones/esquema a la Base de Datos:**
   ```bash
   docker compose exec core-api npx prisma db push
   ```

3. **Verificar el estado de los servicios:**
   - **Core API Health:** [http://localhost:3000/health](http://localhost:3000/health)
   - **AI Service Health:** [http://localhost:8000/health](http://localhost:8000/health)
   - **Documentación Interactiva Swagger (AI Service):** [http://localhost:8000/docs](http://localhost:8000/docs)

4. **Para detener los contenedores:**
   ```bash
   docker compose down
   ```

---

### Opción 2: Desarrollo Local (sin Docker para los servicios)

Si prefieres ejecutar los servicios individualmente en tu máquina local:

#### 1. Iniciar Base de Datos PostgreSQL
Puedes usar Docker solo para PostgreSQL:
```bash
docker run -d --name mavi-db -e POSTGRES_USER=mavi -e POSTGRES_PASSWORD=mavi_secret -e POSTGRES_DB=mavi -p 5432:5432 postgres:16-alpine
```

#### 2. Iniciar `ai-service` (Python / FastAPI)
```bash
cd ai-service
python3 -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

#### 3. Iniciar `core-api` (Node.js / Express)
```bash
cd core-api
npm install
npx prisma db push
npm run dev
```

---

## 📌 Documentación de Endpoints (`/api`)

Todas las rutas protegidas requieren la cabecera HTTP:
`Authorization: Bearer <TU_TOKEN_JWT>`

### 🔑 Autenticación (`/api/auth`)

*   **Registro de Usuario:** `POST /api/auth/register`
    *   **Body (JSON):**
        ```json
        {
          "email": "usuario@ejemplo.com",
          "password": "mi_contraseña_segura"
        }
        ```
    *   **Respuesta (201 Created):** Retorna el objeto `user` y el `token` JWT.

*   **Inicio de Sesión:** `POST /api/auth/login`
    *   **Body (JSON):**
        ```json
        {
          "email": "usuario@ejemplo.com",
          "password": "mi_contraseña_segura"
        }
        ```
    *   **Respuesta (200 OK):** Retorna el objeto `user` y el `token` JWT.

*   **Perfil del Usuario:** `GET /api/auth/me` *(Protegida)*
    *   **Header:** `Authorization: Bearer <token>`
    *   **Respuesta (200 OK):** Información del usuario autenticado y su guía médica asignada.

### 👤 Perfil de Usuario (`/api/users/profile`)

*   **Consultar Perfil:** `GET /api/users/profile` *(Protegida)*
    *   **Header:** `Authorization: Bearer <token>`
    *   **Respuesta (200 OK):** Devuelve `id`, `email`, `name`, `goals`, `allergies`, `streak`, `createdAt` y `guideline`.

*   **Actualizar Perfil:** `PUT /api/users/profile` *(Protegida)*
    *   **Header:** `Authorization: Bearer <token>`
    *   **Body (JSON):**
        ```json
        {
          "name": "Juan Pérez",
          "goals": ["Ganar masa muscular", "Reducir azúcares"],
          "allergies": ["Maní", "Mariscos"]
        }
        ```
    *   **Respuesta (200 OK):** Retorna el mensaje de éxito y el perfil actualizado.

---

### 🥗 Guía Médica y Dietas (`/api/diets`)

*   **Subir Plan Médico:** `POST /api/diets/upload` *(Protegida)*
    *   **Header:** `Authorization: Bearer <token>`
    *   **Form-Data:** `file` (Archivo PDF, PNG, JPEG o WebP del plan médico)
    *   **Respuesta (201 Created):** Retorna la guía médica persistida con `allowedIngredients` y `restrictions`.

---

### 📖 Recetas (`/api/recipes`)

*   **Obtener Recetas Sugeridas:** `GET /api/recipes` *(Protegida)*
    *   **Header:** `Authorization: Bearer <token>`
    *   **Respuesta (200 OK):** Lista de recetas cuyos ingredientes cumplen con la pauta médica del usuario.

---

### 📸 Validación de Comidas (`/api/meals`)

*   **Validar Plato Cocinado:** `POST /api/meals/validate` *(Protegida)*
    *   **Header:** `Authorization: Bearer <token>`
    *   **Form-Data:**
        *   `file`: Foto del plato cocinado (imagen).
        *   `recipeId`: ID de la receta seleccionada.
    *   **Respuesta (201 Created):** Retorna `is_valid: true`, la entrada en `meal_log` y el contador actualizado de racha (`streak`).

---

## 🛠 Tecnologías Utilizadas

- **Backend Node.js:** Node.js, Express, TypeScript, Prisma ORM, JSON Web Tokens (JWT), bcryptjs, Multer, Axios.
- **Microservicio de IA:** Python, FastAPI, Uvicorn, Pydantic.
- **Base de Datos:** PostgreSQL 16.
- **Orquestación:** Docker y Docker Compose.
