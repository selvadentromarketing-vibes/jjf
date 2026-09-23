(() => {
"use strict";

// ================== i18n dictionary ==================
const I18N = {
  es: {
    "meta.description": "JJF Creando es una desarrolladora inmobiliaria boutique que crea desarrollos innovadores, sostenibles y de lujo en Tulum y la Riviera Maya.",
    "skip": "Saltar al contenido",
    "nav.label": "Navegación principal",
    "nav.home": "Inicio",
    "nav.about": "Nosotros",
    "nav.projects": "Proyectos",
    "nav.contact": "Contacto",
    "menu.open": "Abrir menú",
    "menu.close": "Cerrar menú",
    "cta.schedule": "Agenda una llamada",
    "cta.dream": "Comienza a Construir tu Sueño",
    "cta.dreamTitle": "Comienza a Construir <em>tu Sueño</em>",
    "hero.eyebrow": "Desarrollo inmobiliario boutique · Tulum y Riviera Maya",
    "hero.title": "Creando <em>Experiencias</em><br />a Través del Real Estate",
    "hero.body": "JJF Creando es una desarrolladora inmobiliaria boutique con una misión única: crear espacios que inspiren conexión, tranquilidad y una profunda apreciación por el mundo natural. Con más de 25 años de experiencia en la industria, JJF Creando se ha consolidado como líder en el desarrollo de proyectos innovadores, sostenibles y llenos de lujo que elevan el estándar de vida mientras preservan la belleza del entorno.",
    "hero.cta": "Contáctanos",
    "hero.explore": "Ver proyectos",
    "hero.scroll": "Desliza",
    "stats.years": "Años de experiencia",
    "stats.projects": "Desarrollos emblemáticos",
    "stats.area": "Hectáreas · Yucatán Country Club",
    "stats.sold": "Vendido en Aldea Zama",
    "eyebrow.philosophy": "Tres pilares",
    "philosophy.title": "Nuestra <em>Filosofía</em>",
    "philosophy.intro": "En JJF Creando creemos que los bienes raíces son mucho más que edificios: se trata de crear entornos que transforman vidas y fomentan conexiones significativas. Nuestra filosofía se sustenta en tres pilares fundamentales:",
    "philosophy.pillar1.title": "Diseño Minimalista",
    "philosophy.pillar1.body": "Diseñamos espacios elegantes y funcionales que se integran de forma natural con su entorno, incorporando arquitectura de vanguardia.",
    "philosophy.pillar2.title": "Atención al Detalle",
    "philosophy.pillar2.body": "Cada proyecto refleja una planificación y ejecución meticulosas, garantizando un equilibrio armonioso entre estética, funcionalidad y sostenibilidad.",
    "philosophy.pillar3.title": "Conexión con la Naturaleza",
    "philosophy.pillar3.body": "Priorizamos la preservación del entorno natural, integrando prácticas ecológicas en cada etapa del desarrollo para crear espacios que coexisten con la naturaleza.",
    "eyebrow.projects": "Portafolio",
    "projects.title": "Nuestros <em>Proyectos</em>",
    "eyebrow.vision": "Legado",
    "vision.title": "Nuestra Visión <em>para el Futuro</em>",
    "vision.p1": "En JJF Creando imaginamos un futuro donde el lujo y la sostenibilidad no son excluyentes, sino que están profundamente entrelazados. Nuestro objetivo es redefinir el desarrollo inmobiliario creando espacios que inspiran, nutren y contribuyen al bienestar de sus residentes y de la comunidad que los rodea.",
    "vision.p2": "A través de la innovación, la integridad y la pasión por la excelencia, buscamos seguir creando desarrollos icónicos que dejen un legado duradero.",
    "eyebrow.faq": "FAQ",
    "faq.title": "Preguntas <em>Frecuentes</em>",
    "contact.download": "Descarga Nuestro CV",
    "modal.title": "¡Transforma tu Espacio con la Excelencia de JJF Creando!",
    "modal.body": "Convierte tu visión en realidad con los servicios expertos de construcción y diseño a medida de JJF Creando. ¡Comienza a construir tu futuro hoy!",
    "modal.close": "Cerrar",
    "readMore": "Saber más",
    "sketch.alt": "Boceto arquitectónico",
    "footer.explore": "Explora",
    "footer.language": "Idioma",
    "footer.rights": "Todos los derechos reservados.",
    "footer.top": "Volver arriba",
  },
  en: {
    "meta.description": "JJF Creando is a boutique real estate development company crafting innovative, sustainable, and luxurious developments in Tulum and the Riviera Maya.",
    "skip": "Skip to content",
    "nav.label": "Main navigation",
    "nav.home": "Home",
    "nav.about": "About Us",
    "nav.projects": "Projects",
    "nav.contact": "Contact Us",
    "menu.open": "Open menu",
    "menu.close": "Close menu",
    "cta.schedule": "Schedule A Call",
    "cta.dream": "Start Building Your Dream",
    "cta.dreamTitle": "Start Building <em>Your Dream</em>",
    "hero.eyebrow": "Boutique real estate · Tulum &amp; Riviera Maya",
    "hero.title": "Crafting <em>Experiences</em><br />Through Real Estate",
    "hero.body": "JJF Creando is a boutique real estate development company with a singular mission: to create spaces that inspire connection, tranquility, and a deep appreciation for the natural world. With over 25 years of experience in the industry, JJF Creando has established itself as a leader in crafting innovative, sustainable, and luxurious developments that elevate the standard of living while preserving the beauty of the environment.",
    "hero.cta": "Contact Us",
    "hero.explore": "Explore projects",
    "hero.scroll": "Scroll",
    "stats.years": "Years of experience",
    "stats.projects": "Signature developments",
    "stats.area": "Hectares · Yucatán Country Club",
    "stats.sold": "Sold at Aldea Zama",
    "eyebrow.philosophy": "Three pillars",
    "philosophy.title": "Our <em>Philosophy</em>",
    "philosophy.intro": "At JJF Creando, we believe real estate is more than just buildings—it's about creating environments that shape lives and foster meaningful connections. Our philosophy is rooted in three core pillars:",
    "philosophy.pillar1.title": "Minimalist Design",
    "philosophy.pillar1.body": "We design spaces that are elegant yet functional, blending seamlessly into their surroundings while incorporating cutting-edge architecture.",
    "philosophy.pillar2.title": "Attention to Detail",
    "philosophy.pillar2.body": "Every project reflects meticulous planning and execution, ensuring a harmonious balance between aesthetics, functionality, and sustainability.",
    "philosophy.pillar3.title": "Connection with Nature",
    "philosophy.pillar3.body": "We prioritize preserving the natural environment, integrating eco-conscious practices into every stage of development to create spaces that coexist with nature.",
    "eyebrow.projects": "Portfolio",
    "projects.title": "Our <em>Projects</em>",
    "eyebrow.vision": "Legacy",
    "vision.title": "Our Vision <em>for the Future</em>",
    "vision.p1": "At JJF Creando, we envision a future where luxury and sustainability are not mutually exclusive but deeply intertwined. Our goal is to redefine real estate development by creating spaces that inspire, nurture, and contribute to the wellbeing of their residents and the surrounding community.",
    "vision.p2": "Through innovation, integrity, and a passion for excellence, we aim to continue shaping iconic developments that leave a lasting legacy.",
    "eyebrow.faq": "FAQ",
    "faq.title": "Frequently Asked <em>Questions</em>",
    "contact.download": "Download Our CV",
    "modal.title": "Transform Your Space with JJF Creando Excellence!",
    "modal.body": "Transform your vision into reality with JJF Creando's expert construction and bespoke design services. Start building your future today!",
    "modal.close": "Close",
    "readMore": "Learn More",
    "sketch.alt": "Architectural sketch",
    "footer.explore": "Explore",
    "footer.language": "Language",
    "footer.rights": "All rights reserved.",
    "footer.top": "Back to top",
  },
};

// ================== Projects (bilingual) ==================
// `facts` only restate figures already present in each description.
const projects = [
  {
    img: "assets/selvadentro.webp", w: 1400, h: 699,
    name: { es: "Selvadentro", en: "Selvadentro" },
    text: {
      es: "Selvadentro es un desarrollo de lujo inmerso en la naturaleza, en el corazón de la selva de Tulum, donde la arquitectura refinada se funde con la selva que lo rodea. Concebido en torno a la privacidad, el bienestar y un profundo respeto por la tierra, ofrece residencias exclusivas entrelazadas entre la vegetación nativa, cenotes y el dosel abierto: una invitación a vivir en armonía con la naturaleza sin renunciar al confort ni a la sofisticación.",
      en: "Selvadentro is a luxury, nature-immersed development in the heart of the Tulum jungle, where refined architecture dissolves into the surrounding selva. Conceived around privacy, wellness, and a deep respect for the land, it offers exclusive residences woven between native vegetation, cenotes, and open canopy—an invitation to live in quiet harmony with nature without giving up modern comfort or sophistication.",
    },
    facts: [
      { label: { es: "Ubicación", en: "Location" }, value: { es: "Tulum", en: "Tulum" } },
      { label: { es: "Entorno", en: "Setting" }, value: { es: "Selva y cenotes", en: "Jungle & cenotes" } },
      { label: { es: "Tipo", en: "Type" }, value: { es: "Residencias de lujo", en: "Luxury residences" } },
    ],
    href: "#contact",
  },
  {
    img: "assets/aldea-zama.webp", w: 1024, h: 768,
    name: { es: "Aldea Zama", en: "Aldea Zama" },
    text: {
      es: "Aldea Zama es una comunidad planificada de 100 hectáreas que combina a la perfección el misticismo de la herencia maya de Tulum con la vida internacional moderna. Con 4,000 hogares, 1,000 habitaciones de hotel y 400 espacios comerciales, este desarrollo de uso mixto ofrece zonas residenciales privadas, vibrantes áreas comerciales e infraestructura excepcional. Reconocida como la inversión más segura y codiciada de Tulum, con el 100% de sus espacios vendidos y una valuación de 200 millones de USD, Aldea Zama es celebrada como el mejor desarrollo de Tulum y un referente en la Riviera Maya.",
      en: "Aldea Zama is a 100-hectare master-planned community that seamlessly blends the mysticism of Tulum's Mayan heritage with modern international living. Featuring 4,000 homes, 1,000 hotel rooms, and 400 commercial spaces, this mixed-use development offers private residential zones, vibrant commercial areas, and exceptional infrastructure. Recognized as the most secure and sought-after investment in Tulum, with 100% of its spaces sold and a valuation of $200 million USD, Aldea Zama is celebrated as the best development in Tulum and a standout in the Riviera Maya.",
    },
    facts: [
      { label: { es: "Ubicación", en: "Location" }, value: { es: "Tulum", en: "Tulum" } },
      { label: { es: "Superficie", en: "Area" }, value: { es: "100 ha", en: "100 ha" } },
      { label: { es: "Estatus", en: "Status" }, value: { es: "100% vendido", en: "100% sold" } },
    ],
    href: "#contact",
  },
  {
    img: "assets/selvazama.webp", w: 765, h: 564,
    name: { es: "Selvazama", en: "Selvazama" },
    text: {
      es: "Selvazama es un desarrollo de lujo de 165 hectáreas en la zona hotelera de Tulum que redefine la vida sostenible. Combinando espacios residenciales, comerciales, hoteleros, culturales y recreativos, ofrece amenidades modernas en medio de la belleza natural. Valuado en más de 1,000 millones de USD, incluye proyectos terminados como Aldea Premium I-IV, Ahimsa, Mondo y Dharma, junto con atractivos como Azulik, un centro comercial y una escuela Montessori. Con la Fase 1 completada y la Fase 2 en marcha, Selvazama está dando forma al futuro eco-lujo de Tulum.",
      en: "Selvazama is a 165-hectare luxury development in Tulum's hotel zone, redefining sustainable living. Combining residential, commercial, hotel, cultural, and recreational spaces, it offers modern amenities amidst natural beauty. Valued at over $1 billion USD, it includes completed projects like Aldea Premium I-IV, Ahimsa, Mondo, and Dharma, alongside highlights such as Azulik, a shopping mall, and a Montessori school. With Phase 1 completed and Phase 2 underway, Selvazama is shaping Tulum's eco-luxury future.",
    },
    facts: [
      { label: { es: "Ubicación", en: "Location" }, value: { es: "Zona hotelera, Tulum", en: "Hotel zone, Tulum" } },
      { label: { es: "Superficie", en: "Area" }, value: { es: "165 ha", en: "165 ha" } },
      { label: { es: "Valuación", en: "Valuation" }, value: { es: "+1,000 MDD", en: "US$1B+" } },
    ],
    href: "#contact",
  },
  {
    img: "assets/yucatan.webp", w: 1280, h: 800,
    name: { es: "Yucatán Country Club", en: "Yucatán Country Club" },
    text: {
      es: "Un prestigioso desarrollo privado de 330 hectáreas, reconocido como uno de los proyectos inmobiliarios más importantes de América Latina. En torno a un campo de golf de clase mundial diseñado por Jack Nicklaus, esta comunidad exclusiva ofrece una variedad de opciones residenciales de lujo, incluidas Harmonia Villas & Apartments, Serena Casa, Kanha Grand Lago y Anthea Apartments. Su casa club de vanguardia cuenta con amenidades incomparables que redefinen la vida de lujo. Valuado en 600 millones de USD, el Yucatán Country Club es un testimonio de innovación, elegancia y sofisticación.",
      en: "A prestigious 330-hectare gated development, renowned as one of the most significant real estate projects in Latin America. Centered around a world-class golf course designed by Jack Nicklaus, this exclusive community offers a variety of luxurious residential options, including Harmonia Villas & Apartments, Serena Casa, Kanha Grand Lago, and Anthea Apartments. Its state-of-the-art clubhouse features unparalleled amenities that redefine luxury living. Valued at $600 million USD, the Yucatán Country Club is a testament to innovation, elegance, and sophistication.",
    },
    facts: [
      { label: { es: "Ubicación", en: "Location" }, value: { es: "Yucatán", en: "Yucatán" } },
      { label: { es: "Superficie", en: "Area" }, value: { es: "330 ha", en: "330 ha" } },
      { label: { es: "Golf", en: "Golf" }, value: { es: "Diseño Jack Nicklaus", en: "Jack Nicklaus design" } },
    ],
    href: "#contact",
  },
  {
    img: "assets/amelia.webp", w: 1400, h: 923,
    name: { es: "Amelia Tulum", en: "Amelia Tulum" },
    text: {
      es: "El concepto de Amelia Tulum nace del respeto por las condiciones naturales del clima, la topografía y la vegetación nativa. La construcción propuesta tiene el menor impacto posible sobre el terreno, utilizando la mínima huella al elevar la estructura sobre el suelo, tal como una casa de palafitos coexiste con su entorno natural. Esta decisión dio origen a todas las características estéticas del complejo.",
      en: "Amelia Tulum's concept is born of respect for the natural conditions of the climate, topography and native vegetation. The proposed construction has the least impact on the terrain, using the minimum footprint when raising the structure above the ground – the way a stilt house coexists with its natural environment. This decision gave rise to all the aesthetic characteristics of the complex.",
    },
    facts: [
      { label: { es: "Ubicación", en: "Location" }, value: { es: "Tulum", en: "Tulum" } },
      { label: { es: "Concepto", en: "Concept" }, value: { es: "Estructura elevada", en: "Raised structure" } },
      { label: { es: "Huella", en: "Footprint" }, value: { es: "Mínima", en: "Minimal" } },
    ],
    href: "#contact",
  },
  {
    img: "assets/mazza.webp", w: 1024, h: 576,
    name: { es: "Hacienda Sacalá", en: "Hacienda Sacalá" },
    text: {
      es: "Hacienda Sacalá es un desarrollo residencial exclusivo ubicado en el Pueblo Mágico de Izamal, Yucatán, que combina lujo, cultura y naturaleza en un entorno único. Este proyecto cuenta con un campo de golf de primer nivel, un hotel boutique que ofrece una experiencia de hospitalidad excepcional y un vibrante vecindario con experiencias culinarias, culturales y artísticas que reflejan la riqueza de la región. Diseñado por Muñoz Arquitectos y AS Arquitectura, Hacienda Sacalá redefine el concepto de vivir y relajarse en un lugar mágico lleno de historia y encanto.",
      en: "Hacienda Sacalá is an exclusive residential development located in the Magical Town of Izamal, Yucatán, blending luxury, culture, and nature in a unique setting. This project features a top-tier golf course, a boutique hotel offering an exceptional hospitality experience, and a vibrant neighborhood with culinary, cultural, and artistic experiences that showcase the richness of the region. Designed by Muñoz Arquitectos and AS Arquitectura, Hacienda Sacalá redefines the concept of living and relaxation in a magical place filled with history and charm.",
    },
    facts: [
      { label: { es: "Ubicación", en: "Location" }, value: { es: "Izamal, Yucatán", en: "Izamal, Yucatán" } },
      { label: { es: "Amenidades", en: "Amenities" }, value: { es: "Golf y hotel boutique", en: "Golf & boutique hotel" } },
      { label: { es: "Arquitectos", en: "Architects" }, value: { es: "Muñoz · AS Arquitectura", en: "Muñoz · AS Arquitectura" } },
    ],
    href: "#contact",
  },
];

// ================== FAQ (bilingual) ==================
const faqs = [
  {
    q: { es: "¿Ofrecen servicios de construcción tanto comercial como residencial?", en: "Do you offer both commercial and residential construction services?" },
    a: { es: "Sí, JJF Creando se especializa en proyectos de construcción comercial y residencial, adaptados a las necesidades de cada cliente.", en: "Yes, JJF Creando specializes in both commercial and residential construction projects, tailored to client needs." },
  },
  {
    q: { es: "¿JJF Creando puede ayudar a obtener permisos de construcción y otros requisitos legales?", en: "Can JJF Creando assist with obtaining building permits and other legal requirements?" },
    a: { es: "Sí, brindamos apoyo integral en la gestión de todos los aspectos regulatorios y de cumplimiento de la construcción, incluida la obtención de los permisos necesarios, para garantizar un proceso sin complicaciones para nuestros clientes.", en: "Yes, we provide comprehensive support in managing all regulatory and compliance aspects of construction, including obtaining necessary building permits, to ensure a hassle-free process for our clients." },
  },
  {
    q: { es: "¿Qué prácticas de sostenibilidad incorpora JJF Creando en sus proyectos?", en: "What sustainability practices does JJF Creando incorporate into its projects?" },
    a: { es: "Utilizamos prácticas de construcción sostenible, materiales de eficiencia energética y estrategias innovadoras para la reducción de residuos.", en: "We utilize green building practices, energy-efficient materials, and innovative waste reduction strategies." },
  },
  {
    q: { es: "¿Cómo garantiza JJF Creando la calidad de su construcción?", en: "How does JJF Creando ensure the quality of its construction?" },
    a: { es: "Utilizamos materiales de alta calidad, cumplimos con estándares estrictos y realizamos múltiples inspecciones a lo largo de todo el proceso de construcción.", en: "We use high-quality materials, adhere to strict standards, and conduct multiple inspections throughout the construction process." },
  },
  {
    q: { es: "¿JJF Creando ofrece soluciones de construcción personalizadas?", en: "Does JJF Creando offer customized building solutions?" },
    a: { es: "Sí, creamos soluciones a la medida para nuestros clientes, asegurando que el producto final cumpla con sus necesidades específicas.", en: "Yes, we create tailor-made solutions for our clients, ensuring the final product meets your specific needs." },
  },
  {
    q: { es: "¿Qué tipo de soporte puedo esperar después de finalizar un proyecto?", en: "What kind of follow-up support can I expect after the completion of a project?" },
    a: { es: "JJF Creando ofrece un soporte postconstrucción integral que incluye asesoría de mantenimiento, cumplimiento de garantías y atención al cliente.", en: "JJF Creando offers comprehensive post-construction support including maintenance advice, warranty fulfillment, and customer services." },
  },
];

// ================== Helpers ==================
const SUPPORTED = ["es", "en"];
const root = document.documentElement;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
const isDesktop = window.matchMedia("(min-width: 1024px)");
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
const pad = (n) => String(n).padStart(2, "0");
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
const ARROW = '<svg viewBox="0 0 24 24"><path d="M4 12h15M13 6l6 6-6 6"/></svg>';

const header = $("#site-header");
const hero = $("#hero");
const heroMedia = $(".hero-media");
const heroContent = $(".hero-content");
const progressBar = $(".scroll-progress span");
const projectList = $("#project-list");
const stage = $("#project-stage");
const faqList = $("#faq-list");
const menu = $("#mobile-menu");
const menuToggle = $("#menu-toggle");
const modal = $("#modal");
const bookingFrame = $("#booking-frame");
const darkSections = [hero, $("#projects"), $("#contact"), $("footer")];

let currentLang = "es";
let menuOpen = false;

// ================== Render (once; text is filled in by applyLang) ==================
// Dynamic strings join the dictionaries so one pass of applyLang updates everything
// in place — the DOM (and its reveal state) survives a language switch.
function registerStrings() {
  for (const lang of SUPPORTED) {
    const dict = I18N[lang];
    projects.forEach((p, i) => {
      dict[`project.${i}.name`] = p.name[lang];
      dict[`project.${i}.text`] = p.text[lang];
      p.facts.forEach((f, j) => {
        dict[`project.${i}.fact.${j}.label`] = f.label[lang];
        dict[`project.${i}.fact.${j}.value`] = f.value[lang];
      });
    });
    faqs.forEach((f, i) => {
      dict[`faq.${i}.q`] = f.q[lang];
      dict[`faq.${i}.a`] = f.a[lang];
    });
  }
}

function renderProjects() {
  const total = pad(projects.length);
  projectList.innerHTML = projects
    .map(
      (p, i) => `
      <article class="project" data-project="${i}" aria-labelledby="project-${i}-title">
        <figure class="project-media lg:hidden" data-reveal="clip">
          <img src="${p.img}" alt="${p.name.en}" width="${p.w}" height="${p.h}" loading="lazy" decoding="async" />
        </figure>
        <p class="project-num" data-reveal="fade"><span>${pad(i + 1)}</span><span class="project-num-total">/ ${total}</span></p>
        <h3 id="project-${i}-title" class="project-title" data-split data-i18n="project.${i}.name"></h3>
        <dl class="project-facts" data-reveal="up">
          ${p.facts.map((_, j) => `<div><dt data-i18n="project.${i}.fact.${j}.label"></dt><dd data-i18n="project.${i}.fact.${j}.value"></dd></div>`).join("")}
        </dl>
        <p class="project-text" data-reveal="up" data-i18n="project.${i}.text"></p>
        <div class="mt-9" data-reveal="up">
          <a href="${p.href}" data-cta class="btn btn-light" data-magnetic>
            <span data-i18n="readMore"></span>
            <span class="btn-icon" aria-hidden="true">${ARROW}${ARROW}</span>
          </a>
        </div>
      </article>`
    )
    .join("");
}

function renderStage() {
  stage.innerHTML = `
    <div class="stage-slides">
      ${projects
        .map(
          (p, i) => `
        <figure class="stage-slide${i === 0 ? " is-open" : ""}">
          <div class="stage-zoom"><img src="${p.img}" alt="" width="${p.w}" height="${p.h}" loading="lazy" decoding="async" /></div>
        </figure>`
        )
        .join("")}
    </div>
    <div class="stage-ui">
      <p class="stage-count"><span class="stage-count-current"><span>01</span></span><span class="stage-count-total">/ ${pad(projects.length)}</span></p>
      <div class="stage-bars">${projects.map((_, i) => `<span${i === 0 ? ' class="is-active"' : ""}></span>`).join("")}</div>
    </div>`;
}

function renderMarquee() {
  const group = projects.map((p) => `<span class="marquee-item">${p.name.en}</span><span class="marquee-sep"></span>`).join("");
  $(".marquee-track").innerHTML = `<div class="marquee-group">${group}</div><div class="marquee-group">${group}</div>`;
}

function renderFaqs() {
  faqList.innerHTML = faqs
    .map(
      (_, i) => `
      <details class="faq" data-reveal="up">
        <summary>
          <div class="faq-row">
            <span class="faq-num">${pad(i + 1)}</span>
            <span class="faq-q" data-i18n="faq.${i}.q"></span>
            <span class="faq-icon" aria-hidden="true"></span>
          </div>
        </summary>
        <div class="faq-a"><div><p data-i18n="faq.${i}.a"></p></div></div>
      </details>`
    )
    .join("");
}

// ================== Split text ==================
// "mask": every word becomes .w > .w-i so it can rise out of its own mask.
// "scrub": plain .sw spans whose opacity is driven by scroll position.
function splitText(el, mode) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  const words = [];
  for (const node of nodes) {
    const frag = document.createDocumentFragment();
    for (const part of node.nodeValue.split(/(\s+)/)) {
      if (!part) continue;
      if (/^\s+$/.test(part)) {
        frag.append(" ");
        continue;
      }
      const word = document.createElement("span");
      if (mode === "scrub") {
        word.className = "sw";
        word.textContent = part;
      } else {
        word.className = "w";
        const inner = document.createElement("span");
        inner.className = "w-i";
        inner.style.setProperty("--i", words.length);
        inner.textContent = part;
        word.append(inner);
      }
      words.push(word);
      frag.append(word);
    }
    node.replaceWith(frag);
  }
  return words;
}

// ================== Apply language ==================
let scrubEl = null;
let scrubWords = [];
let litCount = 0;

function applyLang(lang) {
  if (!SUPPORTED.includes(lang)) lang = "es";
  currentLang = lang;
  const dict = I18N[lang];

  $$("[data-i18n]").forEach((el) => {
    const val = dict[el.dataset.i18n];
    if (val === undefined) return;
    if (el.tagName === "META") {
      el.setAttribute("content", val);
      return;
    }
    el.innerHTML = val;
    if (el.hasAttribute("data-split")) splitText(el, "mask");
    else if (el.hasAttribute("data-scrub")) {
      scrubWords = splitText(el, "scrub");
      litCount = 0;
    }
  });
  $$("[data-i18n-aria]").forEach((el) => {
    const val = dict[el.dataset.i18nAria];
    if (val) el.setAttribute("aria-label", val);
  });
  $$("[data-i18n-alt]").forEach((el) => {
    const val = dict[el.dataset.i18nAlt];
    if (val) el.alt = val;
  });

  if (bookingFrame) bookingFrame.setAttribute("title", dict["cta.schedule"]);
  menuToggle.setAttribute("aria-label", dict[menuOpen ? "menu.close" : "menu.open"]);

  root.lang = lang;
  $$(".lang-toggle").forEach((t) => (t.dataset.active = lang));
  $$(".lang-btn").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));

  try { localStorage.setItem("jjf-lang", lang); } catch (e) {}
  requestFrame();
}

