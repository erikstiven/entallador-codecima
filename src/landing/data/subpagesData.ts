export type SubpagePath =
  | "/documentation"
  | "/guides"
  | "/blog"
  | "/casos-de-uso"
  | "/glosario"
  | "/support"
  | "/about"
  | "/careers"
  | "/privacy-policy"
  | "/terms-of-service"
  | "/cookie-policy";

export const SUBPAGE_PATHS: readonly SubpagePath[] = [
  "/documentation",
  "/guides",
  "/blog",
  "/casos-de-uso",
  "/glosario",
  "/support",
  "/about",
  "/careers",
  "/privacy-policy",
  "/terms-of-service",
  "/cookie-policy"
] as const;

export const SUBLIMIFYER_WHATSAPP_PHONE = "+5492216911176";
export const SUBLIMIFYER_WHATSAPP_DEFAULT_MESSAGE =
  "Hola! Me interesa conocer más sobre Sublimifyer";
export const SUBLIMIFYER_CALENDLY_URL =
  "https://calendly.com/sublimifyer-ocrw/30min";
export const SUBLIMIFYER_SIGNUP_URL =
  "https://app.sublimifyer.com/auth/signup";
export const SUBLIMIFYER_LOGIN_URL =
  "https://app.sublimifyer.com/auth/login";

export const SUBLIMIFYER_LEGAL_CONTACT = {
  emailLabel: "Email:",
  email: "soporte@sublimifyer.com",
  addressLabel: "Dirección:",
  address: "La Plata, Buenos Aires, Argentina",
  phoneLabel: "Teléfono:",
  phone: "+54 9 221 691 1176"
} as const;

// ---------------------------------------------------------------------------
// 1. /documentation
// ---------------------------------------------------------------------------

export interface DocumentationQuickLink {
  icon: "Video" | "Download" | "Users";
  titleKey: string;
  descKey: string;
  defaultTitle: string;
  defaultDescription: string;
  link: string;
}

export interface DocumentationCategory {
  icon: "Zap" | "Settings" | "Code" | "ChartNoAxesColumnIncreasing";
  titleKey: string;
  descKey: string;
  defaultTitle: string;
  defaultDescription: string;
  articleKeys: [string, string, string];
  defaultArticles: [string, string, string];
}

export const documentationPageData = {
  path: "/documentation" as const,
  heroIcon: "Book" as const,
  defaultBackToHome: "Volver al Inicio",
  defaultTitle: "Documentación",
  defaultSubtitle:
    "Todo lo que necesitas saber para aprovechar al máximo Sublimifyer",
  defaultSearchPlaceholder: "Buscar en la documentación...",
  quickLinksTitle: "Enlaces Rápidos",
  quickLinksSubtitle: "Accede rápidamente a los recursos más populares",
  exploreLabel: "Explorar",
  quickLinks: [
    {
      icon: "Video",
      titleKey: "videoTutorials",
      descKey: "videoTutorialsDesc",
      defaultTitle: "Tutoriales en Video",
      defaultDescription: "Aprende con nuestros tutoriales paso a paso",
      link: "#"
    },
    {
      icon: "Download",
      titleKey: "downloads",
      descKey: "downloadsDesc",
      defaultTitle: "Descargas",
      defaultDescription: "Plantillas, herramientas y recursos adicionales",
      link: "#"
    },
    {
      icon: "Users",
      titleKey: "community",
      descKey: "communityDesc",
      defaultTitle: "Comunidad",
      defaultDescription: "Conecta con otros usuarios y obtén ayuda",
      link: "#"
    }
  ] satisfies DocumentationQuickLink[],
  categoriesTitle: "Guías por Categoría",
  categoriesSubtitle:
    "Encuentra la información que necesitas organizada por temas",
  categories: [
    {
      icon: "Zap",
      titleKey: "gettingStarted",
      descKey: "gettingStartedDesc",
      defaultTitle: "Comenzar",
      defaultDescription:
        "Configura tu cuenta y da tus primeros pasos con Sublimifyer",
      articleKeys: ["setupAccount", "firstProject", "basicConfig"],
      defaultArticles: [
        "Configurar tu cuenta",
        "Tu primer proyecto",
        "Configuración básica"
      ]
    },
    {
      icon: "Settings",
      titleKey: "configuration",
      descKey: "configurationDesc",
      defaultTitle: "Configuración",
      defaultDescription:
        "Personaliza Sublimifyer según las necesidades de tu negocio",
      articleKeys: ["userSettings", "teamManagement", "integrations"],
      defaultArticles: [
        "Configuración de usuario",
        "Gestión de equipos",
        "Integraciones"
      ]
    },
    {
      icon: "Code",
      titleKey: "apiDevelopment",
      descKey: "apiDevelopmentDesc",
      defaultTitle: "API y Desarrollo",
      defaultDescription: "Integra Sublimifyer con tus sistemas existentes",
      articleKeys: ["apiReference", "webhooks", "sdks"],
      defaultArticles: ["Referencia de API", "Webhooks", "SDKs y Librerías"]
    },
    {
      icon: "ChartNoAxesColumnIncreasing",
      titleKey: "analyticsReports",
      descKey: "analyticsReportsDesc",
      defaultTitle: "Análisis y Reportes",
      defaultDescription:
        "Comprende el rendimiento de tu negocio con nuestros reportes",
      articleKeys: ["dashboard", "customReports", "keyMetrics"],
      defaultArticles: [
        "Panel de control",
        "Reportes personalizados",
        "Métricas clave"
      ]
    }
  ] satisfies DocumentationCategory[],
  cta: {
    titleKey: "needHelp",
    descKey: "needHelpDesc",
    buttonKey: "contactSupport",
    defaultTitle: "¿No encuentras lo que buscas?",
    defaultDescription:
      "Nuestro equipo de soporte está aquí para ayudarte. Contáctanos y te responderemos lo antes posible.",
    defaultPrimaryButton: "Contactar Soporte",
    defaultSecondaryButton: "Volver al Inicio",
    secondaryHref: "/",
    whatsappPhone: SUBLIMIFYER_WHATSAPP_PHONE,
    whatsappMessage: SUBLIMIFYER_WHATSAPP_DEFAULT_MESSAGE
  }
};

