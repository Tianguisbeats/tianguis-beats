# Configuración Suprema de Correos en Supabase

Para que toda la experiencia de usuario en Tianguis Beats sea profesional y esté en español, configura cada pestaña de **Email Templates** con los archivos que acabo de crear para ti:

## 1. Configurar cada Plantilla
En **Authentication** > **Email Templates**, entra en cada opción y pega el código correspondiente:

| Pestaña en Supabase | Asunto Sugerido (Subject) | Archivo con el Código HTML |
| :--- | :--- | :--- |
| **Confirm signup** | `Verifica tu cuenta de Tianguis Beats 🎶` | `plantilla_correo_verificacion.html` |
| **Reset password** | `Restablecer tu contraseña de Tianguis Beats` | `plantilla_restablecer_password.html` |
| **Magic link** | `Tu enlace de acceso a Tianguis Beats` | `plantilla_magic_link.html` |
| **Change email** | `Confirma tu nuevo correo en Tianguis Beats` | `plantilla_cambio_email.html` |

> [!IMPORTANT]
> **Pasos para cada una:**
> 1. Abre el archivo `.html` aquí en tu editor.
> 2. Copia todo el código.
> 3. En Supabase, borra el contenido actual del cuadro **Message** y pega el código.
> 4. Haz clic en **Save**.

## 2. Configurar la Seguridad (Security)
Ve a la sección **Security** (al final del menú de Auth o debajo de las plantillas) y activa estos interruptores para proteger a tus usuarios:

*   **Password changed**: Actívalo. (Supabase enviará un aviso automático si alguien cambia la contraseña).
*   **Email address changed**: Actívalo. (Avisa si el correo principal ha sido modificado).

## 3. Configuración de URLs (Muy Importante)
Ve a **URL Configuration**:
1.  **Site URL**: `http://localhost:3000` (o tu dominio de producción).
2.  **Redirect URLs**: Añade `http://localhost:3000/**` para que después de verificar el correo, el usuario siempre regrese a tu app correctamente.

### ¿Por qué hacer esto?
Esto garantiza que si el usuario olvida su contraseña o quiere cambiar su correo, reciba instrucciones claras, hermosas y en el idioma correcto, manteniendo la confianza en Tianguis Beats. 🚀
