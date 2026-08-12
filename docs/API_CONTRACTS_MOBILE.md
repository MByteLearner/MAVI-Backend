# 📱 Especificación de Contratos API para la Aplicación Móvil (React Native)

Este documento especifica todos los endpoints disponibles en el backend de **MAVI** para la integración con la aplicación móvil en **React Native**. Incluye los encabezados (Headers), datos requeridos de envío (Request Body/Params) y la estructura exacta de las respuestas (Response JSON).

---

## 🌐 Información General de la API

*   **URL Base (Desarrollo Local):** `http://<IP-DE-TU-SERVIDOR>:3000/api`
*   **Formato de Peticiones y Respuestas:** JSON / Multipart Form-Data
*   **Encabezado de Autenticación:** Para todas las rutas protegidas, se debe enviar la cabecera:
    ```http
    Authorization: Bearer <TOKEN_JWT_DEL_USUARIO>
    ```

---

## 🔑 Módulo 1: Autenticación y Perfil de Usuario

### 1. Registro de Usuario
*   **Método:** `POST`
*   **Ruta:** `/auth/register`
*   **Autenticación:** Pública
*   **Headers:** `Content-Type: application/json`
*   **Body Request:**
    ```json
    {
      "email": "usuario@ejemplo.com",
      "password": "contraseña123",
      "name": "Juan Pérez",
      "goals": ["Ganar masa muscular", "Reducir azúcares"],
      "allergies": ["Maní", "Mariscos"]
    }
    ```
*   **Response (201 Created):**
    ```json
    {
      "user": {
        "id": "uuid-del-usuario",
        "email": "usuario@ejemplo.com",
        "name": "Juan Pérez",
        "goals": ["Ganar masa muscular", "Reducir azúcares"],
        "allergies": ["Maní", "Mariscos"],
        "streak": 0,
        "createdAt": "2026-08-12T04:14:14.000Z"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
    ```
*   **Errores Posibles:** `400 Bad Request` (Email/password requeridos, contraseña menor a 6 caracteres o correo ya registrado).

---

### 2. Inicio de Sesión (Login)
*   **Método:** `POST`
*   **Ruta:** `/auth/login`
*   **Autenticación:** Pública
*   **Headers:** `Content-Type: application/json`
*   **Body Request:**
    ```json
    {
      "email": "usuario@ejemplo.com",
      "password": "contraseña123"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "user": {
        "id": "uuid-del-usuario",
        "email": "usuario@ejemplo.com",
        "name": "Juan Pérez",
        "goals": ["Ganar masa muscular", "Reducir azúcares"],
        "allergies": ["Maní", "Mariscos"],
        "streak": 5,
        "createdAt": "2026-08-12T04:14:14.000Z"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
    ```
*   **Errores Posibles:** `401 Unauthorized` (Credenciales inválidas).

---

### 3. Obtener Usuario Autenticado (`Me`)
*   **Método:** `GET`
*   **Ruta:** `/auth/me`
*   **Autenticación:** Requerida (`Bearer Token`)
*   **Response (200 OK):**
    ```json
    {
      "user": {
        "id": "uuid-del-usuario",
        "email": "usuario@ejemplo.com",
        "name": "Juan Pérez",
        "goals": ["Ganar masa muscular", "Reducir azúcares"],
        "allergies": ["Maní", "Mariscos"],
        "streak": 5,
        "createdAt": "2026-08-12T04:14:14.000Z",
        "guideline": {
          "id": "uuid-guia-medica",
          "userId": "uuid-del-usuario",
          "allowedIngredients": ["pollo", "huevo", "arroz", "brócoli"],
          "restrictions": ["azúcar", "sal"]
        }
      }
    }
    ```

---

### 4. Consultar Perfil de Usuario
*   **Método:** `GET`
*   **Ruta:** `/users/profile`
*   **Autenticación:** Requerida (`Bearer Token`)
*   **Response (200 OK):**
    ```json
    {
      "user": {
        "id": "uuid-del-usuario",
        "email": "usuario@ejemplo.com",
        "name": "Juan Pérez",
        "goals": ["Ganar masa muscular", "Reducir azúcares"],
        "allergies": ["Maní", "Mariscos"],
        "streak": 5,
        "createdAt": "2026-08-12T04:14:14.000Z",
        "guideline": {
          "id": "uuid-guia-medica",
          "userId": "uuid-del-usuario",
          "allowedIngredients": ["pollo", "huevo", "arroz", "brócoli"],
          "restrictions": ["azúcar", "sal"]
        }
      }
    }
    ```

---

