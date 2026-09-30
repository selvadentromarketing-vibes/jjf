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
assets/fonts/           → Cormorant Garamond y Jost, auto-alojadas (licencia OFL)
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
  horizonte), con textos que suben línea por línea y un indicador 01–03; en la última, la
  sección siguiente sube como un telón sobre el cuadro final. Todo se lee de un único progreso
  suavizado. Los tiempos de cada texto y los inicios de capítulo (`CHAPTERS`) están en
  `initHeroFilm()` de `main.js`. Los archivos llevan un keyframe cada 6 cuadros para que el
  scrubbing sea fluido; si reemplazas la película, conserva `-g 6 -bf 0` y corta antes de
  cualquier disolvencia. Con "reducir movimiento", ahorro de datos o pantallas de menos de
  520 px de alto, el hero es una sola pantalla con el póster y no descarga la película.

## Notas

- Los botones con `data-cta` (Agenda una llamada, Descarga nuestro CV…) abren un modal con
  el calendario de GoHighLevel (`widget/booking/DD1xkh0ObvHQFhcyxgJR`). Cámbialo en el
  `<iframe id="booking-frame">` de ambos HTML si usas otro.
- Las cifras de Selvadentro (9 cenotes, 65% de selva conservada, 12+ amenidades, 8 min del
  Tren Maya) vienen de selvadentrotulum.com; las de los proyectos aliados, de sus fichas
  originales y de mazzacapital.com.