function switchLang(lang) {
  if (lang === currentLang) return;
  // Cross-fade the text swap where View Transitions are supported
  if (document.startViewTransition && !reduceMotion.matches) document.startViewTransition(() => applyLang(lang));
  else applyLang(lang);
}

// ================== Scroll reveals ==================
function initReveals() {
  const targets = $$("[data-reveal], [data-split]").filter((el) => !hero.contains(el));
  if (reduceMotion.matches || !("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("is-in"));
    return;
  }
  $$("[data-count]").forEach((el) => (el.textContent = "0"));

  // Elements entering together cascade in DOM order; a lone element reveals at once.
  const io = new IntersectionObserver(
    (entries) => {
      const batch = entries
        .filter((e) => e.isIntersecting)
        .map((e) => e.target)
        .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
      batch.forEach((el, i) => {
        el.style.setProperty("--d", `${Math.min(i, 6) * 90}ms`);
        el.classList.add("is-in");
        el.querySelectorAll("[data-count]").forEach(countUp);
        io.unobserve(el);
      });
    },
    { rootMargin: "0px 0px -8% 0px" }
  );
  targets.forEach((el) => io.observe(el));
}

function countUp(el) {
  const target = parseInt(el.dataset.count, 10);
  const start = performance.now();
  const duration = 1800;
  const tick = (now) => {
    const t = Math.min(1, (now - start) / duration);
    el.textContent = String(Math.round(target * easeOutExpo(t)));
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// ================== Scroll-linked effects (one rAF loop) ==================
const inView = new Set();
const viewIO = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => (e.isIntersecting ? inView.add(e.target) : inView.delete(e.target)));
    requestFrame();
  },
  { rootMargin: "20% 0px" }
);

