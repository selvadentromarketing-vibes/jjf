# JJF Creando — Sitio

Sitio bilingüe (ES/EN) de JJF Creando en HTML + Tailwind v4, listo para Netlify.

## Estructura

```
index.html              → portada: película de Selvadentro, nosotros, Selvadentro,
                          filosofía, adelanto de proyectos aliados, visión, FAQ, contacto
partner-projects.html   → página de proyectos aliados (todo excepto Selvadentro,
                          incluido el portafolio completo de Mazza Capital)
main.js                 → textos ES/EN, datos de proyectos aliados, FAQ, película del hero,
                          menú móvil y animaciones
booking.js              → asistente de agenda (calendario + formulario)
netlify/functions/      → booking.mjs: conexión de la agenda con GoHighLevel (/api/booking)
src/input.css           → fuente de estilos (Tailwind v4 + componentes)
assets/styles.css       → CSS compilado (lo que carga el navegador)
assets/hero/            → película del hero (mp4 H.264 + webm VP9, escritorio y teléfono) y pósters
assets/img/             → fotografías en WebP, en varios anchos (nombre-ANCHO.webp)
assets/fonts/           → Instrument Serif y Jost, auto-alojadas (licencia OFL)
assets/canopy-shadow.webp → sombra de palmera que se mece sobre las secciones claras (.sunlit)
assets/og/              → tarjetas para compartir (1200×630) de portada y proyectos aliados
assets/logo-mark.png    → logo original recortado; se usa como máscara CSS (toma el color del texto)
robots.txt, sitemap.xml, llms.txt → buscadores y asistentes (dominio jjfcreando.com)
netlify.toml            → config de despliegue (sitio estático, sin build; la función se despliega sola)
```

## Desarrollo

El CSS está **precompilado** en `assets/styles.css`, así que para ver el sitio
basta servir la carpeta con cualquier servidor estático (p. ej. `npx serve .`).

Si editas clases de Tailwind en los `.html` o en `main.js`, recompila el CSS:

```bash
npm install        # solo la primera vez
npm run build      # genera assets/styles.css
# o, mientras editas:
npm run dev        # recompila al guardar (watch)
```

Si cambias `assets/styles.css` o `main.js`, sube el número `?v=` en las etiquetas
`<link>`/`<script>` de ambos HTML (`/assets/*` se cachea un día con revalidación).

## Contenido

- **Textos:** todos los textos visibles viven en el diccionario `I18N` de `main.js`
  (una clave por texto, en `es` y `en`). El HTML trae el texto en español como respaldo.
- **Proyectos aliados:** arreglo `PARTNERS` en `main.js`. Cada proyecto tiene `group`
  (`landmark`, `mazza-communities` o `mazza-hotels`), imagen, textos, datos y sitio web.
  `TEASER` define los cuatro que aparecen en la portada.
- **Imágenes:** para una foto nueva, expórtala a `assets/img/<nombre>-<ancho>.webp`
  y lista los anchos en `widths`.
- **Película del hero (controlada por el scroll):** el hero mide 4 pantallas. En las dos
  primeras el scroll recorre la película en tres capítulos (El plano → La selva → El
  cenote), con textos que suben línea por línea y un indicador 01–03; en la última, la
  sección siguiente sube como un telón sobre el cuadro final. Todo se lee de un único progreso
  suavizado. Los tiempos de cada texto y los inicios de capítulo (`CHAPTERS`) están en
  `initHeroFilm()` de `main.js`. La película combina la toma original del plano (primeros
  82 cuadros) con el render aéreo de Selvadentro y la foto del cenote animados con movimiento
  de cámara (recortes subpíxel con Python/Pillow, codificado con ffmpeg). Los archivos llevan un
  keyframe cada 12 cuadros para que el scrubbing sea fluido; si reemplazas la película,
  conserva `-g 12 -bf 0` y **cambia el sufijo de versión del nombre** (`film-desk-v3.mp4` →
  `-v4`, lo mismo para los pósters): los navegadores guardan `/assets/*` un día y seguirían
  mostrando la película anterior. Con "reducir movimiento", ahorro de datos o pantallas de menos de
  520 px de alto, el hero es una sola pantalla con el póster y no descarga la película.

