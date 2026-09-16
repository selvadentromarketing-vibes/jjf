# Planos

El Plano (§S2) dibuja el plano de un proyecto al abrir su página, y en la portada abre el sitio:
la marca se parte sobre él y la película lo releva. Sólo se dibuja donde existe un plano real.

- `selvadentro.svg` — trazado del plan maestro de ventas (`src/assets/masterplans/selvadentro.webp`)
  con `scripts/trace-roads.mjs`: la red de caminos como líneas de centro, el agua como elipses.
  Tres grupos: `#boundary` (la hoja y el anillo exterior), `#built` (los caminos, en tres trazos
  por longitud para escalonar la revelación), `#landscape` (cenotes y albercas). Sin texto ni
  cotas: *no se mide en metros cuadrados*.

Los planos trazados a partir de fotografías aéreas (los otros cinco, y el de Aldea Zama a partir
de un plano de lotificación) se retiraron: leídos a tamaño de pantalla eran garabatos, no planos.
Volverán cuando lleguen los planos de los estudios, uno por uno, pasados por el mismo trazador.

`npm run trace:roads` regenera el de Selvadentro; `TRACE_PREVIEW=out.png` deja una placa de
comprobación con el dibujo sobre la hoja. `npm run check:plans` valida cada SVG.