let parallaxEls = [];
let vh = window.innerHeight;
let heroH = hero.offsetHeight;
let lastY = window.scrollY;
let anchorY = lastY;
let lastDir = 0;
let ticking = false;

function requestFrame() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(frame);
}

function frame() {
  ticking = false;
  const y = window.scrollY;
  const motion = !reduceMotion.matches;

  // Reads first…
  const maxScroll = Math.max(1, root.scrollHeight - vh);
  const parallax = motion
    ? parallaxEls
        .filter((el) => inView.has(el))
        .map((el) => {
          const r = el.getBoundingClientRect();
          return [el.firstElementChild, (r.top + r.height / 2 - vh / 2) * -parseFloat(el.dataset.parallax)];
        })
    : [];
  let scrub = null;
  if (scrubEl && inView.has(scrubEl)) {
    const r = scrubEl.getBoundingClientRect();
    const start = vh * 0.9;
    const end = vh * 0.55;
    scrub = clamp((start - r.top) / (start - end + r.height), 0, 1);
  }
  let stageShift = null;
  if (motion && activeProject >= 0 && inView.has(stage)) {
    const r = articles[activeProject].getBoundingClientRect();
    stageShift = (0.5 - clamp((vh / 2 - r.top) / r.height, 0, 1)) * 7;
  }
  const onDark = darkSections.some((s) => {
    const r = s.getBoundingClientRect();
    return r.top <= 40 && r.bottom > 40;
  });

  // …then writes
  header.classList.toggle("on-dark", onDark);
  updateHeader(y);
  progressBar.style.transform = `scaleX(${(y / maxScroll).toFixed(4)})`;
  if (motion && y <= heroH) {
    heroMedia.style.transform = `translate3d(0, ${(y * 0.35).toFixed(1)}px, 0)`;
    heroContent.style.transform = `translate3d(0, ${(y * 0.18).toFixed(1)}px, 0)`;
    heroContent.style.opacity = clamp(1 - y / (heroH * 0.7), 0, 1).toFixed(3);
  }
  parallax.forEach(([child, offset]) => {
    child.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
  });
  if (scrub !== null) {
    const lit = Math.round(scrub * scrubWords.length);
    if (lit !== litCount) {
      scrubWords.forEach((w, i) => w.classList.toggle("is-lit", i < lit));
      litCount = lit;
    }
  }
  if (stageShift !== null) {
    slides[activeProject].img.style.transform = `translate3d(0, ${stageShift.toFixed(2)}%, 0)`;
  }
  lastY = y;
}