// ---------------------------------------------------------------------------
// 2. /guides
// ---------------------------------------------------------------------------

export interface FeaturedGuideItem {
  titleKey: string;
  descKey: string;
  categoryKey: string;
  difficultyKey: string;
  defaultTitle: string;
  defaultDescription: string;
  duration: string;
  defaultDifficulty: string;
  defaultCategory: string;
  rating: number;
  author: string;
  featured: boolean;
  link: string;
}

export interface QuickStartGuideItem {
  icon: "Play" | "Download" | "BookOpen";
  titleKey: string;
  descKey: string;
  defaultTitle: string;
  defaultDescription: string;
  type: string;
  duration: string;
}

export interface GuideCategorySubItem {
  titleKey: string;
  defaultTitle: string;
  duration: string;
  difficultyKey: string;
  defaultDifficulty: string;
}

export interface GuideCategoryGroup {
  icon: "Target" | "Zap" | "Lightbulb";
  titleKey: string;
  descKey: string;
  defaultTitle: string;
  defaultDescription: string;
  guides: GuideCategorySubItem[];
}

export const guidesPageData = {
  path: "/guides" as const,
  heroIcon: "BookOpen" as const,
  defaultBackToHome: "Volver al Inicio",
  defaultTitle: "Guías",
  defaultSubtitle:
    "Aprende a dominar Sublimifyer con nuestras guías paso a paso",
  featuredTitle: "Guías Destacadas",
  featuredSubtitle: "Las guías más populares y útiles para comenzar",
  featuredBadge: "Destacado",
  readGuideLabel: "Leer Guía",
  featuredGuides: [
    {
      titleKey: "guide1Title",
      descKey: "guide1Desc",
      categoryKey: "categorySetup",
      difficultyKey: "beginner",
      defaultTitle: "Guía Completa de Configuración Inicial",
      defaultDescription:
        "Aprende a configurar Sublimifyer desde cero y optimizar tu flujo de trabajo",
      duration: "15 min",
      defaultDifficulty: "Principiante",
      defaultCategory: "Configuración",
      rating: 4.9,
      author: "Equipo Sublimifyer",
      featured: true,
      link: "#"
    },
    {
      titleKey: "guide2Title",
      descKey: "guide2Desc",
      categoryKey: "categoryAutomation",
      difficultyKey: "advanced",
      defaultTitle: "Automatización Avanzada de Diseños",
      defaultDescription:
        "Domina las técnicas avanzadas para automatizar completamente tu proceso de diseño",
      duration: "25 min",
      defaultDifficulty: "Avanzado",
      defaultCategory: "Automatización",
      rating: 4.8,
      author: "María González",
      featured: true,
      link: "#"
    }
  ] satisfies FeaturedGuideItem[],
  quickStartTitle: "Inicio Rápido",
  quickStartSubtitle: "Recursos esenciales para comenzar inmediatamente",
  accessLabel: "Acceder",
  quickStartItems: [
    {
      icon: "Play",
      titleKey: "quickVideo",
      descKey: "quickVideoDesc",
      defaultTitle: "Video Tutorial: Primeros Pasos",
      defaultDescription: "Aprende los conceptos básicos en 5 minutos",
      type: "Video",
      duration: "5 min"
    },
    {
      icon: "Download",
      titleKey: "freeTemplates",
      descKey: "freeTemplatesDesc",
      defaultTitle: "Plantillas Gratuitas",
      defaultDescription: "Descarga plantillas listas para usar",
      type: "Descarga",
      duration: "Instantáneo"
    },
    {
      icon: "BookOpen",
      titleKey: "glossary",
      descKey: "glossaryDesc",
      defaultTitle: "Glosario de Términos",
      defaultDescription: "Conoce la terminología de Sublimifyer",
      type: "Referencia",
      duration: "10 min"
    }
  ] satisfies QuickStartGuideItem[],
  categoriesTitle: "Guías por Categoría",
  categoriesSubtitle:
    "Encuentra la guía perfecta según tu nivel y necesidades",
  categories: [
    {
      icon: "Target",
      titleKey: "categoryGettingStarted",
      descKey: "categoryGettingStartedDesc",
      defaultTitle: "Comenzar",
      defaultDescription: "Guías esenciales para nuevos usuarios",
      guides: [
        {
          titleKey: "initialSetup",
          defaultTitle: "Configuración inicial",
          duration: "10 min",
          difficultyKey: "easy",
          defaultDifficulty: "Fácil"
        },
        {
          titleKey: "firstProject",
          defaultTitle: "Tu primer proyecto",
          duration: "15 min",
          difficultyKey: "easy",
          defaultDifficulty: "Fácil"
        },
        {
          titleKey: "basicFunctions",
          defaultTitle: "Funciones básicas",
          duration: "20 min",
          difficultyKey: "easy",
          defaultDifficulty: "Fácil"
        }
      ]
    },
    {
      icon: "Zap",
      titleKey: "categoryAutomation",
      descKey: "categoryAutomationDesc",
      defaultTitle: "Automatización",
      defaultDescription: "Automatiza tu proceso de trabajo",
      guides: [
        {
          titleKey: "workflows",
          defaultTitle: "Flujos de trabajo",
          duration: "30 min",
          difficultyKey: "intermediate",
          defaultDifficulty: "Intermedio"
        },
        {
          titleKey: "customTemplates",
          defaultTitle: "Plantillas personalizadas",
          duration: "25 min",
          difficultyKey: "intermediate",
          defaultDifficulty: "Intermedio"
        },
        {
          titleKey: "batchProcessing",
          defaultTitle: "Procesamiento por lotes",
          duration: "35 min",
          difficultyKey: "advanced",
          defaultDifficulty: "Avanzado"
        }
      ]
    },
    {
      icon: "Lightbulb",
      titleKey: "categoryTips",
      descKey: "categoryTipsDesc",
      defaultTitle: "Consejos y Trucos",
      defaultDescription: "Optimiza tu experiencia con Sublimifyer",
      guides: [
        {
          titleKey: "productivity",
          defaultTitle: "Productividad",
          duration: "15 min",
          difficultyKey: "easy",
          defaultDifficulty: "Fácil"
        },
        {
          titleKey: "improveQuality",
          defaultTitle: "Mejorar calidad",
          duration: "20 min",
          difficultyKey: "intermediate",
          defaultDifficulty: "Intermedio"
        },
        {
          titleKey: "saveTime",
          defaultTitle: "Ahorrar tiempo",
          duration: "18 min",
          difficultyKey: "intermediate",
          defaultDifficulty: "Intermedio"
        }
      ]
    }
  ] satisfies GuideCategoryGroup[],
  cta: {
    titleKey: "needHelp",
    descKey: "needHelpDesc",
    buttonKey: "contactSupport",
    docsButtonKey: "viewDocs",
    defaultTitle: "¿Necesitas ayuda personalizada?",
    defaultDescription:
      "Nuestro equipo de expertos está listo para ayudarte a resolver cualquier duda o problema específico.",
    defaultPrimaryButton: "Contactar Soporte",
    defaultSecondaryButton: "Ver Documentación",
    secondaryHref: "/documentation",
    whatsappPhone: SUBLIMIFYER_WHATSAPP_PHONE,
    whatsappMessage: SUBLIMIFYER_WHATSAPP_DEFAULT_MESSAGE
  }
};

