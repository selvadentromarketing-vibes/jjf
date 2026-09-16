# Planos

El Plano (§S2) dibuja el plano de un proyecto al abrir su página, y en la portada abre el sitio: la
marca se dibuja, su línea se convierte en el primer camino del plano, el plano se extiende desde ahí
sobre la fotografía del plano impreso, y la película lo releva: una mano retira el papel de calca y
las líneas dibujadas se borran justo donde el papel se levanta. Sólo se dibuja donde existe un plano
real.

- `selvadentro.svg` — trazado **del fotograma de la película** (`source/selvadentro-table.webp`, el
  último cuadro descubierto del plano de la toma de la mesa, recorte 1920×870 del corto), con
  `scripts/trace-roads.mjs` en modo placa: el `viewBox` es el fotograma entero, así que el dibujo
  se registra sobre la fotografía y sobre la película sin ninguna transformación. La red de caminos
  como líneas de centro, el agua como elipses (en la impresión el agua es el único gris liso: modo
  `TRACE_WATER=grey`). Grupos: `#seed` (la manzana más cercana al centro de la hoja: la que la marca
  de la puerta se vuelve), `#boundary` (el marco impreso), `#built` (los caminos, en tres trazos por
  longitud para escalonar la revelación), `#landscape` (cenotes y albercas). `data-sheet-rect` lleva el
  rectángulo de la hoja (la página del proyecto reencuadra a él); `data-seed-cx/cy/w` el centro y
  medio ancho de la manzana, en % del fotograma. Sin texto ni cotas: *no se mide en metros cuadrados*.

Los planos trazados a partir de fotografías aéreas (los otros cinco, y el de Aldea Zama a partir
de un plano de lotificación) se retiraron: leídos a tamaño de pantalla eran garabatos, no planos.
Volverán cuando lleguen los planos de los estudios, uno por uno, pasados por el mismo trazador.

`npm run trace:table` regenera el de Selvadentro desde el fotograma; `TRACE_PREVIEW=out.png` deja
una placa de comprobación con el dibujo en rojo sobre el fotograma. `npm run trace:roads` es el modo
original (plano de ventas). `npm run check:plans` valida cada SVG.