// Solid once scrolled; hides while scrolling down, returns on the way up.
function updateHeader(y) {
  header.classList.toggle("is-top", y < 40);
  const dir = y > lastY ? 1 : y < lastY ? -1 : lastDir;
  if (dir !== lastDir) {
    anchorY = lastY;
    lastDir = dir;
  }
  if (menuOpen || y < heroH * 0.6) header.classList.remove("is-hidden");
  else if (dir > 0 && y - anchorY > 80) header.classList.add("is-hidden");
  else if (dir < 0 && anchorY - y > 40) header.classList.remove("is-hidden");
}

// ================== Projects: sticky stage follows the active row ==================
let articles = [];
let slides = [];
let activeProject = -1;
let zTop = 1;

function initProjects() {
  articles = $$(".project", projectList);
  slides = $$(".stage-slide", stage).map((el) => ({ el, img: $("img", el) }));
  const counter = $(".stage-count-current", stage);
  const bars = $$(".stage-bars span", stage);

  // Re-arm a slide at its closed state (no transition), stack it on top, then open it.
  const show = (slide, from, animate) => {
    slide.classList.add("is-resetting");
    slide.classList.remove("is-open");
    slide.dataset.from = from;
    slide.style.zIndex = ++zTop;
    void slide.offsetWidth;
    if (animate) slide.classList.remove("is-resetting");
    slide.classList.add("is-open");
    if (!animate) requestAnimationFrame(() => slide.classList.remove("is-resetting"));
  };

  const setActive = (i) => {
    if (i === activeProject) return;
    const prev = activeProject;
    activeProject = i;
    counter.innerHTML = `<span>${pad(i + 1)}</span>`;
    bars.forEach((b, j) => b.classList.toggle("is-active", j <= i));
    if (prev === -1) {
      if (i !== 0) show(slides[i].el, "bottom", false);
    } else {
      show(slides[i].el, i > prev ? "bottom" : "top", !reduceMotion.matches);
    }
    requestFrame();
  };

  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.isIntersecting && setActive(Number(e.target.dataset.project))),
    { rootMargin: "-45% 0px -54% 0px" }
  );
  articles.forEach((a) => io.observe(a));
}