// ---------------------------------------------------------------------------
// 3. /blog
// ---------------------------------------------------------------------------

export interface BlogPostEntry {
  title: string;
  excerpt: string;
  author: string;
  date: string;
  readTime: string;
  category: string;
  link: string;
  image: string;
}

export const blogPageData = {
  path: "/blog" as const,
  logoAlt:
    "Sublimifyer - Software de automatización para talleres de sublimación",
  backToHome: "Volver al Inicio",
  title: "Recursos para talleres de sublimación",
  subtitle:
    "Guías, comparativas y artículos para optimizar la producción de tu taller de sublimación y ropa deportiva.",
  searchPlaceholder: "Buscar artículos...",
  featuredSectionTitle: "Artículo Destacado",
  featuredPost: {
    category: "Guía",
    badge: "Destacado",
    title:
      "¿Qué es un software de gestión para talleres de sublimación y por qué lo necesitás?",
    description:
      "Definimos la categoría: qué es un software de automatización de producción para talleres de sublimación, por qué las herramientas de diseño no alcanzan y qué problemas resuelve.",
    author: "Equipo Sublimifyer",
    date: "Marzo 2026",
    readTime: "10 min",
    link: "/blog/software-gestion-taller-sublimacion",
    image: "/placeholder.jpg",
    imageAlt:
      "Software de gestión para talleres de sublimación - guía completa",
    buttonLabel: "Leer artículo"
  },
  categoriesTitle: "Categorías",
  categories: [
    { name: "Todos", count: 11 },
    { name: "Guía", count: 1 },
    { name: "Productividad", count: 1 },
    { name: "Producción", count: 1 },
    { name: "Comparativa", count: 2 },
    { name: "Mercado", count: 5 },
    { name: "Tutorial", count: 1 }
  ],
  usefulPagesTitle: "Páginas útiles",
  usefulPages: [
    { label: "Casos de uso de Sublimifyer", href: "/casos-de-uso" },
    { label: "Glosario de producción textil", href: "/glosario" },
    { label: "Acerca de Sublimifyer", href: "/about" }
  ],
  readArticleLabel: "Leer artículo",
  posts: [
    {
      title:
        "Sublimifyer vs. AI Nest-Pro (Aimari Nest Pro): sistema completo vs. plug-in de anidado",
      excerpt:
        "AI Nest-Pro solo anida dentro de Adobe Illustrator. Sublimifyer gestiona el taller entero y, con un anidado más inteligente, te ahorra más tela. Comparativa agresiva y honesta.",
      author: "Equipo Sublimifyer",
      date: "Junio 2026",
      readTime: "11 min",
      category: "Comparativa",
      link: "/blog/sublimifyer-vs-aimari-nest-pro",
      image: "/placeholder.jpg"
    },
    {
      title:
        "Por qué Excel y WhatsApp ya no alcanzan para gestionar tu taller de sublimación",
      excerpt:
        "Escenarios concretos donde Excel falla: errores en nombres, desperdicio de tela, pedidos perdidos en WhatsApp y cómo la automatización resuelve cada uno.",
      author: "Equipo Sublimifyer",
      date: "Marzo 2026",
      readTime: "9 min",
      category: "Productividad",
      link: "/blog/excel-whatsapp-gestion-taller",
      image: "/placeholder.jpg"
    },
    {
      title:
        "Cómo el anidado automático de piezas reduce el desperdicio de tela en tu taller",
      excerpt:
        "Qué es el anidado (tizado), por qué el armado manual desperdicia tela, y cómo el anidado automático puede reducir la merma entre un 30% y un 40%.",
      author: "Equipo Sublimifyer",
      date: "Marzo 2026",
      readTime: "8 min",
      category: "Producción",
      link: "/blog/anidado-automatico-piezas-sublimacion",
      image: "/placeholder.jpg"
    },
    {
      title:
        "Sublimifyer vs. otras opciones: qué elegir para tu taller de ropa deportiva",
      excerpt:
        "Comparativa honesta entre Sublimifyer, Excel+WhatsApp, Printavo, DecoNetwork y ERPs genéricos. Quién gana en cada escenario.",
      author: "Equipo Sublimifyer",
      date: "Marzo 2026",
      readTime: "10 min",
      category: "Comparativa",
      link: "/blog/sublimifyer-vs-alternativas-taller",
      image: "/placeholder.jpg"
    },
    {
      title:
        "Software para talleres de sublimación en Argentina, Colombia y México: guía 2026",
      excerpt:
        "El panorama de la automatización para talleres de sublimación en los principales mercados de América Latina. Qué herramientas usan, qué necesitan y qué opciones hay.",
      author: "Equipo Sublimifyer",
      date: "Marzo 2026",
      readTime: "11 min",
      category: "Mercado",
      link: "/blog/software-talleres-sublimacion-latam",
      image: "/placeholder.jpg"
    },
    {
      title:
        "Cómo automatizar la personalización de nombres y números en pedidos de uniformes deportivos",
      excerpt:
        "El paso a paso para dejar de cargar nombres uno por uno. Desde el proceso manual actual hasta la automatización completa con Sublimifyer.",
      author: "Equipo Sublimifyer",
      date: "Marzo 2026",
      readTime: "8 min",
      category: "Tutorial",
      link: "/blog/automatizar-nombres-numeros-uniformes",
      image: "/placeholder.jpg"
    },
    {
      title:
        "Software para talleres de sublimación en México: cómo automatizar la producción de playeras y jerseys",
      excerpt:
        "Guía para talleres en México: cómo producir playeras personalizadas, jerseys deportivos y uniformes escolares a escala, con personalización masiva y anidado automático.",
      author: "Equipo Sublimifyer",
      date: "Junio 2026",
      readTime: "11 min",
      category: "Mercado",
      link: "/blog/software-taller-sublimacion-mexico",
      image: "/placeholder.jpg"
    },
    {
      title:
        "Software para talleres de sublimación en Chile: cómo automatizar la producción de poleras y ropa corporativa",
      excerpt:
        "Guía para talleres en Chile: cómo producir poleras personalizadas, polerones y ropa corporativa sin errores y a mayor volumen.",
      author: "Equipo Sublimifyer",
      date: "Junio 2026",
      readTime: "10 min",
      category: "Mercado",
      link: "/blog/software-taller-sublimacion-chile",
      image: "/placeholder.jpg"
    },
    {
      title:
        "Software para talleres de sublimación en Perú: cómo producir polos personalizados a escala",
      excerpt:
        "Guía para talleres en Perú: cómo producir polos personalizados, polos deportivos y uniformes a gran volumen, desde Gamarra hasta todo el país.",
      author: "Equipo Sublimifyer",
      date: "Junio 2026",
      readTime: "10 min",
      category: "Mercado",
      link: "/blog/software-taller-sublimacion-peru",
      image: "/placeholder.jpg"
    },
    {
      title:
        "Software para talleres de sublimación en Colombia: cómo automatizar la producción de camisetas y uniformes",
      excerpt:
        "Guía para talleres en Colombia: cómo producir camisetas personalizadas, uniformes deportivos y ropa corporativa sin errores y a mayor escala.",
      author: "Equipo Sublimifyer",
      date: "Junio 2026",
      readTime: "10 min",
      category: "Mercado",
      link: "/blog/software-taller-sublimacion-colombia",
      image: "/placeholder.jpg"
    }
  ] satisfies BlogPostEntry[],
  cta: {
    title: "¿Querés automatizar tu taller?",
    description:
      "Probá Sublimifyer gratis o agendá una demo para ver cómo funciona con tus pedidos reales.",
    primaryButton: "Probá Sublimifyer",
    primaryUrl: SUBLIMIFYER_SIGNUP_URL,
    secondaryButton: "Agendá una Demo",
    secondaryUrl: SUBLIMIFYER_CALENDLY_URL
  }
};

