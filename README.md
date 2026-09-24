# JJF Creando — Landing

Landing bilingüe (ES/EN) de JJF Creando en HTML + Tailwind v4 + JavaScript vanilla, lista para Netlify.

## Estructura

```
index.html            → marcado de la página (incluye proyectos y FAQ pre-renderizados en español)
content.js            → TODOS los textos (ES/EN), datos de proyectos y FAQ, y su marcado
main.js               → idioma, animaciones, menú, modal, FAQ (sin librerías)
src/input.css         → fuente de estilos (Tailwind v4 + design system + animaciones)
assets/styles.css     → CSS compilado (lo que carga el navegador)
assets/fonts/         → Fraunces + Manrope autoalojadas (subset latino, licencia SIL OFL)
assets/*.webp|jpg     → imágenes (og-image.jpg = imagen para compartir en redes)
assets/glow/          → miniaturas difuminadas para la luz ambiental detrás de cada proyecto
assets/canopy-shadow.webp → sombra de palmeras que cae sobre las secciones claras y los arcos
scripts/prerender.mjs → escribe en index.html los proyectos y FAQ (ES) desde content.js
scripts/images.py     → regenera los bocetos compuestos y las miniaturas de luz (Python + Pillow)
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
> (`assets/styles.css?v=6` → `?v=7`) para que los visitantes reciban la nueva versión.

## Idiomas

- `/` siempre muestra **español** (es lo que indexa Google). La versión en inglés vive en
  **`/?lang=en`**, así que puedes usar esa URL en anuncios o enlaces para público angloparlante.
- La elección del visitante (botones ES/EN) se recuerda en su navegador.
- A quien tiene el navegador en inglés y llega por primera vez se le muestra un aviso
  discreto "View in English" junto al selector, en vez de cambiar el idioma solo.

## Diseño y animación

- **Paleta** tomada de la fotografía: yeso de chukum al sol (`paper`, `stone`), selva profunda
  (`jungle`) y turquesa de cenote como acento (`cenote` sobre fondos oscuros, `cenote-deep` sobre
  claros, con contraste AA). Tokens en `@theme` dentro de `src/input.css`.
- **Tipografía:** Fraunces (titulares; serif suave con tamaño óptico, acentos en cursiva) + Manrope (texto).
- **Fotos** con etalonaje propio (contraste, calidez, menos bruma). Si se agregan fotos nuevas conviene
  darles un tratamiento parecido para que no se vean apagadas junto a las demás.
- **Atmósfera:** luz dorada sobre el hero y el cierre, sombras de palmera que se mecen sobre las
  secciones claras (`.sunlit`) y los arcos, y un brillo ambiental del color de cada foto de proyecto.
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
  si cambias ese color, regenéralos con `python3 scripts/images.py sketches "#nuevo-color"`.
- Proyecto nuevo: `glow` en `content.js` es opcional (sin él se usa la propia foto); para crear la
  miniatura: `python3 scripts/images.py glow assets/foto.webp`.

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
  (`widget/booking/DD1xkh0ObvHQFhcyxgJR`). Sin JS (o con Ctrl/Cmd+clic) abren esa misma página
  en otra pestaña. Si cambias de calendario, reemplaza la URL en `index.html` (búscala) y en
  `BOOKING_URL` de `content.js`, y ejecuta `npm run build`.
- Las fichas de cada proyecto (`facts` en `content.js`) solo repiten datos que ya aparecen en su
  descripción.