- **Estilo:** paleta hueso/selva con dos acentos, verde oliva (`--color-olive`) en las
  cursivas y cifras, y terracota de chukum (`--color-clay`) en etiquetas, subrayados y botones
  principales (`.btn-accent`); bloque verde selva profundo (`.bg-forest`). `.u-brush` dibuja un subrayado a mano bajo las cursivas de un
  título; `.sunlit` añade luz cálida y sombra de palmera; `data-count` anima una cifra al
  aparecer; la banda `data-marquee` se desliza y acelera con el scroll.
- **Idioma por URL:** `?lang=en` o `?lang=es` fija el idioma (útil para anuncios en inglés).
- **WhatsApp:** número del equipo en la constante `WHATSAPP` de `main.js`; los enlaces con
  `data-wa` abren el chat con un mensaje listo en el idioma de la página (`wa.text`).

## Notas

- **Agenda (`booking.js` + `netlify/functions/booking.mjs`):** calendario y formulario propios,
  conectados al calendario de GoHighLevel. Todos los botones con `data-cta` lo abren: 01 interés y
  formato (videollamada, llamada o visita en Tulum), 02 día y hora (en la zona horaria del visitante,
  con la hora de Tulum al lado), 03 datos de contacto, 04 revisión, y una pantalla final con
  Google Calendar, archivo .ics y WhatsApp. `data-intent="visit"` preselecciona una visita.
  - **Cómo se conecta:** la función de Netlify (`/api/booking`) habla con la API v2 de GoHighLevel
    con el token guardado en Netlify, nunca en el navegador. Lee los horarios libres del calendario
    y, al confirmar, crea o actualiza el contacto (sin borrar sus etiquetas ni su fuente), crea la
    cita como *confirmada* (corren las automatizaciones del calendario), añade las etiquetas
    `agenda-web`, `interes-…`, `formato-…`, `idioma-…` y una nota con el mensaje y la hora del cliente.
    Si alguien toma el horario un momento antes, el asistente vuelve al calendario con un aviso.
  - **Activarlo:** en GoHighLevel, *Settings → Private Integrations → Create new integration*, con
    los permisos *View Calendars*, *Edit Calendar Events* y *Edit Contacts*; copia el token. En Netlify,
    *Site configuration → Environment variables*, crea `GHL_TOKEN` con ese valor (marcado como secreto
    y para todos los contextos, incluidos los deploy previews) y vuelve a desplegar.
  - **Sin token** el calendario ya muestra la disponibilidad real (la pública del calendario) y cada
    solicitud se guarda como formulario de Netlify `agenda` (activa *Forms → Form detection* para
    verlas). Lo mismo pasa si GoHighLevel falla al agendar: la solicitud no se pierde y el visitante
    ve "Recibimos tu solicitud" en lugar de "Tu cita quedó agendada".
  - **Horarios y duración** se configuran en GoHighLevel (horario, anticipación mínima, días, duración
    de la cita); el sitio solo los refleja. Las visitas usan el mismo calendario y piden 90 minutos
    libres seguidos; para darles su propio calendario (con su ubicación), o uno distinto a la llamada
    o la videollamada, usa `GHL_CALENDAR_ID_VISIT`, `GHL_CALENDAR_ID_PHONE` o `GHL_CALENDAR_ID_VIDEO`.
    Otras opciones (`GHL_CALENDAR_ID`, `GHL_LOCATION_ID`, `GHL_VISIT_MINUTES`) están descritas al
    inicio de la función.
  - En un servidor local sin funciones (`npx serve .`) el asistente usa un horario de oficina de
    ejemplo (`HOURS` en `booking.js`); con `netlify dev` usa la función real.
- Las cifras de Selvadentro (9 cenotes, 65% de selva conservada, 12+ amenidades, 8 min del
  Tren Maya) vienen de selvadentrotulum.com; las de los proyectos aliados, de sus fichas
  originales y de mazzacapital.com.