// ---------------------------------------------------------------------------
// 4. /casos-de-uso
// ---------------------------------------------------------------------------

export interface UseCaseItem {
  icon: "ShieldCheck" | "Factory" | "TrendingUp" | "Palette";
  badge: string;
  title: string;
  description: string;
  pains: string[];
  resolutions: string[];
  relatedLinks: Array<{ label: string; href: string }>;
}

export const casosDeUsoPageData = {
  path: "/casos-de-uso" as const,
  backToHome: "Volver al Inicio",
  badge: "Casos de uso reales",
  title: "Casos de Uso de Sublimifyer",
  subtitle:
    "Descubri como talleres de sublimacion y productores de indumentaria deportiva en Latinoamerica usan Sublimifyer para resolver problemas concretos de produccion.",
  problemHeading: "El problema",
  solutionHeading: "Con Sublimifyer",
  learnMoreLabel: "Aprende mas:",
  cases: [
    {
      icon: "ShieldCheck",
      badge: "Uniformes deportivos",
      title: "Taller de uniformes deportivos para clubes y colegios",
      description:
        "Talleres que reciben pedidos de 20 a 50 uniformes por club o colegio, cada uno con nombres y numeros diferentes.",
      pains: [
        "Recibis pedidos de 20-50 uniformes por club, cada uno con nombre y numero distinto. Los tipeas uno por uno.",
        "Un error en un nombre significa reimprimir la prenda entera, perdiendo tiempo y material.",
        "Los hilos de WhatsApp con cada cliente se mezclan y se pierden. No sabes en que estado esta cada pedido."
      ],
      resolutions: [
        "Carga masiva de nombres y numeros desde una planilla. Sin tipeo manual, sin errores de transcripcion.",
        "Generacion automatica de piezas personalizadas listas para imprimir en segundos.",
        "Seguimiento centralizado de cada pedido: sabes que se entrego, que esta en produccion y que falta."
      ],
      relatedLinks: [
        {
          label: "Como funciona la personalizacion masiva",
          href: "/glosario"
        },
        {
          label: "Blog: Software de gestion para talleres de sublimacion",
          href: "/blog/software-gestion-taller-sublimacion"
        }
      ]
    },
    {
      icon: "Factory",
      badge: "Produccion al por mayor",
      title: "Productor de indumentaria deportiva al por mayor",
      description:
        "Talleres que producen 500 o más prendas por mes (sin límite máximo) y necesitan escalar sin que los costos se disparen.",
      pains: [
        "El anidado manual desperdicia entre un 20% y un 30% mas de tela de la necesaria.",
        "Cuando sube el volumen, la produccion se convierte en un cuello de botella. Todo se frena.",
        "Escalar significa contratar mas gente, y con eso vienen mas errores y mas costos fijos."
      ],
      resolutions: [
        "El anidado automatico reduce el desperdicio de tela entre un 30% y un 40%.",
        "La generacion automatica de hojas de sublimacion elimina horas de armado manual.",
        "Escala tu produccion sin sumar personal proporcionalmente. Mas prendas, mismo equipo."
      ],
      relatedLinks: [
        { label: "Que es el anidado automatico", href: "/glosario" },
        {
          label: "Blog: Software de gestion para talleres de sublimacion",
          href: "/blog/software-gestion-taller-sublimacion"
        }
      ]
    },
    {
      icon: "TrendingUp",
      badge: "Escalar sin contratar",
      title: "Taller que quiere escalar sin contratar mas personal",
      description:
        "Talleres donde el dueno o una persona clave es el cuello de botella de toda la produccion.",
      pains: [
        "La capacidad del taller esta limitada por procesos manuales: armado de hojas, carga de nombres, control de calidad.",
        "Cada nuevo pedido significa mas trabajo manual. El crecimiento se vuelve lineal y agotador.",
        "El dueno o la persona clave termina haciendo todo. Si no esta, la produccion se para."
      ],
      resolutions: [
        "Automatiza las tareas repetitivas: generacion de hojas, personalizacion, anidado.",
        "Estandariza los procesos para que cualquier persona del equipo pueda seguirlos sin depender de vos.",
        "Crece en produccion sin multiplicar las horas de trabajo manual."
      ],
      relatedLinks: [
        { label: "Que es el flujo de produccion textil", href: "/glosario" },
        {
          label: "Blog: Software de gestion para talleres de sublimacion",
          href: "/blog/software-gestion-taller-sublimacion"
        }
      ]
    },
    {
      icon: "Palette",
      badge: "Disenador + produccion",
      title: "Disenador que tambien gestiona la produccion",
      description:
        "Disenadores que pierden la mayor parte de su tiempo en tareas de produccion en lugar de crear.",
      pains: [
        "Pasas el 60% de tu tiempo armando hojas de sublimacion, cargando nombres y preparando archivos.",
        "No podes tomar mas clientes porque el tiempo de produccion se come el tiempo de diseno.",
        "Tu talento creativo queda relegado por tareas operativas que podrian estar automatizadas."
      ],
      resolutions: [
        "Libera tu tiempo de diseno automatizando toda la preparacion de archivos de produccion.",
        "Toma mas clientes sin que la produccion se convierta en un problema.",
        "Concentrate en lo creativo. El sistema se encarga de la generacion de archivos, el anidado y la personalizacion."
      ],
      relatedLinks: [
        { label: "Que es una hoja de sublimacion", href: "/glosario" },
        {
          label: "Blog: Software de gestion para talleres de sublimacion",
          href: "/blog/software-gestion-taller-sublimacion"
        }
      ]
    }
  ] satisfies UseCaseItem[],
  summary: {
    title: "Todos estos problemas tienen algo en comun",
    description:
      "Son tareas manuales y repetitivas que consumen tiempo, generan errores y limitan el crecimiento de tu taller. Sublimifyer las automatiza para que puedas producir mas, con menos errores y sin sumar personal.",
    links: [
      { label: "Glosario de produccion", href: "/glosario" },
      { label: "Leer el blog", href: "/blog" }
    ]
  },
  cta: {
    title: "Tu taller se parece a alguno de estos casos?",
    description:
      "Contanos como es tu produccion y te mostramos como Sublimifyer puede ayudarte. Sin compromiso.",
    primaryButton: "Hablar por WhatsApp",
    whatsappPhone: SUBLIMIFYER_WHATSAPP_PHONE,
    whatsappMessage:
      "Hola! Vi los casos de uso en la web y me gustaria saber como Sublimifyer puede ayudarme en mi taller.",
    secondaryButton: "Ver todas las funcionalidades",
    secondaryHref: "/"
  }
};

