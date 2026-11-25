/* Landing de asesores: pixel de Meta y envío del registro (Netlify Forms + GoHighLevel).
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

  // Registro también en GoHighLevel: webhook entrante del flujo de reclutamiento (crea el contacto
  // con la etiqueta candidato-asesor). Acepta CORS desde el navegador.
  var GHL_WEBHOOK = 'https://services.leadconnectorhq.com/hooks/crN2IhAuOBAl7D8324yI/webhook-trigger/981396af-3780-476f-9718-9b63f8571f07';
  var GHL_ESPERA_MS = 2500;  // tope de espera a GHL antes de pasar a la página de gracias

  // Perfil calificado: inglés intermedio o mejor + 1 año o más de experiencia en venta de
  // bienes raíces + vive en Tulum o Playa del Carmen. Si cambian las opciones del formulario,
  // ajusta estas listas.
  var INGLES_OK = ['Nativo / bilingüe', 'Avanzado (fluido)', 'Intermedio'];
  var EXPERIENCIA_OK = ['1 a 3 años', 'Más de 3 años'];
  var CIUDAD_OK = ['Tulum', 'Playa del Carmen'];
  function esCalificado(f) {
    return INGLES_OK.indexOf(f.elements.ingles.value) > -1 &&
      EXPERIENCIA_OK.indexOf(f.elements.experiencia.value) > -1 &&
      CIUDAD_OK.indexOf(f.elements.ciudad.value) > -1;
  }

  // Landing: guarda los UTM y el fbclid de la visita en el formulario (se ven en Netlify Forms)
  var qs = new URLSearchParams(location.search);
  var keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid'];
  keys.forEach(function (k) { if (qs.get(k)) store('sd_' + k, qs.get(k)); });
  var form = document.querySelector('form[name="asesores"]');
  if (form) {
    keys.forEach(function (k) { var el = form.elements[k]; var v = qs.get(k) || store('sd_' + k); if (el && v) el.value = v; });
    var btn = form.querySelector('[type="submit"]');
    var btnText = btn ? btn.textContent : '';
    var sending = false;
    function unlock() { sending = false; if (btn) { btn.disabled = false; btn.textContent = btnText; } }
    window.addEventListener('pageshow', function (e) { if (e.persisted) unlock(); });  // al volver con "atrás"

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (sending) return;                      // bloqueo de doble envío
      sending = true;
      if (btn) { btn.disabled = true; btn.textContent = 'Enviando…'; }

      var q = esCalificado(form);
      if (form.elements.perfil) form.elements.perfil.value = q ? 'Calificado' : 'No calificado';
      store('sd_lead', JSON.stringify({ id: 'aplicacion-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8), q: q }));

      var gracias = form.getAttribute('action');
      var v = function (k) { var el = form.elements[k]; return el ? String(el.value || '').trim() : ''; };
      var bot = !!v('bot-field');

      // 1) GoHighLevel (webhook entrante). No se espera su respuesta más de GHL_ESPERA_MS.
      var ghl = Promise.resolve();
      if (!bot && window.fetch) {
        var payload = { calificado: q ? 'si' : 'no', source_url: location.href };
        ['nombre', 'whatsapp', 'correo', 'ciudad', 'ingles', 'experiencia', 'trayectoria', 'linkedin']
          .concat(keys).forEach(function (k) { payload[k] = v(k); });
        ghl = fetch(GHL_WEBHOOK, {
          method: 'POST', mode: 'cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(function () {});
      }
      var ghlListo = Promise.race([ghl, new Promise(function (r) { setTimeout(r, GHL_ESPERA_MS); })]);

      // 2) Netlify Forms. La página de gracias solo depende de este envío; si falla, se usa el
      //    envío normal del formulario (sin JavaScript), que también lleva a la página de gracias.
      if (!window.fetch) { form.submit(); return; }
      fetch(gracias, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(form)).toString()
      }).then(function (r) {
        if (!r.ok) throw new Error('netlify ' + r.status);
        return ghlListo.then(function () { location.href = gracias; });
      }).catch(function () {
        ghlListo.then(function () { form.submit(); });
      });
    });
  }
  // Eventos personalizados para ver cuántos ven el video y abren el registro
  window.sdTrack = function (name) { track('trackCustom', name); };
})();