// ================== Header nav: highlight the section in view ==================
function initScrollSpy() {
  const links = $$("[data-nav-link]");
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const key = e.target.dataset.nav;
        links.forEach((a) => {
          const current = a.dataset.navLink === key;
          a.classList.toggle("is-current", current);
          if (current) a.setAttribute("aria-current", "true");
          else a.removeAttribute("aria-current");
        });
      });
    },
    { rootMargin: "-45% 0px -54% 0px" }
  );
  $$("[data-nav]").forEach((s) => io.observe(s));
}

// ================== Scroll lock (menu + modal) ==================
const lockScroll = (lock) => root.classList.toggle("is-locked", lock);

// ================== Mobile menu ==================
function setMenu(open) {
  if (open === menuOpen) return;
  menuOpen = open;
  root.classList.toggle("menu-open", open);
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", I18N[currentLang][open ? "menu.close" : "menu.open"]);
  menu.inert = !open;
  $("main").inert = open;
  $("footer").inert = open;
  lockScroll(open);
  if (open) {
    header.classList.remove("is-hidden");
    setTimeout(() => $("a", menu).focus({ preventScroll: true }), 400);
  }
}

function initMenu() {
  menuToggle.addEventListener("click", () => setMenu(!menuOpen));
  menu.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    if (!link) return;
    if (link.hasAttribute("data-cta")) {
      setMenu(false); // the modal opens via the global [data-cta] handler
      return;
    }
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    e.preventDefault();
    setMenu(false);
    target.scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth" });
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menuOpen) {
      setMenu(false);
      menuToggle.focus();
    }
  });
  isDesktop.addEventListener("change", (e) => e.matches && setMenu(false));
}

