# JJF Creando — Landing

Réplica en código (HTML + Tailwind v4) de la landing de JJF Creando, lista para Netlify.

## Estructura

```
index.html          → marcado de la página
main.js             → datos de proyectos, FAQ y modal de contacto
src/input.css       → fuente de estilos (Tailwind v4 + componentes)
assets/styles.css   → CSS compilado (lo que carga el navegador)
assets/*.webp|png   → imágenes
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

## Despliegue en Netlify

Sitio estático, **no requiere build** en Netlify (el CSS ya está compilado y commiteado):

- **Opción A (drag & drop):** arrastra la carpeta del proyecto a Netlify.
- **Opción B (Git):** conecta el repo. `netlify.toml` publica la raíz (`publish = "."`).
  `node_modules/` está en `.gitignore` y no se sube.

## Notas

- Los botones (Schedule A Call, Contact Us, Start Building Your Dream, Download Our CV)
  abren un modal con el calendario de GoHighLevel
  (`widget/booking/cAlZ9dbVjb2L8Ynt8I8w`). Cámbialo en `index.html` si usas otro.
- Imágenes y textos provienen de la página original; reemplázalos en `assets/` y `main.js`.
