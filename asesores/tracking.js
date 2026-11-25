/* Medición de la landing de asesores: pixel de Meta.
 * Pega aquí el ID del pixel (solo números, en Meta Events Manager → Orígenes de datos).
 * Mientras esté vacío no se carga nada. */
var META_PIXEL_ID = '680727997874671';

(function () {
  var hasPixel = /^\d{6,}$/.test(META_PIXEL_ID);
  if (hasPixel) {
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
    document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', META_PIXEL_ID);
    fbq('track', 'PageView');
  }
  function track(type, name, params, opts) {
    if (hasPixel) fbq(type, name, params || {}, opts || {});
  }
  function store(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) { return undefined; } }

  // Página de gracias: evento propio AplicacionAsesor (NO Lead: Lead es el evento de clientes
  // con el que optimizan las campañas de inversionistas en este mismo pixel). Solo se dispara
  // si la visita viene de enviar el formulario
  // (no se cuenta al recargar ni al abrir el enlace directo).
  if (document.body.classList.contains('thanks')) {
    var id = store('sd_lead');
    var fromForm = id || (id === undefined && /\/asesores\/?(\?|#|$)|\/\/asesores\.selvadentrotulum\.com\/?(\?|#|$)/.test(document.referrer));
    if (fromForm) {
      track('trackCustom', 'AplicacionAsesor', { content_name: 'Reclutamiento asesores' }, id ? { eventID: id } : undefined);
      store('sd_lead', null);
    }
    return;
  }

  // Landing: guarda los UTM y el fbclid de la visita en el formulario (se ven en Netlify Forms)
  var qs = new URLSearchParams(location.search);
  var keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid'];
  keys.forEach(function (k) { if (qs.get(k)) store('sd_' + k, qs.get(k)); });
  var form = document.querySelector('form[name="asesores"]');
  if (form) {
    keys.forEach(function (k) { var el = form.elements[k]; var v = qs.get(k) || store('sd_' + k); if (el && v) el.value = v; });
    form.addEventListener('submit', function () {
      store('sd_lead', 'lead-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8));
    });
  }
  // Eventos personalizados para ver cuántos ven el video y abren el registro
  window.sdTrack = function (name) { track('trackCustom', name); };
})();