// ---------------------------------------------------------------------------
// 5. /glosario
// ---------------------------------------------------------------------------

export interface GlossaryTermItem {
  id: string;
  letter: string;
  term: string;
  definition: string;
  relatedLinks: Array<{ label: string; href: string }>;
}

const rawGlossaryTerms: Array<{
  term: string;
  definition: string;
  relatedLinks: Array<{ label: string; href: string }>;
}> = [
  {
    term: "Anidado / Tizado de piezas",
    definition:
      "La disposicion optimizada de las piezas de molderia sobre la hoja de sublimacion para aprovechar al maximo la tela y minimizar el desperdicio. En el anidado manual, las piezas se ubican a ojo o con criterio fijo. En el anidado automatico, un algoritmo calcula la mejor disposicion posible. Los talleres que pasan de anidado manual a automatico pueden reducir el desperdicio de tela entre un 30% y un 40%.",
    relatedLinks: [
      { label: "Caso de uso: Produccion al por mayor", href: "/casos-de-uso" },
      {
        label: "Blog: Software de gestion para talleres",
        href: "/blog/software-gestion-taller-sublimacion"
      }
    ]
  },
  {
    term: "Flujo de produccion textil (en sublimacion)",
    definition:
      "La secuencia completa desde que se recibe un pedido hasta que se entrega el producto terminado: recepcion del pedido, diseno o seleccion de molderia, personalizacion, generacion de hojas de sublimacion, impresion, transferencia, corte, confeccion y entrega. Sublimifyer automatiza las etapas intermedias: personalizacion, generacion de hojas y anidado.",
    relatedLinks: [
      { label: "Caso de uso: Escalar sin contratar", href: "/casos-de-uso" }
    ]
  },
  {
    term: "Hoja de sublimacion",
    definition:
      "El archivo o plancha que contiene todas las piezas de un pedido dispuestas para ser impresas por sublimacion. Cada hoja se envia a la impresora y luego se transfiere al tejido mediante calor y presion. La generacion manual de hojas de sublimacion es uno de los procesos mas lentos en un taller; Sublimifyer las genera automaticamente a partir del pedido y las molderias.",
    relatedLinks: [
      {
        label: "Caso de uso: Disenador que gestiona produccion",
        href: "/casos-de-uso"
      },
      {
        label: "Blog: Software de gestion para talleres",
        href: "/blog/software-gestion-taller-sublimacion"
      }
    ]
  },
  {
    term: "Merma de tela / Desperdicio",
    definition:
      "La tela que se pierde entre las piezas al momento de disponer el layout para impresion o corte. Una merma alta significa que se esta desperdiciando material y dinero. El anidado automatico reduce la merma al calcular la disposicion que menos tela desperdicia.",
    relatedLinks: [
      { label: "Caso de uso: Produccion al por mayor", href: "/casos-de-uso" }
    ]
  },
  {
    term: "Molderia / Patron",
    definition:
      "Las piezas que componen una prenda (frente, espalda, mangas, etc.) en formato digital. En Sublimifyer, las molderias son archivos reutilizables que se combinan con datos de personalizacion para generar los archivos listos para impresion.",
    relatedLinks: [
      { label: "Caso de uso: Uniformes deportivos", href: "/casos-de-uso" }
    ]
  },
  {
    term: "Personalizacion masiva",
    definition:
      "El proceso de aplicar nombres, numeros, talles y otros datos personalizados a multiples prendas de un mismo pedido. En un pedido de 50 uniformes, cada prenda lleva un nombre y numero diferente. La personalizacion masiva automatiza este proceso: se carga una lista con los datos y el sistema genera todos los archivos personalizados sin intervencion manual.",
    relatedLinks: [
      { label: "Caso de uso: Uniformes deportivos", href: "/casos-de-uso" },
      {
        label: "Blog: Software de gestion para talleres",
        href: "/blog/software-gestion-taller-sublimacion"
      }
    ]
  },
  {
    term: "Software RIP (y por que no es lo mismo que Sublimifyer)",
    definition:
      "Un software RIP (Raster Image Processor) como Wasatch SoftRIP o SAi Flexi controla la impresora de sublimacion: gestiona colores, resolucion y el envio del archivo a la maquina. Sublimifyer no es un software RIP. Trabaja antes: prepara los archivos (hojas con piezas anidadas y personalizadas) que despues se envian al RIP para imprimir. Son herramientas complementarias.",
    relatedLinks: [
      {
        label: "Blog: Software de gestion para talleres",
        href: "/blog/software-gestion-taller-sublimacion"
      }
    ]
  },
  {
    term: "Como se dice prenda personalizada en cada pais (equivalencias regionales)",
    definition:
      "La misma prenda recibe nombres distintos segun el pais de Latinoamerica, y eso cambia como cada taller busca software y proveedores. Equivalencias mas comunes: en Mexico y Guatemala se dice playera (y jersey para las camisetas deportivas); en Peru, polo; en Chile y Bolivia, polera; en Argentina y Uruguay, remera; en Venezuela, franela; en Colombia y gran parte de la region, camiseta. Lo mismo ocurre con la categoria general: indumentaria personalizada, ropa personalizada, ropa deportiva personalizada, uniformes personalizados, uniformes deportivos, ropa corporativa y merchandising empresarial describen el mismo tipo de produccion. Y hay terminos tecnicos que funcionan en todos los paises: sublimacion, DTF, estampado textil, bordado computarizado y confeccion deportiva. Sublimifyer sirve a talleres que producen cualquiera de estas prendas, sin importar como las llamen localmente.",
    relatedLinks: [
      {
        label: "Blog: Software para talleres en LATAM",
        href: "/blog/software-talleres-sublimacion-latam"
      },
      { label: "Caso de uso: Uniformes deportivos", href: "/casos-de-uso" }
    ]
  }
];

