# Planos

El Plano (§S2) dibuja el plano de un proyecto al abrir su página. Sólo se dibuja donde existe un
plano real.

- `aldea-zama.svg` — trazado del plano de lotificación de Aldea Zama (`source/aldea-zama-lotes.webp`).
  Tres grupos: `#boundary`, `#built`, `#landscape`. Sin texto ni cotas: *no se mide en metros cuadrados*.

Los otros cinco se trazaron a partir de fotografías aéreas y se retiraron el 15 de septiembre de 2026:
leídos a tamaño de pantalla eran garabatos, no planos, y para una desarrolladora eso es un fallo de
fidelidad, no de estilo. Volverán cuando lleguen los planos de los estudios (§14 #12), uno por uno.
Mientras tanto esas páginas abren sobre su fotografía.

`npm run check:plans` valida cada SVG (grupos, sin `<text>`, presupuesto de trazos).
