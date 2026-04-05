# 🏗️ Arquitectura de TianguisBeats

¡Hola Mauricio! Aquí tienes un resumen de cómo está construido tu "Tianguis Digital" para que entiendas cada pieza del motor.

## 🚀 Tecnologías Principales
- **Next.js 16**: El marco de trabajo que une todo. Es rápido, seguro y perfecto para que Google encuentre tus beats (SEO).
- **Supabase**: Tu "Cofre del Tesoro". Aquí vive la Base de Datos (usuarios y beats), la Autenticación y el Almacenamiento (tus archivos MP3/WAV y fotos).
- **Tailwind CSS**: El sistema de diseño que nos permite crear una estética única y profesional sin depender de plantillas genéricas.

## 📂 Organización de Carpetas
- `app/`: Aquí viven tus páginas. Cada carpeta (como `/beats` o `/profile`) se convierte automáticamente en una dirección de tu sitio.
- `components/`: Son los "bloques de construcción". Creamos una pieza una sola vez (como la tarjeta del beat) y la usamos en todo el sitio.
- `context/`: Es la "Memoria Global". Aquí vive el reproductor de audio para que la música no se corte al navegar.
- `lib/`: Contiene la configuración de Supabase, el puente entre tu código y tus datos.

## 🛠️ Flujo de un Beat
1. **Subida**: Desde el `Dashboard`, el archivo viaja a Supabase Storage.
2. **Registro**: Se crea una fila en la tabla `beats` con su BPM, género y precio.
3. **Escucha**: El reproductor global en el `layout.tsx` capta el archivo MP3 y lo reproduce sin importar en qué página estés.

---
*Este documento es para tu referencia técnica. ¡El Tianguis está optimizado y listo para escalar!*
