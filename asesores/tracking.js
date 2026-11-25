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

  // Página de gracias. Eventos propios (NO Lead: Lead es el evento de clientes con el que
  // optimizan las campañas de inversionistas en este mismo pixel):
  //   AplicacionAsesor        → cumple el perfil (ver esCalificado); a este optimiza la campaña
  //   AplicacionNoCalificada  → cualquier otro registro
  // Solo se disparan si la visita viene de enviar el formulario (no al recargar ni al abrir el
  // enlace directo). Si el navegador no permite sessionStorage no se dispara ninguno.
  if (document.body.classList.contains('thanks')) {
    var raw = store('sd_lead');
    if (raw) {
      var lead = {}; try { lead = JSON.parse(raw); } catch (e) {}
      if (lead.id) {
        track('trackCustom', lead.q ? 'AplicacionAsesor' : 'AplicacionNoCalificada',
          { content_name: 'Reclutamiento asesores' }, { eventID: lead.id });
      }
      store('sd_lead', null);
    }
    return;
  }

  // Perfil calificado: inglés intermedio o mejor, y experiencia en venta de bienes raíces.
  // Si cambian las opciones del formulario, ajusta estas listas.
  var INGLES_OK = ['Nativo / bilingüe', 'Avanzado (fluido)', 'Intermedio'];
  var EXPERIENCIA_OK = ['Menos de 1 año', '1 a 3 años', 'Más de 3 años'];
  function esCalificado(f) {
    return INGLES_OK.indexOf(f.elements.ingles.value) > -1 && EXPERIENCIA_OK.indexOf(f.elements.experiencia.value) > -1;
  }

  // Landing: guarda los UTM y el fbclid de la visita en el formulario (se ven en Netlify Forms)
  var qs = new URLSearchParams(location.search);
  var keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid'];
  keys.forEach(function (k) { if (qs.get(k)) store('sd_' + k, qs.get(k)); });
  var form = document.querySelector('form[name="asesores"]');
  if (form) {
    keys.forEach(function (k) { var el = form.elements[k]; var v = qs.get(k) || store('sd_' + k); if (el && v) el.value = v; });
    form.addEventListener('submit', function () {
      var q = esCalificado(form);
      if (form.elements.perfil) form.elements.perfil.value = q ? 'Calificado' : 'No calificado';
      store('sd_lead', JSON.stringify({ id: 'aplicacion-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8), q: q }));
    });
  }
  // Eventos personalizados para ver cuántos ven el video y abren el registro
  window.sdTrack = function (name) { track('trackCustom', name); };
})();