// ================== Contact modal (GHL calendar in a native <dialog>) ==================
let lastFocus = null;

function openModal() {
  if (modal.open) return;
  if (bookingFrame && !bookingFrame.src) bookingFrame.src = bookingFrame.dataset.src;
  lastFocus = document.activeElement;
  modal.classList.remove("is-closing");
  modal.showModal();
  lockScroll(true);
}

function closeModal() {
  if (!modal.open || modal.classList.contains("is-closing")) return;
  if (reduceMotion.matches) {
    modal.close();
    return;
  }
  const panel = $(".modal-panel", modal);
  const done = () => {
    clearTimeout(timer);
    panel.removeEventListener("animationend", onEnd);
    modal.close();
  };
  const onEnd = (e) => e.target === panel && done();
  const timer = setTimeout(done, 500);
  panel.addEventListener("animationend", onEnd);
  modal.classList.add("is-closing");
}

function initModal() {
  document.addEventListener("click", (e) => {
    if (!e.target.closest("[data-cta]")) return;
    e.preventDefault();
    openModal();
  });
  $("#modal-close").addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => e.target === modal && closeModal());
  modal.addEventListener("cancel", (e) => {
    e.preventDefault();
    closeModal();
  });
  modal.addEventListener("close", () => {
    modal.classList.remove("is-closing");
    lockScroll(menuOpen);
    // Focus goes back to the trigger — or the menu button if the trigger now sits in an inert menu
    const target = lastFocus && !lastFocus.closest("[inert]") ? lastFocus : menuToggle;
    target.focus({ preventScroll: true });
  });
  bookingFrame?.addEventListener("load", () => {
    if (bookingFrame.src) bookingFrame.parentElement.classList.add("is-ready");
  });
}