export const glosarioPageData = {
  path: "/glosario" as const,
  backToHome: "Volver al Inicio",
  badge: "Referencia rapida",
  title: "Glosario de produccion para talleres de sublimacion",
  subtitle:
    "Los terminos clave que necesitas conocer para entender y optimizar tu flujo de produccion textil con sublimacion.",
  relatedLabel: "Relacionado:",
  terms: rawGlossaryTerms.map((item, idx) => ({
    ...item,
    letter: String.fromCharCode(65 + idx),
    id: item.term.toLowerCase().replace(/[\s/()]/g, "-")
  })) satisfies GlossaryTermItem[],
  summary: {
    title: "Queres ver estos conceptos en accion?",
    description:
      "Mira como talleres reales aplican estos conceptos con Sublimifyer para resolver sus problemas de produccion.",
    links: [
      { label: "Ver casos de uso", href: "/casos-de-uso" },
      { label: "Leer el blog", href: "/blog" }
    ]
  },
  cta: {
    title: "Tenes dudas sobre como aplicar esto en tu taller?",
    description:
      "Escribinos y te explicamos como Sublimifyer puede integrarse en tu flujo de produccion actual. Sin compromiso.",
    primaryButton: "Hablar por WhatsApp",
    whatsappPhone: SUBLIMIFYER_WHATSAPP_PHONE,
    whatsappMessage:
      "Hola! Estuve leyendo el glosario en la web y tengo algunas dudas sobre como Sublimifyer puede ayudarme.",
    secondaryButton: "Conocer Sublimifyer",
    secondaryHref: "/"
  }
};

