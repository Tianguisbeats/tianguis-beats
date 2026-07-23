# Tianguis Studio

Todas las rutas `/studio/*` comparten [`app/studio/layout.tsx`](/Users/mauriciogarces/Documents/Garces%20Studio%20Engine/tianguisbeats/app/studio/layout.tsx): Navbar, barra lateral persistida en `localStorage` (`studio_sidebar_open`), plan, verificación y aviso de beats desactivados por plan. La navegación visual no sustituye el control de autorización de cada página/RLS.

| Ruta | Función | Operaciones/datos principales |
| --- | --- | --- |
| `/studio` | Entrada de compatibilidad. | Redirige a `/studio/beats`. |
| `/studio/beats` | Inventario del productor. | Lista beats propios; publica/oculta y elimina. Comprueba Stripe Connect antes de flujos que lo requieren. |
| `/studio/beats/edit/[id]` | Edición de beat existente. | Comprueba sesión y propiedad; actualiza identidad, archivos, precios y licencias. Un ID ajeno vuelve a Mis Beats. |
| `/upload` | Alta de beat nuevo. | Requiere sesión; valida perfil, límite/plan, licencias y archivos; crea contenido mediante API/Storage. Al terminar vuelve al perfil. |
| `/studio/soundkits` | CRUD de Sound Kits. | Consulta plan y permiso de licencias; crea, actualiza y borra `kits_sonido`. |
| `/studio/licencias` | Configuración por productor de contratos y límites. | Lee/upsert en `licencias` con conflicto por `productor_id`; es la referencia para nuevos beats. |
| `/studio/cupones-ofertas` | Marketing del productor. | CRUD/toggle de `cupones` y `ofertas_volumen`; el acceso depende del nivel del plan. |
| `/studio/premium` | Hub de herramientas/beneficios Premium. | Consulta usuario/plan y presenta acciones permitidas. No usarlo como único guard de funciones premium. |
| `/studio/stats` | Métricas de productor. | Lee perfil, beats, transacciones, seguidores y `analiticas_eventos`. Confirmar que todas las consultas estén limitadas al propietario. |
| `/studio/sales` | Ventas y comprobantes. | Consulta ventas del productor; puede pedir comprobante por `/api/ventas/nota`. |
| `/studio/payments` | Estado/cobro de Stripe Connect. | Usa APIs Connect/balance, no claves de Stripe en el navegador. |
| `/studio/billing` | Suscripción del usuario. | Lee estado y abre portal Stripe o actualiza cancelación mediante API. |
| `/studio/purchases` | Compras del usuario. | Ver [Compra y postventa](compra-y-postventa.md). |
| `/studio/purchases/service/[id]` | Proyecto de servicio comprado. | Verifica usuario autorizado y estado del proyecto. |
| `/studio/cuenta` | Perfil, preferencias, seguridad y eliminación. | Actualiza perfil, solicita reset de contraseña, cierra sesión y puede eliminar perfil. Acción destructiva: confirmar alcance/cascadas antes de tocarla. |
| `/studio/verification` | Solicitud de verificación. | Requiere sesión; muestra requisitos y expediente/fases. Verificar Storage, revisión administrativa y RLS. |
| `/studio/admin` | Panel de administración. | Sólo `perfiles.es_admin`; administra métricas, usuarios, beats, cupones, controles, feedback e ingresos mediante hooks de `hooks/admin/`. |

## Reglas de mantenimiento

- Los límites por plan deben aplicarse en servidor/RLS y no sólo ocultando botones.
- Una edición, borrado, publicación o lectura de finanzas siempre debe filtrar por `productor_id`/usuario autenticado.
- Las operaciones de archivos deben validar tipo, tamaño y bucket con `lib/file-validation.ts`; no subir directamente desde un formulario sin control.
- El panel Admin necesita una auditoría prioritaria: combina mucha lógica, datos financieros y actualmente contribuye al estado de lint no limpio del repositorio.

## Auditoría funcional — 23 de julio de 2026

Se revisó pestaña por pestaña la lógica de cada ruta del Studio. Resultado por pestaña:

| Pestaña | Estado | Notas |
| --- | --- | --- |
| Mis Beats | ✅ Corregida | Faltaba el botón "Subir Beat" en el encabezado (solo existía en el estado vacío). Se agregó. Se eliminó código muerto (`isOnboarded` y una query extra a `perfiles` que no se usaba). |
| Sound Kits | ✅ Corregida | 4 bugs: (1) editar un kit oculto lo republicaba (`es_publico: true` fijo en el payload) — ahora respeta la visibilidad previa; (2) portada de respaldo `/placeholder-kit.jpg` no existía (imagen rota) — ahora muestra un ícono; (3) si la sesión expiraba al guardar, el botón quedaba en "Procesando" — se resetea; (4) eliminar un kit no borraba los archivos del Storage — ahora limpia `archivos_kits_sonido`, `portadas_kits_sonido` y `muestra_soundkit`. |
| Licencias | ✅ Funcional | Validación de variables obligatorias, upsert por `productor_id` y preview PDF vía `/api/studio/license-preview` correctos. |
| Cupones y Ofertas | ✅ Funcional | CRUD completo. Pendiente menor: archivo muy grande (1,398 líneas), candidato a dividirse. |
| Hub Premium | ✅ Funcional | — |
| Estadísticas | ✅ Funcional | `fetchStats` tiene `finally { setLoading(false) }` correcto; gráfico recharts carga con `next/dynamic`. |
| Ventas | ✅ Funcional | Agrupa transacciones por `orden_pedido`; CSV y comprobante vía `/api/ventas/nota` operativos. |
| Pagos | ✅ Corregida | Se eliminó la query a `retiros` cuyo resultado nunca se renderizaba (el historial lo gestiona Stripe Express) y el spinner infinito con sesión expirada. |
| Mis Compras | ✅ Corregida | Se eliminó `handleGeneratePDF` (stub muerto que mostraba "servicio en actualización"; los botones reales usan `handleDownloadLicense`/`handleDownloadFiles`). Fallback de portada `/placeholder.png` no existía — ahora usa `/logo.png`. |
| Mi Suscripción | ✅ Funcional | Portal Stripe y cancelar/reanudar operativos. |
| Mi Cuenta | ✅ Funcional | — |
| Verificación | ✅ Funcional | — |
| Admin | ⚠️ Pendiente | Funcional pero necesita auditoría dedicada (1,882 líneas, lógica financiera concentrada). |

**Fix estructural**: `app/studio/layout.tsx` no verificaba sesión — entrar a `/studio/*` sin login dejaba el dashboard en spinners infinitos (4 pestañas hacían `if (!user) return` sin apagar `loading`). Ahora el layout redirige a `/login` si no hay sesión.

**Deuda conocida (no corregida a propósito)**:
- `app/studio/beats/page.tsx` `handleDelete`: al borrar archivos del Storage usa `path.split('/').pop()`, que fallaría si los archivos se guardan en subcarpetas por usuario. Verificar el layout real del bucket antes de tocar.
- Panel Admin: pendiente de auditoría dedicada.
