# JJF Creando — Landing

Landing bilingüe (ES/EN) de JJF Creando en HTML + Tailwind v4 + JavaScript vanilla, lista para Netlify.

## Estructura

```
index.html          → marcado de la página
main.js             → textos (i18n), proyectos, FAQ, modal y sistema de animación
src/input.css       → fuente de estilos (Tailwind v4 + design system + animaciones)
assets/styles.css   → CSS compilado (lo que carga el navegador)
assets/*.webp|png   → imágenes (logo-trim.webp = logo recortado con transparencia)
netlify.toml        → config de despliegue (sitio estático, sin build)
```

## Desarrollo

El CSS está **precompilado** en `assets/styles.css`, así que para ver la página
basta abrir `index.html` con cualquier servidor estático.

Si editas clases de Tailwind en `index.html` / `main.js`, recompila el CSS:

```bash
npm install        # solo la primera vez
npm run build      # genera assets/styles.css
# o, mientras editas:
npm run dev        # recompila al guardar (watch)
```

> **Importante:** Netlify cachea `/assets/*` como `immutable` durante un año. Cada vez que
> cambie el CSS, sube el número de versión en `index.html`
> (`assets/styles.css?v=2` → `?v=3`) para que los visitantes reciban la versión nueva.

## Diseño y animación

- **Paleta** tomada de las propias imágenes: piedra caliza (`paper`), selva profunda (`jungle`)
  y el verde salvia de los bocetos (`sage` / `moss`). Tokens en `@theme` dentro de `src/input.css`.
- **Tipografía:** Playfair Display (titulares, con acentos en cursiva) + Poppins (texto).
- **Animaciones** (sin librerías, todo en `main.js` + CSS):
  - Intro del hero: la foto se asienta y el titular sube palabra por palabra.
  - Revelados al hacer scroll (`data-reveal="up|fade|clip|arch|stage"`, `data-split` para titulares).
  - Declaración "Nosotros" que se ilumina palabra a palabra con el scroll (`data-scrub`).
  - Parallax por `transform` (`data-parallax="0.16"`), contadores animados (`data-count`).
  - Proyectos: en escritorio, galería fija (sticky) con transición tipo cortina entre imágenes.
  - Header que se oculta al bajar, reaparece al subir y se adapta a secciones oscuras.
  - Menú móvil a pantalla completa, FAQ que anima al abrir y cerrar, modal nativo (`<dialog>`).
- **Accesibilidad:** respeta `prefers-reduced-motion` (todo visible, sin parallax ni marquee),
  el contenido se muestra aunque falle el JS, foco gestionado en menú y modal, skip link.

## Despliegue en Netlify

Sitio estático, **no requiere build** en Netlify (el CSS ya está compilado y commiteado):

- **Opción A (drag & drop):** arrastra la carpeta del proyecto a Netlify.
- **Opción B (Git):** conecta el repo. `netlify.toml` publica la raíz (`publish = "."`).
  `node_modules/` está en `.gitignore` y no se sube.

## Notas

- Todos los botones con `data-cta` (Agenda una llamada, Contáctanos, Saber más, Comienza a
  Construir tu Sueño, Descarga Nuestro CV) abren el modal con el calendario de GoHighLevel
  (`widget/booking/DD1xkh0ObvHQFhcyxgJR`). Cámbialo en `index.html` si usas otro.
- Los textos viven en `I18N`, `projects` y `faqs` dentro de `main.js`; las imágenes en `assets/`.
  Las fichas de cada proyecto (`facts`) solo repiten datos que ya aparecen en su descripción.
