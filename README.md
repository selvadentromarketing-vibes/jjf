# JJF Creando — Sitio

Sitio bilingüe (ES/EN) de JJF Creando en HTML + Tailwind v4, listo para Netlify.

## Estructura

```
index.html              → portada: película de Selvadentro, nosotros, Selvadentro,
                          filosofía, adelanto de proyectos aliados, visión, FAQ, contacto
partner-projects.html   → página de proyectos aliados (todo excepto Selvadentro,
                          incluido el portafolio completo de Mazza Capital)
main.js                 → textos ES/EN, datos de proyectos aliados, FAQ, película del hero,
                          menú móvil, animaciones y modal de contacto
src/input.css           → fuente de estilos (Tailwind v4 + componentes)
assets/styles.css       → CSS compilado (lo que carga el navegador)
assets/hero/            → película del hero (mp4 H.264 + webm VP9, escritorio y teléfono) y pósters
assets/img/             → fotografías en WebP, en varios anchos (nombre-ANCHO.webp)
assets/fonts/           → Instrument Serif y Jost, auto-alojadas (licencia OFL)
assets/canopy-shadow.webp → sombra de palmera que se mece sobre las secciones claras (.sunlit)
assets/og/              → tarjetas para compartir (1200×630) de portada y proyectos aliados
assets/logo-mark.png    → logo original recortado; se usa como máscara CSS (toma el color del texto)
robots.txt, sitemap.xml, llms.txt → buscadores y asistentes (dominio jjfcreando.com)
netlify.toml            → config de despliegue (sitio estático, sin build)
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

- **Agenda (`booking.js`):** todos los botones con `data-cta` abren un asistente propio en lugar
  del calendario de GoHighLevel: 01 interés y formato (videollamada, llamada o visita en Tulum),
  02 día y hora (calendario en la zona horaria del visitante, con la hora de Tulum al lado),
  03 datos de contacto, 04 revisión, y una pantalla final con Google Calendar, archivo .ics y
  WhatsApp. `data-intent="visit"` preselecciona una visita.
  - **Todavía no está conectado al calendario.** La disponibilidad es de demostración: horario
    de oficina en Tulum (L–V 9:00–18:00, S 9:00–13:00; visitas 9, 11 y 13 h) menos un patrón
    fijo de horarios ocupados. Las solicitudes se envían como formulario de Netlify llamado
    `agenda` (activa *Forms → Form detection* en Netlify para verlas) y la pantalla final ofrece
    confirmar por WhatsApp, así que ninguna se pierde mientras tanto.
  - **Para conectarlo:** crear una función de Netlify (p. ej. `netlify/functions/booking.mjs`)
    con el token de GoHighLevel en una variable de entorno (nunca en el navegador) que responda
    `GET ?action=slots&format=&start=&end=` con `{ slots: [epochMs…] }` (a partir de los
    horarios libres del calendario `DD1xkh0ObvHQFhcyxgJR`) y `POST {action:"book", …}`
    creando o actualizando el contacto y la cita; después, poner su ruta en
    `BOOKING.endpoint` dentro de `booking.js`. El resto del asistente no cambia.
- Las cifras de Selvadentro (9 cenotes, 65% de selva conservada, 12+ amenidades, 8 min del
  Tren Maya) vienen de selvadentrotulum.com; las de los proyectos aliados, de sus fichas
  originales y de mazzacapital.com.