// ---------------------------------------------------------------------------
// 6. /support
// ---------------------------------------------------------------------------

export interface SupportContactOption {
  icon: "MessageCircle" | "Mail" | "Phone";
  titleKey: string;
  descKey: string;
  availabilityKey: string;
  responseKey: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultAvailability: string;
  defaultResponseTime: string;
  link: string;
}

export interface SupportFaqCategory {
  titleKey: string;
  defaultTitle: string;
  questions: Array<{
    questionKey: string;
    answerKey: string;
    defaultQuestion: string;
    defaultAnswer: string;
  }>;
}

export interface SupportResourceItem {
  icon: "FileText" | "Video" | "Users" | "Zap";
  titleKey: string;
  descKey: string;
  defaultTitle: string;
  defaultDescription: string;
  link: string;
}

export const supportPageData = {
  path: "/support" as const,
  heroIcon: "CircleHelp" as const,
  defaultBackToHome: "Volver al Inicio",
  defaultTitle: "Centro de Soporte",
  defaultSubtitle:
    "Estamos aquí para ayudarte. Encuentra respuestas rápidas o contacta con nuestro equipo",
  defaultSearchPlaceholder: "Buscar ayuda...",
  defaultContactTitle: "¿Cómo podemos ayudarte?",
  defaultContactSubtitle:
    "Elige la opción que mejor se adapte a tu necesidad",
  defaultContactNow: "Contactar Ahora",
  contactOptions: [
    {
      icon: "MessageCircle",
      titleKey: "option1Title",
      descKey: "option1Desc",
      availabilityKey: "option1Availability",
      responseKey: "option1Response",
      defaultTitle: "Chat en Vivo",
      defaultDescription:
        "Habla directamente con nuestro equipo de soporte",
      defaultAvailability: "Disponible 24/7",
      defaultResponseTime: "Respuesta inmediata",
      link: "#"
    },
    {
      icon: "Mail",
      titleKey: "option2Title",
      descKey: "option2Desc",
      availabilityKey: "option2Availability",
      responseKey: "option2Response",
      defaultTitle: "Email de Soporte",
      defaultDescription:
        "Envíanos un email detallado y te responderemos pronto",
      defaultAvailability: "Lunes a Viernes 9-18",
      defaultResponseTime: "Respuesta en 2-4 horas",
      link: "#"
    },
    {
      icon: "Phone",
      titleKey: "option3Title",
      descKey: "option3Desc",
      availabilityKey: "option3Availability",
      responseKey: "option3Response",
      defaultTitle: "Llamada Telefónica",
      defaultDescription:
        "Programa una llamada con nuestros especialistas",
      defaultAvailability: "Lunes a Viernes 9-17",
      defaultResponseTime: "Agenda disponible",
      link: "#"
    }
  ] satisfies SupportContactOption[],
  defaultFaqTitle: "Preguntas Frecuentes",
  defaultFaqSubtitle: "Encuentra respuestas a las preguntas más comunes",
  faqCategories: [
    {
      titleKey: "faqCategory1",
      defaultTitle: "Configuración y Cuenta",
      questions: [
        {
          questionKey: "faq1Q",
          answerKey: "faq1A",
          defaultQuestion: "¿Cómo configuro mi cuenta por primera vez?",
          defaultAnswer:
            "Puedes configurar tu cuenta siguiendo nuestro tutorial paso a paso en la sección de guías."
        },
        {
          questionKey: "faq2Q",
          answerKey: "faq2A",
          defaultQuestion: "¿Cómo cambio mi información de facturación?",
          defaultAnswer:
            "Ve a Configuración > Facturación para actualizar tu información de pago."
        },
        {
          questionKey: "faq3Q",
          answerKey: "faq3A",
          defaultQuestion: "¿Cómo invito a miembros de mi equipo?",
          defaultAnswer:
            "Usa la función 'Invitar Miembros' en la sección de Equipo para agregar colaboradores."
        }
      ]
    },
    {
      titleKey: "faqCategory2",
      defaultTitle: "Funcionalidades",
      questions: [
        {
          questionKey: "faq4Q",
          answerKey: "faq4A",
          defaultQuestion: "¿Cómo automatizo mis diseños?",
          defaultAnswer:
            "Utiliza nuestras plantillas automatizadas y configura reglas personalizadas en la sección de Automatización."
        },
        {
          questionKey: "faq5Q",
          answerKey: "faq5A",
          defaultQuestion:
            "¿Puedo integrar Sublimifyer con mi tienda online?",
          defaultAnswer:
            "Sí, ofrecemos integraciones con las principales plataformas de e-commerce."
        },
        {
          questionKey: "faq6Q",
          answerKey: "faq6A",
          defaultQuestion: "¿Cómo exporto mis diseños?",
          defaultAnswer:
            "Puedes exportar en múltiples formatos desde el menú de cada proyecto."
        }
      ]
    },
    {
      titleKey: "faqCategory3",
      defaultTitle: "Facturación y Planes",
      questions: [
        {
          questionKey: "faq7Q",
          answerKey: "faq7A",
          defaultQuestion: "¿Cómo cambio mi plan de suscripción?",
          defaultAnswer:
            "Ve a Configuración > Planes para cambiar tu suscripción en cualquier momento."
        },
        {
          questionKey: "faq8Q",
          answerKey: "faq8A",
          defaultQuestion: "¿Ofrecen descuentos para equipos grandes?",
          defaultAnswer:
            "Sí, tenemos descuentos especiales para equipos de 10+ usuarios. Contáctanos para más información."
        },
        {
          questionKey: "faq9Q",
          answerKey: "faq9A",
          defaultQuestion: "¿Puedo cancelar mi suscripción?",
          defaultAnswer:
            "Sí, puedes cancelar en cualquier momento desde tu panel de configuración."
        }
      ]
    }
  ] satisfies SupportFaqCategory[],
  defaultResourcesTitle: "Recursos Útiles",
  defaultResourcesSubtitle:
    "Explora nuestros recursos para obtener la ayuda que necesitas",
  exploreLabel: "Explorar",
  resources: [
    {
      icon: "FileText",
      titleKey: "resource1",
      descKey: "resource1Desc",
      defaultTitle: "Documentación Completa",
      defaultDescription: "Guías detalladas y referencias técnicas",
      link: "/documentation"
    },
    {
      icon: "Video",
      titleKey: "resource2",
      descKey: "resource2Desc",
      defaultTitle: "Tutoriales en Video",
      defaultDescription: "Aprende con nuestros tutoriales paso a paso",
      link: "/guides"
    },
    {
      icon: "Users",
      titleKey: "resource3",
      descKey: "resource3Desc",
      defaultTitle: "Comunidad",
      defaultDescription: "Conecta con otros usuarios y obtén ayuda",
      link: "#"
    },
    {
      icon: "Zap",
      titleKey: "resource4",
      descKey: "resource4Desc",
      defaultTitle: "Estado del Sistema",
      defaultDescription: "Monitorea el estado de nuestros servicios",
      link: "#"
    }
  ] satisfies SupportResourceItem[],
  contactForm: {
    defaultTitle: "Envíanos un Mensaje",
    defaultSubtitle:
      "¿No encontraste lo que buscabas? Envíanos un mensaje y te responderemos pronto.",
    defaultNameLabel: "Nombre",
    defaultNamePlaceholder: "Tu nombre",
    defaultEmailLabel: "Email",
    defaultEmailPlaceholder: "tu@email.com",
    defaultSubjectLabel: "Asunto",
    defaultSubjectPlaceholder: "¿En qué podemos ayudarte?",
    defaultMessageLabel: "Mensaje",
    defaultMessagePlaceholder:
      "Describe tu consulta o problema en detalle...",
    defaultSubmitLabel: "Enviar Mensaje"
  }
};

// ---------------------------------------------------------------------------
// 7. /about, /careers, /privacy-policy, /terms-of-service, /cookie-policy
// ---------------------------------------------------------------------------

export const aboutPageData = {
  path: "/about" as const,
  valueIcons: ["Target", "Users", "Zap", "Heart"] as const,
  primaryCtaUrl: SUBLIMIFYER_SIGNUP_URL,
  secondaryCtaUrl: SUBLIMIFYER_CALENDLY_URL
};

export const careersPageData = {
  path: "/careers" as const,
  benefitIcons: [
    "Heart",
    "Zap",
    "Target",
    "Users",
    "Briefcase",
    "Clock"
  ] as const
};

export const privacyPolicyPageData = {
  path: "/privacy-policy" as const,
  heroIcon: "Shield" as const,
  contact: SUBLIMIFYER_LEGAL_CONTACT
};

export const termsOfServicePageData = {
  path: "/terms-of-service" as const,
  heroIcon: "FileText" as const,
  contact: SUBLIMIFYER_LEGAL_CONTACT
};

export const cookiePolicyPageData = {
  path: "/cookie-policy" as const,
  heroIcon: "Cookie" as const,
  contact: SUBLIMIFYER_LEGAL_CONTACT
};
