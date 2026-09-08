# JJF Creando — sitio

Sitio bilingüe (`/es/` + `/en/`) de JJF Creando, construido con Astro 7 y desplegado en Netlify. El plan de diseño y producto vive en la conversación de trabajo; este README cubre lo operativo.

## Estructura

```
astro.config.mjs        i18n, sitemap, Tailwind 4, fuentes autoalojadas (Instrument Serif + Instrument Sans)
src/content.config.ts   colecciones: projects (es/en), site (textos de marca), how (cómo se compra), legal (aviso)
src/content/            el contenido — cada cifra es un objeto {value, verified, source, asOf}; sin verificar no se renderiza
src/layouts/Base.astro  head (canonical, hreflang, OG, JSON-LD), la puerta, nav, footer, marcador de estratos
src/components/         Hero · Claro · Index · Agua · Ledger · Doors · ContactForm · Booking · Silence · Plano · Ficha · Door · Mark
src/views/              una vista por tipo de página; src/pages/{es,en}/ son envoltorios finos con las rutas localizadas
src/scripts/            door (la marca), reveal, ground (color-as-weather), solar (hora de Tulum), tier, plano, contact, analytics, vitals
src/styles/global.css   tokens de color, duración y easing (plan §5–§6)
src/assets/brand/       jjf-mark.svg (trazado desde logo.png con scripts/trace-mark.mjs — sustituir por el vector del diseñador cuando llegue)
src/assets/plans/       los planos para El Plano, uno por proyecto (ver README ahí)
netlify/                edge function de idioma, noindex en previews, functions/lead.mjs (el embudo) y leads.mjs (leerlo)
tests/                  Playwright: hreflang recíproco, sin cifras fuera de lugar, la puerta una vez por sesión, sin overflow, tier in-app
legacy/                 la landing anterior (HTML + Tailwind), sólo como referencia de contenido
```

## Desarrollo

```bash
npm install
cp .env.example .env      # PUBLIC_STAGING=1 muestra las placas provisionales
npm run dev               # http://localhost:4321/es/
npm run build && npm run preview
npm run check             # astro check
npm run check:plans       # valida los SVG de planos
CHROMIUM_PATH=/ruta/a/chromium npm test   # Playwright (sin la variable usa su propio Chromium)
```

## Despliegue

Netlify construye con `npm run build` y publica `dist/`. Variables en Netlify: las de `.env.example`. Sin `PUBLIC_STAGING` el hero de la portada no lleva placa (nada provisional llega a producción); las imágenes marcadas `heroStaging: true` tampoco.

La edge function `locale` manda toda ruta sin prefijo a `/es/` o `/en/` (idioma del navegador, luego país) conservando UTMs. Los deploy previews llevan `X-Robots-Tag: noindex`.

## El embudo

El formulario hace POST a `/api/lead` (`netlify/functions/lead.mjs`). No usa Netlify Forms: esa
ruta dependía de un interruptor del panel que estaba apagado, así que cada consulta devolvía 404 y
se perdía.

Orden de operaciones: la consulta se guarda en Netlify Blobs **antes** de llamar al CRM. Un CRM
caído, con límite de peticiones o sin configurar no puede costarnos un lead. Todo lead se escribe
además al log de la función como última red. Con `GHL_PIT` y `GHL_LOCATION_ID` puestas, se
reenvía a LeadConnector con proyecto, idioma, origen y UTMs.

Sin JavaScript el formulario funciona igual: la función responde 303 a `/es/gracias/` o
`/en/thank-you/` según el idioma.

### Leer las consultas

`GET /api/leads` devuelve lo guardado; `?format=csv` lo baja como hoja de cálculo, `?since=2026-09-01`
recorta por fecha, `?limit=` por cantidad. Va protegido por `LEADS_TOKEN` (mínimo 24 caracteres), en
la cabecera `Authorization: Bearer …` o como `?token=`:

```bash
curl -H "Authorization: Bearer $LEADS_TOKEN" https://jjfcreando.com/api/leads
curl -o leads.csv "https://jjfcreando.com/api/leads?format=csv&token=$LEADS_TOKEN"
```

Sin la variable puesta el endpoint responde 404: devuelve nombres, teléfonos y correos, así que
falla cerrado. Trátala como una contraseña y rótala si alguna vez viaja en un enlace compartido.

Mientras no haya variables de entorno en el sitio, cada consulta sigue estando en el log de la
función (`LEAD {...}`), que se lee desde el panel de Netlify.

## Contenido

- Los textos de proyecto están en `src/content/projects/{es,en}/*.md` con `copyStatus: propuesta` hasta que el fundador los apruebe.
- `statusVerified`, `sellsVerified`, `years`, `hectares`, etc. sólo se muestran cuando están verificados contra un documento de JJF.
- `src/content/how/*.md` y `src/content/legal/*.md` llevan `reviewed: false`: requieren revisión legal antes de salir a producción.
- El número de WhatsApp en `src/content/site/*.json` está marcado `verified: false` y sólo aparece en staging hasta confirmar el titular.