// ================== FAQ accordion (animates both open and close) ==================
function initFaq() {
  faqList.addEventListener("click", (e) => {
    const summary = e.target.closest("summary");
    if (!summary) return;
    e.preventDefault();
    const item = summary.parentElement;
    const answer = $(".faq-a", item);
    if (item.classList.contains("is-open")) {
      item.classList.remove("is-open");
      const done = () => {
        clearTimeout(timer);
        answer.removeEventListener("transitionend", onEnd);
        if (!item.classList.contains("is-open")) item.open = false;
      };
      const onEnd = (ev) => ev.target === answer && ev.propertyName === "grid-template-rows" && done();
      const timer = setTimeout(done, 700);
      answer.addEventListener("transitionend", onEnd);
    } else {
      item.open = true;
      void answer.offsetHeight; // commit the collapsed state so the height transition runs
      item.classList.add("is-open");
    }
  });
  // Keep the class in sync when the browser opens an item itself (e.g. find-in-page)
  faqList.addEventListener(
    "toggle",
    (e) => e.target.open && e.target.classList.add("is-open"),
    true
  );
}

// ================== Magnetic buttons (fine pointers only) ==================
function initMagnetic() {
  if (!finePointer.matches || reduceMotion.matches) return;
  $$("[data-magnetic]").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * 0.15;
      const y = (e.clientY - r.top - r.height / 2) * 0.3;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    });
    el.addEventListener("pointerleave", () => (el.style.transform = ""));
  });
}