### 5. Actualizar Perfil de Usuario
*   **Método:** `PUT`
*   **Ruta:** `/users/profile`
*   **Autenticación:** Requerida (`Bearer Token`)
*   **Headers:** `Content-Type: application/json`
*   **Body Request:** *(Se envían solo los campos a modificar)*
    ```json
    {
      "name": "Juan Carlos Pérez",
      "goals": ["Perder peso", "Aumentar proteína"],
      "allergies": ["Lactosa", "Maní"]
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "message": "Perfil actualizado exitosamente",
      "user": {
        "id": "uuid-del-usuario",
        "email": "usuario@ejemplo.com",
        "name": "Juan Carlos Pérez",
        "goals": ["Perder peso", "Aumentar proteína"],
        "allergies": ["Lactosa", "Maní"],
        "streak": 5,
        "createdAt": "2026-08-12T04:14:14.000Z",
        "guideline": { ... }
      }
    }
    ```

---

## 🥗 Módulo 2: Directrices Médicas / Dietas

### 1. Subir Documento/Plan Médico (PDF o Imagen)
*   **Método:** `POST`
*   **Ruta:** `/diets/upload`
*   **Autenticación:** Requerida (`Bearer Token`)
*   **Headers:** `Content-Type: multipart/form-data`
*   **Body Request (Form Data):**
    *   `file`: *(Archivo binario - PDF, PNG, JPEG o WebP)*
*   **Response (201 Created):**
    ```json
    {
      "id": "uuid-guia-medica",
      "userId": "uuid-del-usuario",
      "allowedIngredients": ["pollo", "huevo", "arroz", "brócoli", "plátano"],
      "restrictions": ["azúcar", "sal"]
    }
    ```
*   **Errores Posibles:** `400 Bad Request` (Archivo requerido), `415 Unsupported Media Type` (Formato no permitido).

---

## 📖 Módulo 3: Recetas Dinámicas

### 1. Obtener Recetas Sugeridas para el Usuario
*   **Método:** `GET`
*   **Ruta:** `/recipes`
*   **Autenticación:** Requerida (`Bearer Token`)
*   **Descripción:** Retorna las recetas cuyos ingredientes coinciden exactamente con la guía médica activa del usuario autenticado.
*   **Response (200 OK):**
    ```json
    [
      {
        "id": "uuid-receta-1",
        "name": "Pollo al horno con brócoli y arroz",
        "ingredients": ["pollo", "brócoli", "arroz"],
        "base_calories": 450
      },
      {
        "id": "uuid-receta-2",
        "name": "Huevos revueltos con plátano",
        "ingredients": ["huevo", "plátano"],
        "base_calories": 320
      }
    ]
    ```

---

## 📸 Módulo 4: Gamificación y Diario de Comidas

### 1. Validar Foto del Plato Cocinado
*   **Método:** `POST`
*   **Ruta:** `/meals/validate`
*   **Autenticación:** Requerida (`Bearer Token`)
*   **Headers:** `Content-Type: multipart/form-data`
*   **Body Request (Form Data):**
    *   `file`: *(Archivo de imagen - JPEG, PNG o WebP de la foto tomada con la cámara)*
    *   `recipeId`: `"uuid-receta-seleccionada"`
*   **Response Éxito (201 Created - Plato Válido):**
    ```json
    {
      "is_valid": true,
      "meal_log": {
        "id": "uuid-log-comida",
        "userId": "uuid-del-usuario",
        "recipeId": "uuid-receta-seleccionada",
        "photoUrl": "/uploads/a1b2c3d4-e5f6.jpg",
        "isValid": true,
        "createdAt": "2026-08-12T04:20:00.000Z"
      },
      "streak": 6
    }
    ```
*   **Response Fallo de Validación (422 Unprocessable Entity - Plato No Coincide):**
    ```json
    {
      "is_valid": false,
      "message": "El plato no corresponde a la receta. Intenta de nuevo."
    }
    ```

---

## ⚡ Códigos de Estado HTTP Utilizados

| Código | Significado | Descripción |
| :--- | :--- | :--- |
| **`200 OK`** | Petición Exitosa | Respuesta correcta con datos en JSON. |
| **`201 Created`** | Recurso Creado | Registro, subida de archivos o creación de logs exitosa. |
| **`400 Bad Request`** | Petición Inválida | Datos faltantes o formato incorrecto en la solicitud. |
| **`401 Unauthorized`** | No Autorizado | Token JWT no enviado, expirado o credenciales de login incorrectas. |
| **`404 Not Found`** | No Encontrado | Usuario, receta o recurso no existente. |
| **`415 Unsupported Media Type`** | Archivo No Permitido | Formato de archivo distinto a PDF, PNG, JPG o WebP. |
| **`422 Unprocessable Entity`** | Error de Validación | El plato fotografiado no cumple las reglas de la receta. |
| **`500 Internal Server Error`** | Error de Servidor | Fallo interno en la base de datos o servidor. |
| **`502 Bad Gateway`** | Servicio Inaccesible | Fallo en la comunicación con el microservicio de IA. |
