// Site copy (ES/EN) and the markup for the projects + FAQ lists.
// This file is the single source of truth for text: after editing it, run `npm run build`
// so the Spanish fallback baked into index.html (for search engines / no-JS) stays in sync.
(() => {
"use strict";

// ================== i18n dictionary ==================
// Booking calendar (GoHighLevel). CTA links point here so they still work without JS;
// with JS they open it inside the modal instead. Also used by the iframe in index.html.
const BOOKING_URL = "https://api.leadconnectorhq.com/widget/booking/DD1xkh0ObvHQFhcyxgJR";

const I18N = {
  es: {
    "meta.title": "JJF Creando | Desarrolladora inmobiliaria boutique en Tulum",
    "meta.description": "JJF Creando es una desarrolladora inmobiliaria boutique que crea desarrollos innovadores, sostenibles y de lujo en Tulum y la Riviera Maya.",
    "skip": "Saltar al contenido",
    "nav.label": "Navegación principal",
    "nav.menu": "Menú",
    "nav.home": "Inicio",
    "nav.about": "Nosotros",
    "nav.projects": "Proyectos",
    "nav.contact": "Contacto",
    "menu.open": "Abrir menú",
    "menu.close": "Cerrar menú",
    "cta.schedule": "Agenda una llamada",
    "cta.dream": "Comienza a Construir tu Sueño",
    "cta.dreamTitle": "Comienza a Construir <em>tu&nbsp;Sueño</em>",
    "hero.eyebrow": "Desarrollo inmobiliario boutique · Tulum y Riviera Maya",
    "hero.title": "Creando <em>Experiencias</em><br />a Través del Real&nbsp;Estate",
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
    "contact.body": "Convierte tu visión en realidad con los servicios expertos de construcción y diseño a medida de JJF Creando.",
    "modal.title": "¡Transforma tu Espacio con la Excelencia de JJF Creando!",
    "modal.body": "Convierte tu visión en realidad con los servicios expertos de construcción y diseño a medida de JJF Creando. ¡Comienza a construir tu futuro hoy!",
    "modal.close": "Cerrar",
    "readMore": "Saber más",
    "sketch.alt": "Boceto arquitectónico",
    "footer.explore": "Explora",
    "footer.language": "Idioma",
    "footer.rights": "Todos los derechos reservados.",
    "footer.top": "Volver arriba",
    "lang.hint": "Ver en inglés",
  },
  en: {
    "meta.title": "JJF Creando | Boutique Real Estate Developer in Tulum",
    "meta.description": "JJF Creando is a boutique real estate development company crafting innovative, sustainable, and luxurious developments in Tulum and the Riviera Maya.",
    "skip": "Skip to content",
    "nav.label": "Main navigation",
    "nav.menu": "Menu",
    "nav.home": "Home",
    "nav.about": "About Us",
    "nav.projects": "Projects",
    "nav.contact": "Contact Us",
    "menu.open": "Open menu",
    "menu.close": "Close menu",
    "cta.schedule": "Schedule A Call",
    "cta.dream": "Start Building Your Dream",
    "cta.dreamTitle": "Start Building <em>Your&nbsp;Dream</em>",
    "hero.eyebrow": "Boutique real estate development · Tulum &amp; Riviera Maya",
    "hero.title": "Crafting <em>Experiences</em><br />Through Real&nbsp;Estate",
    "hero.body": "JJF Creando is a boutique real estate development company with a singular mission: to create spaces that inspire connection, tranquility, and a deep appreciation for the natural world. With over 25 years of experience in the industry, JJF Creando has established itself as a leader in crafting innovative, sustainable, and luxurious developments that elevate the standard of living while preserving the beauty of the environment.",
    "hero.cta": "Contact Us",
    "hero.explore": "Explore Projects",
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
    "contact.body": "Transform your vision into reality with JJF Creando's expert construction and bespoke design services.",
    "modal.title": "Transform Your Space with JJF Creando Excellence!",
    "modal.body": "Transform your vision into reality with JJF Creando's expert construction and bespoke design services. Start building your future today!",
    "modal.close": "Close",
    "readMore": "Learn More",
    "sketch.alt": "Architectural sketch",
    "footer.explore": "Explore",
    "footer.language": "Language",
    "footer.rights": "All rights reserved.",
    "footer.top": "Back to top",
    "lang.hint": "View in English",
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
    href: BOOKING_URL,
  },
  {
    img: "assets/aldea-zama.webp", w: 1024, h: 768,
    name: { es: "Aldea Zama", en: "Aldea Zama" },
    text: {
      es: "Aldea Zama es una comunidad planificada de 100 hectáreas que combina a la perfección el misticismo de la herencia maya de Tulum con la vida internacional moderna. Con 4,000 hogares, 1,000 habitaciones de hotel y 400 espacios comerciales, este desarrollo de uso mixto ofrece zonas residenciales privadas, vibrantes áreas comerciales e infraestructura excepcional. Reconocida como la inversión más segura y codiciada de Tulum, con el 100% de sus espacios vendidos y una valuación de 200&nbsp;millones de USD, Aldea Zama es celebrada como el mejor desarrollo de Tulum y un referente en la Riviera Maya.",
      en: "Aldea Zama is a 100-hectare master-planned community that seamlessly blends the mysticism of Tulum's Mayan heritage with modern international living. Featuring 4,000 homes, 1,000 hotel rooms, and 400 commercial spaces, this mixed-use development offers private residential zones, vibrant commercial areas, and exceptional infrastructure. Recognized as the most secure and sought-after investment in Tulum, with 100% of its spaces sold and a valuation of $200&nbsp;million USD, Aldea Zama is celebrated as the best development in Tulum and a standout in the Riviera Maya.",
    },
    facts: [
      { label: { es: "Ubicación", en: "Location" }, value: { es: "Tulum", en: "Tulum" } },
      { label: { es: "Superficie", en: "Area" }, value: { es: "100 ha", en: "100 ha" } },
      { label: { es: "Estatus", en: "Status" }, value: { es: "100% vendido", en: "100% sold" } },
    ],
    href: BOOKING_URL,
  },
  {
    img: "assets/selvazama.webp", w: 765, h: 564,
    name: { es: "Selvazama", en: "Selvazama" },
    text: {
      es: "Selvazama es un desarrollo de lujo de 165 hectáreas en la zona hotelera de Tulum que redefine la vida sostenible. Combinando espacios residenciales, comerciales, hoteleros, culturales y recreativos, ofrece amenidades modernas en medio de la belleza natural. Valuado en más de 1,000&nbsp;millones de USD, incluye proyectos terminados como Aldea Premium I-&#8288;IV, Ahimsa, Mondo y Dharma, junto con atractivos como Azulik, un centro comercial y una escuela Montessori. Con la Fase 1 completada y la Fase 2 en marcha, Selvazama está dando forma al futuro eco-lujo de Tulum.",
      en: "Selvazama is a 165-hectare luxury development in Tulum's hotel zone, redefining sustainable living. Combining residential, commercial, hotel, cultural, and recreational spaces, it offers modern amenities amidst natural beauty. Valued at over $1&nbsp;billion USD, it includes completed projects like Aldea Premium I-&#8288;IV, Ahimsa, Mondo, and Dharma, alongside highlights such as Azulik, a shopping mall, and a Montessori school. With Phase 1 completed and Phase 2 underway, Selvazama is shaping Tulum's eco-luxury future.",
    },
    facts: [
      { label: { es: "Ubicación", en: "Location" }, value: { es: "Zona hotelera, Tulum", en: "Hotel zone, Tulum" } },
      { label: { es: "Superficie", en: "Area" }, value: { es: "165 ha", en: "165 ha" } },
      { label: { es: "Valuación", en: "Valuation" }, value: { es: "+1,000 MDD", en: "US$1B+" } },
    ],
    href: BOOKING_URL,
  },
  {
    img: "assets/yucatan.webp", w: 1280, h: 800,
    name: { es: "Yucatán Country Club", en: "Yucatán Country Club" },
    text: {
      es: "Un prestigioso desarrollo privado de 330 hectáreas, reconocido como uno de los proyectos inmobiliarios más importantes de América Latina. En torno a un campo de golf de clase mundial diseñado por Jack Nicklaus, esta comunidad exclusiva ofrece una variedad de opciones residenciales de lujo, incluidas Harmonia Villas & Apartments, Serena Casa, Kanha Grand Lago y Anthea Apartments. Su casa club de vanguardia cuenta con amenidades incomparables que redefinen la vida de lujo. Valuado en 600&nbsp;millones de USD, el Yucatán Country Club es un testimonio de innovación, elegancia y sofisticación.",
      en: "A prestigious 330-hectare gated development, renowned as one of the most significant real estate projects in Latin America. Centered around a world-class golf course designed by Jack Nicklaus, this exclusive community offers a variety of luxurious residential options, including Harmonia Villas & Apartments, Serena Casa, Kanha Grand Lago, and Anthea Apartments. Its state-of-the-art clubhouse features unparalleled amenities that redefine luxury living. Valued at $600&nbsp;million USD, the Yucatán Country Club is a testament to innovation, elegance, and sophistication.",
    },
    facts: [
      { label: { es: "Ubicación", en: "Location" }, value: { es: "Yucatán", en: "Yucatán" } },
      { label: { es: "Superficie", en: "Area" }, value: { es: "330 ha", en: "330 ha" } },
      { label: { es: "Golf", en: "Golf" }, value: { es: "Diseño Jack Nicklaus", en: "Jack Nicklaus design" } },
    ],
    href: BOOKING_URL,
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
    href: BOOKING_URL,
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
      { label: { es: "Arquitectos", en: "Architects" }, value: { es: "Muñoz Arquitectos<br />AS Arquitectura", en: "Muñoz Arquitectos<br />AS Arquitectura" } },
    ],
    href: BOOKING_URL,
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


// Dynamic strings join the dictionaries so a single applyLang() pass updates everything in place.
for (const lang of Object.keys(I18N)) {
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

// ================== Markup (used by main.js and scripts/prerender.mjs) ==================
// `t(key)` returns the text to bake in: Spanish for the prerendered HTML, "" when main.js
// renders at runtime (applyLang fills the text right after).
const pad = (n) => String(n).padStart(2, "0");
const ARROW = '<svg viewBox="0 0 24 24"><path d="M4 12h15M13 6l6 6-6 6"/></svg>';

const projectsMarkup = (t) =>
  projects
    .map(
      (p, i) => `
          <article class="project" data-project="${i}" aria-labelledby="project-${i}-title">
            <figure class="project-media lg:hidden" data-reveal="clip">
              <img src="${p.img}" alt="${p.name.en}" width="${p.w}" height="${p.h}" loading="lazy" decoding="async" />
            </figure>
            <p class="project-num" data-reveal="fade"><span>${pad(i + 1)}</span><span class="project-num-total">/ ${pad(projects.length)}</span></p>
            <h3 id="project-${i}-title" class="project-title" data-split data-i18n="project.${i}.name">${t(`project.${i}.name`)}</h3>
            <dl class="project-facts" data-reveal="up">
              ${p.facts
                .map((_, j) => `<div><dt data-i18n="project.${i}.fact.${j}.label">${t(`project.${i}.fact.${j}.label`)}</dt><dd data-i18n="project.${i}.fact.${j}.value">${t(`project.${i}.fact.${j}.value`)}</dd></div>`)
                .join("\n              ")}
            </dl>
            <p class="project-text" data-reveal="up" data-i18n="project.${i}.text">${t(`project.${i}.text`)}</p>
            <div class="mt-9" data-reveal="up">
              <a href="${p.href}" target="_blank" rel="noopener" data-cta class="btn btn-light" data-magnetic>
                <span data-i18n="readMore">${t("readMore")}</span>
                <span class="btn-icon" aria-hidden="true">${ARROW}${ARROW}</span>
              </a>
            </div>
          </article>`
    )
    .join("");

const faqsMarkup = (t) =>
  faqs
    .map(
      (_, i) => `
          <details class="faq" data-reveal="up">
            <summary>
              <span class="faq-row">
                <span class="faq-num">${pad(i + 1)}</span>
                <span class="faq-q" data-i18n="faq.${i}.q">${t(`faq.${i}.q`)}</span>
                <span class="faq-icon" aria-hidden="true"></span>
              </span>
            </summary>
            <div class="faq-a"><div><p data-i18n="faq.${i}.a">${t(`faq.${i}.a`)}</p></div></div>
          </details>`
    )
    .join("");

window.JJF_CONTENT = { I18N, projects, faqs, projectsMarkup, faqsMarkup };
})();