// ================== Hero intro ==================
function startIntro() {
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  Promise.race([fontsReady, new Promise((r) => setTimeout(r, 1200))]).then(() =>
    requestAnimationFrame(() => root.classList.add("is-loaded"))
  );
}

// ================== Init ==================
registerStrings();
renderProjects();
renderStage();
renderMarquee();
renderFaqs();
scrubEl = $("[data-scrub]");

let initial = "es";
try {
  const saved = localStorage.getItem("jjf-lang");
  if (saved && SUPPORTED.includes(saved)) initial = saved;
  else if (navigator.language && navigator.language.toLowerCase().startsWith("en")) initial = "en";
} catch (e) {}
applyLang(initial);

initReveals();
parallaxEls = $$("[data-parallax]");
[...parallaxEls, scrubEl, stage].forEach((el) => el && viewIO.observe(el));
initProjects();
initScrollSpy();
initMenu();
initModal();
initFaq();
initMagnetic();

$$(".lang-btn").forEach((btn) => btn.addEventListener("click", () => switchLang(btn.dataset.lang)));
$$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

window.addEventListener("scroll", requestFrame, { passive: true });
window.addEventListener("resize", () => {
  vh = window.innerHeight;
  heroH = hero.offsetHeight;
  requestFrame();
});

requestFrame();
startIntro();
window.__jjfReady = true;
})();
