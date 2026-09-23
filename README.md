# JJF Creando — Landing

Landing bilingüe (ES/EN) de JJF Creando en HTML + Tailwind v4 + JavaScript vanilla, lista para Netlify.

## Estructura

```
index.html            → marcado de la página (incluye proyectos y FAQ pre-renderizados en español)
content.js            → TODOS los textos (ES/EN), datos de proyectos y FAQ, y su marcado
main.js               → idioma, animaciones, menú, modal, FAQ (sin librerías)
src/input.css         → fuente de estilos (Tailwind v4 + design system + animaciones)
assets/styles.css     → CSS compilado (lo que carga el navegador)
assets/fonts/         → Playfair Display + Poppins autoalojadas (subset latino, licencia SIL OFL)
assets/*.webp|jpg     → imágenes (og-image.jpg = imagen para compartir en redes)
scripts/prerender.mjs → escribe en index.html los proyectos y FAQ (ES) desde content.js
favicon.ico, favicon-48.png, apple-touch-icon.png → iconos del sitio
netlify.toml          → config de despliegue (sitio estático, sin build en Netlify)
```

## Desarrollo

Todo está **precompilado y commiteado**, así que para ver la página basta abrir `index.html`
con cualquier servidor estático (`npx serve .`).

Después de editar textos (`content.js`) o clases de Tailwind, regenera:

```bash
npm install        # solo la primera vez
npm run build      # pre-renderiza proyectos/FAQ en index.html + compila assets/styles.css
npm run dev        # recompila solo el CSS al guardar (watch)
```

> **Importante:** cada vez que cambie el CSS, sube la versión en `index.html`
> (`assets/styles.css?v=3` → `?v=4`) para que los visitantes reciban la nueva versión.

## Idiomas

- `/` siempre muestra **español** (es lo que indexa Google). La versión en inglés vive en
  **`/?lang=en`**, así que puedes usar esa URL en anuncios o enlaces para público angloparlante.
- La elección del visitante (botones ES/EN) se recuerda en su navegador.
- A quien tiene el navegador en inglés y llega por primera vez se le muestra un aviso
  discreto "View in English" junto al selector, en vez de cambiar el idioma solo.

## Diseño y animación

- **Paleta** tomada de las propias imágenes: piedra caliza (`paper`), selva profunda (`jungle`)
  y el verde salvia de los bocetos (`sage` / `moss`). Tokens en `@theme` dentro de `src/input.css`.
- **Tipografía:** Playfair Display (titulares, con acentos en cursiva) + Poppins (texto).
- **Animaciones** (sin librerías, todo en `main.js` + CSS):
  - Intro del hero: la foto se asienta y el titular sube palabra por palabra.
  - Revelados al hacer scroll (`data-reveal="up|fade|clip|arch|stage"`, `data-split` para titulares).
  - Declaración "Nosotros" que se ilumina palabra a palabra con el scroll (`data-scrub`).
  - Parallax por `transform` (`data-parallax="0.16"`), contadores animados (`data-count`),
    marquee de proyectos que avanza con el scroll.
  - Proyectos: en escritorio, galería fija (sticky) con transición tipo cortina entre imágenes.
  - Header que se oculta al bajar, reaparece al subir y se adapta a secciones oscuras.
  - Menú móvil a pantalla completa, FAQ que anima al abrir y cerrar, modal nativo (`<dialog>`).
- **Accesibilidad:** respeta `prefers-reduced-motion`, el contenido se muestra aunque falle el JS,
  foco gestionado en menú, modal y enlaces internos, contraste AA, skip link.
- Los bocetos (`sketch-*-stone.webp`) están compuestos sobre el color `--color-stone` de los arcos;
  si cambias ese color, vuelve a exportarlos.

## Despliegue en Netlify

Sitio estático, **no requiere build** en Netlify (todo está compilado y commiteado):

- **Opción A (drag & drop):** arrastra la carpeta del proyecto a Netlify.
- **Opción B (Git):** conecta el repo. `netlify.toml` publica la raíz (`publish = "."`).
  `node_modules/` está en `.gitignore` y no se sube.

## Pendiente cuando haya dominio definitivo

Estas etiquetas necesitan URLs absolutas (sustituye `DOMINIO`):

```html
<link rel="canonical" href="https://DOMINIO/" />
<link rel="alternate" hreflang="es" href="https://DOMINIO/" />
<link rel="alternate" hreflang="en" href="https://DOMINIO/?lang=en" />
<link rel="alternate" hreflang="x-default" href="https://DOMINIO/" />
<meta property="og:url" content="https://DOMINIO/" />
<meta property="og:image" content="https://DOMINIO/assets/og-image.jpg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />  <!-- reemplaza el "summary" actual -->
```

Además: `robots.txt` y `sitemap.xml` en la raíz, y marcar el dominio como principal en Netlify.

## Notas

- Todos los botones con `data-cta` (Agenda una llamada, Contáctanos, Saber más, Comienza a
  Construir tu Sueño, Descarga Nuestro CV) abren el modal con el calendario de GoHighLevel
  (`widget/booking/DD1xkh0ObvHQFhcyxgJR`). Cámbialo en `index.html` si usas otro.
- Las fichas de cada proyecto (`facts` en `content.js`) solo repiten datos que ya aparecen en su
  descripción.
