import {
  esTranslations,
  type LandingBenefitItem,
  type LandingPlanTier,
  type LandingTranslations,
} from './es';

export type { LandingBenefitItem, LandingPlanTier, LandingTranslations };
export { esTranslations };

export type LanguageCode = 'es' | 'en' | 'pt';
export type Language = LanguageCode;

export const SUPPORTED_LANGUAGES: readonly LanguageCode[] = ['es', 'en', 'pt'] as const;

export const enTranslations: LandingTranslations = {
  ...esTranslations,
  nav: {
    features: "Features",
    howItWorks: "How to Start",
    pricing: "Pricing",
    diagnosis: "Your Workshop",
    solutions: "Solutions",
    benefits: "Benefits",
    demo: "The app",
    calculator: "Calculate your savings",
    faq: "FAQ",
    login: "Log in",
    getStarted: "Get Started"
  },
  hero: {
    badge: "For custom apparel manufacturers",
    title: "Produce more. Fewer errors. Less waste.",
    titleLine1: "Your entire production process,",
    titleLine2: "automated in one place.",
    subtitle: "The system for sublimation and sportswear workshops that reduces errors, fabric waste and hours of work.",
    subtitle2: "Automate the preparation of patterns and print sheets to produce more with the same equipment.",
    demoNoCommitment: "Guided demo, no commitment.",
    getStarted: "Get Started",
    bookDemo: "Book a Demo",
    contactWhatsApp: "Contact via WhatsApp",
    feature1: "Patterns ready to use and customize in minutes",
    feature2: "Automatically generate sublimation sheets ready to print",
    feature3: "Load names, numbers and sizes in bulk with no manual errors",
    cardSublimation: "Sublimation",
    cardDtf: "DTF",
    cardLaserCut: "Laser cutting",
    cardOrderTag: "Order",
    cardOrderStatus: "In production",
    cardOrderClient: "Progreso Athletic Club",
    cardOrderItem: "Striped jersey · Sublimation",
    cardOrderQtyLabel: "Quantity",
    cardOrderQtyValue: "24 pcs",
    cardOrderDueLabel: "Due",
    cardOrderDueValue: "Aug 22",
    cardUsageTag: "Usage",
    cardUsageLabel: "Paper · 7 days",
    cardUsageValue: "18.4 m",
    cardUsagePeriod: "this week",
    cardPatternTag: "Pattern",
    cardPatternPiece: "FRONT",
    cardPatternSize: "M",
    cardTrackTag: "Tracking",
    cardTrackStep1: "Received",
    cardTrackStep2: "Design",
    cardTrackStep3: "Printing",
    cardTrackStep4: "Sewing",
    cardTrackStep5: "Delivery",
    cardMixTag: "Production",
    cardMixLabel: "This month's mix",
    cardMixTotalLabel: "orders",
    cardMix1: "Sublimation",
    cardMix2: "DTF",
    cardMix3: "Cutting",
    cardProductTag: "Product",
    cardProductName: "Official shorts",
    cardProductParts: "Left + right"
  },
  logos: {
    trustedBy: "From design to print",
    workflowTitle: "Your workflow in CimaTex"
  },
  features: {
    badge: "Features",
    title: "Fewer errors. Less waste. More production.",
    subtitle: "CimaTex eliminates repetitive manual tasks in pattern assembly, sublimation sheets and garment customization, reducing errors and downtime in production.",
    feature1: {
      title: "Catalogs of Patterns, Designs & Fonts",
      description: "Access professional patterns ready to use and avoid recreating them from scratch on every order. Save hours of assembly and keep consistency across all your garments."
    },
    feature2: {
      title: "Complete hundreds of orders in one click",
      description: "Automatically generate each client's files with their names, numbers and sizes without editing one by one."
    },
    feature3: {
      title: "Less fabric waste",
      description: "Reduce fabric waste by automatically optimizing the layout of pieces on each sublimation sheet."
    },
    feature4: {
      title: "Tracking & Management",
      description: "Centralize all your orders in one place and avoid information loss between design, production and delivery."
    },
    feature5: {
      title: "Precise customization",
      description: "Place logos, names and numbers with precision and avoid positioning errors in printing."
    },
    feature6: {
      title: "End-to-End Production Workflow Management",
      description: "Track every order from design to delivery in a single streamlined dashboard, with metrics, and many more features to come."
    }
  },
  howItWorks: {
    badge: "How to Start",
    title: "Simple Process, Powerful Results",
    subtitle: "Get started in minutes and see the difference our platform can make for your business.",
    step1: {
      title: "Initial Guidance/Consultation",
      description: "Get in touch with us and we help you adapt your system, integrate your patterns and generate your first sublimation sheets."
    },
    step2: {
      title: "Complete Sales Automation",
      description: "Automate your entire sales process from design to delivery. Generate more orders with less effort and significantly increase your revenue."
    },
    step3: {
      title: "Optimization and Time Savings",
      description: "Significantly reduce time spent on manual assembly and minimize costly production errors."
    }
  },
  diagnosis: {
    title: "Is this happening in your workshop?",
    subtitle: "Check these common issues. If you identify with several, the hidden cost of your operation may be higher than you think.",
    closing: "If you answered 'yes' to more than one, your operation has room for improvement.",
    question1: {
      question: "Are you still assembling sublimation sheets manually?",
      description: "Every sheet is laid out piece by piece. Hours per order, no scaling.",
      impact: "Labour hours per order, bottlenecks before printing, delays when volume spikes.",
      solution: "The system generates sublimation sheets from the order and patterns, with optimized layout, ready to print."
    },
    question2: {
      question: "Do you waste time entering names and numbers one by one?",
      description: "Each name and number is typed or pasted onto each garment. For team or event orders, that's hundreds of entries.",
      impact: "Huge time per order, typos, rework when something goes wrong.",
      solution: "Bulk upload from a spreadsheet or list: the system assigns name, number and size to each garment and generates files with no manual input."
    },
    question3: {
      question: "Do you make mistakes with sizes, names or player details?",
      description: "Data travels via WhatsApp, Excel or paper. It gets copied wrong, a row is missed or a size is mixed up.",
      impact: "Wrong personalization, complaints, reprints and loss of customer trust.",
      solution: "Single flow with data tied to the order: the system uses the correct information per garment and cuts transcription errors."
    },
    question4: {
      question: "Do you have to redo orders because of production errors?",
      description: "Mistakes in design, size or personalization are caught after printing or cutting. Then you have to redo.",
      impact: "Wasted fabric, time and labour; delayed deliveries and unhappy customers.",
      solution: "Controlled flow from order to final file: fewer manual steps, fewer failure points, and review before printing."
    },
    question5: {
      question: "Are you wasting more fabric than you should?",
      description: "Pieces are placed by eye or with a fixed layout. Extra fabric between pieces or over-cutting.",
      impact: "Extra fabric cost, lower yield per sheet, margin eaten by waste.",
      solution: "Automatic nesting: the system arranges pieces to use fabric better and reduce leftover."
    },
    question6: {
      question: "Do you rebuild patterns from scratch for similar orders?",
      description: "Every 'new' order forces you to reassemble the pattern or layout even when it's almost the same as a previous one.",
      impact: "Hours of repetitive design work, delivery delays, little standardization.",
      solution: "Reusable pattern catalogs: pick the base, adjust what's needed and generate the order without starting from zero."
    },
    question7: {
      question: "Is order information scattered across WhatsApp, Excel and designers?",
      description: "Orders in WhatsApp, lists in Excel, files on the designer's computer. No one has the full picture.",
      impact: "Lost orders, duplicated work, mistakes from outdated information.",
      solution: "Orders in one place: same record for sales, production and delivery, with history and tracking."
    },
    question8: {
      question: "When volume goes up, does chaos go up too?",
      description: "More orders mean the same manual process repeated more. More errors, more delays, more stress.",
      impact: "Can't scale without hiring more or working late; bottlenecks around key people.",
      solution: "Automation that scales with volume: same flow for 10 or 500 garments, without multiplying manual hours at the same rate."
    },
    question9: {
      question: "Do you depend too much on one person who 'knows how everything works'?",
      description: "One or a few people hold all the knowledge. If they're absent or leave, the operation stalls.",
      impact: "Operational risk, difficulty adding staff, overload on those people.",
      solution: "Standardized processes in the system: the 'how we do it' lives in flows and templates anyone can follow."
    },
    question10: {
      question: "Is it hard to scale without hiring more people?",
      description: "More orders mean more hands on assembly, data entry and checking. Growth doesn't turn into margin.",
      impact: "Hiring just for repetitive tasks or turning down orders for lack of capacity.",
      solution: "The system does the repetitive work (sheets, data, nesting); the team focuses on design, quality and customers—you can grow without adding people at the same rate."
    }
  },
  testimonials: {
    badge: "Testimonials",
    title: "Trusted by custom apparel workshops",
    subtitle: "See how sublimation and sportswear businesses are producing more with fewer errors and less waste.",
    testimonial1: {
      quote: "We stopped assembling sublimation sheets by hand. Orders that took us hours now go out in minutes, and we make far fewer mistakes.",
      author: "Sublimation workshop",
      role: "Sportswear & sublimation, Argentina"
    },
    testimonial2: {
      quote: "Data used to fly around on WhatsApp and Excel. Now everything is in one place—we know exactly what's in each order and we don't miss names or sizes anymore.",
      author: "Custom apparel business",
      role: "Team uniforms & events"
    },
    testimonial3: {
      quote: "Support was there from day one. They helped us load our patterns and get our first sheets out. We were up and running in no time.",
      author: "Apparel workshop",
      role: "Sublimation and embroidery"
    },
    testimonial4: {
      quote: "We were redoing orders all the time because of layout or personalization errors. With CimaTex we review before printing and the reprints dropped a lot.",
      author: "Clothing manufacturer",
      role: "Bulk customization"
    },
    testimonial5: {
      quote: "The nesting optimization really cut our fabric waste. We're using more of each sheet and spending less on material.",
      author: "Textile workshop",
      role: "Sublimation printing"
    },
    testimonial6: {
      quote: "When volume went up we used to drown in manual work. Now we handle more orders without adding people. The system does the repetitive part.",
      author: "Sportswear producer",
      role: "Custom team wear"
    }
  },
  pricing: {
    badge: "Pricing",
    title: "Choose based on how much you produce.",
    subtitle: "Every plan includes full access to CimaTex. The price depends on your monthly production volume.",
    logicIntro: "You pay based on how much you produce. The higher your volume, the greater the system's impact on your operation.",
    roiPhrase: "A single production error can cost more than a month of CimaTex.",
    roiReminderTitle: "Strategic ROI Reminder",
    roiReminderLine1: "A single production error can cost more than an entire month of the system.",
    roiReminderLine2: "When you reduce manual work, prevent reprints, and optimize fabric usage, the platform often pays for itself in avoided mistakes alone.",
    month: "/ month",
    founderPriceLabel: "Founder Price",
    mostPopular: "Most chosen",
    sharedFeaturesTitle: "Every plan includes full access",
    accessNote: "Full access to CimaTex",
    currencyLabel: "Currency",
    currencyArs: "Pesos (ARS)",
    currencyUsd: "Dollars (USD)",
    sharedFeatures: [
      "Onboarding",
      "Support",
      "Production automation",
      "Production file generation",
      "Order management",
      "Multiple users"
    ],
    starter: {
      name: "Initial",
      volume: "Up to 1,000 garments/month",
      originalPrice: "119k ARS",
      price: "99k ARS",
      priceUsd: "69 USD",
      originalPriceUsd: "79 USD",
      description: "For small workshops starting to automate and eliminate manual errors. If you're still preparing sheets manually, adjusting names one by one, or fixing production mistakes, this plan helps you stabilize your workflow and save hours every week.",
      limits: "Up to 1,000 garments per month. Ideal for workshops beginning their automation journey.",
      cta: "Get Started",
      features: [
        "Full system access",
        "Ready-to-use professional pattern catalogs",
        "Automatic sublimation sheet generation",
        "Bulk name and number personalization",
        "Automatic piece layout optimization",
        "Centralized order management",
        "Standard email support",
        "Guided onboarding session",
        "Up to 1,000 garments per month"
      ]
    },
    professional: {
      name: "Professional",
      volume: "Up to 2,500 garments/month",
      originalPrice: "229k ARS",
      price: "199k ARS",
      priceUsd: "139 USD",
      originalPriceUsd: "159 USD",
      description: "For workshops with steady production that need efficiency and reduced waste. At this level, every production improvement directly impacts margins. This plan helps you reduce material waste, improve operational flow, and scale without increasing staff.",
      limits: "Up to 2,500 garments per month. Designed for growing operations that need efficiency at scale.",
      cta: "Get Started",
      featuresIntro: "Includes everything in the previous plan, plus:",
      extraFeatures: [
        "Priority support",
        "Advanced production analytics",
        "Workflow optimization recommendations",
        "Faster processing priority",
        "Up to 2,500 garments per month"
      ]
    },
    enterprise: {
      name: "Enterprise",
      volume: "Up to 5,000 garments/month",
      originalPrice: "399k ARS",
      price: "299k ARS",
      priceUsd: "199 USD",
      originalPriceUsd: "269 USD",
      description: "For large operations where every improvement affects thousands of garments. When you're producing at scale, small inefficiencies become expensive. This plan gives you maximum operational leverage and strategic support.",
      limits: "Up to 5,000 garments per month. Beyond 5,000: +49 ARS per additional garment.",
      note: "+49 ARS per additional garment",
      noteUsd: "+0.03 USD per additional garment",
      cta: "Get Started",
      featuresIntro: "Includes everything above, plus:",
      extraFeatures: [
        "Up to 5,000 garments per month",
        "Beyond 5,000: +49 ARS per extra garment",
        "Dedicated onboarding and strategy session",
        "Direct priority support channel",
        "Early access to new features",
        "Production performance review"
      ]
    },
    customPlan: "Need a custom plan?",
    customPlanCta: "Talk to us",
    customPlanMessage: "Hi! I produce more than the listed plans allow and I'd like to look at a custom plan."
  },
  faq: {
    ...esTranslations.faq,
    badge: "FAQ",
    title: "Frequently Asked Questions",
    subtitle: "Find answers to common questions about our platform.",
    question1: {
      question: "Can I upload my own patterns, fonts, and designs?",
      answer: "Yes! CimaTex allows you to upload your own clothing patterns, fonts, and graphic designs. You can combine them with our curated library of patterns and templates, giving you full flexibility to create unique, customized apparel."
    },
    question2: {
      question: "How does CimaTex help reduce fabric waste?",
      answer: "Our platform includes AI-powered 2D nesting optimization, which automatically arranges pattern pieces on the fabric to minimize unused space. This not only reduces material waste but also lowers production costs and improves efficiency."
    },
    question3: {
      question: "How does the onboarding and assistance support work?",
      answer: "Our onboarding and assistance support gives you full access to all features of your selected plan."
    },
    question4: {
      question: "Is CimaTex suitable for small clothing businesses?",
      answer: "Absolutely. CimaTex is designed to scale with your business. Small and medium-sized clothing brands can take advantage of professional design tools, production-ready file generation, and workflow management without needing a large design or technical team."
    },
    question5: {
      question: "Can I change plans later?",
      answer: "Yes, you can upgrade or downgrade your plan at any time. If you upgrade, the new pricing will be prorated for the remainder of your billing cycle. If you downgrade, the new pricing will take effect at the start of your next billing cycle."
    },
    question6: {
      question: "What kind of support do you offer?",
      answer: "Support varies by plan. All plans include email support, with the Professional plan offering priority email support. The Enterprise plan includes 24/7 phone and email support. We also have an extensive knowledge base and community forum available to all users."
    }
  },
  cta: {
    title1: "Ready to produce with no errors and less waste?",
    title2: "Start today. No credit card.",
    subtitle: "Set up your shop and print your first order in minutes",
    getStarted: "Start free trial",
    scheduleDemo: "Schedule a Demo",
    contactWhatsApp: "Contact via WhatsApp",
    footer: "Start shaping your business with onboarding and assistance support TODAY."
  },
  footer: {
    description: "The all-in-one platform that helps custom apparel companies, automate, and deliver exceptional results. Streamline processes and focus on your business.",
    product: "Product",
    features: "Features",
    pricing: "Pricing",
    faq: "FAQ",
    demo: "Demo",
    resources: "Resources",
    documentation: "Documentation",
    guides: "Guides",
    blog: "Blog",
    support: "Support",
    company: "Company",
    about: "About",
    careers: "Careers",
    privacyPolicy: "Privacy Policy",
    termsOfService: "Terms of Service",
    cookiePolicy: "Cookie Policy",
    copyright: "All rights reserved."
  },
  language: {
    select: "Select Language",
    english: "English",
    portuguese: "Português",
    spanish: "Español"
  },
  about: {
    backToHome: "Back to Home",
    title: "About CimaTex",
    subtitle: "Revolutionizing the custom apparel industry with cutting-edge technology and intelligent automation.",
    missionTitle: "Our Mission",
    missionDescription: "At CimaTex, we believe that every custom apparel company deserves access to professional tools that allow them to grow and compete in today's market. Our mission is to democratize design and production technology, making complex processes simple and accessible to everyone.",
    valuesTitle: "Our Values",
    valuesSubtitle: "The principles that guide everything we do",
    value1Title: "Collaboration",
    value1Description: "We work closely with our clients to understand their needs and create customized solutions.",
    value2Title: "Excellence",
    value2Description: "We strive to deliver the highest quality in every product and service we provide.",
    value3Title: "Innovation",
    value3Description: "We constantly explore new technologies to improve and optimize our clients' processes.",
    value4Title: "Passion",
    value4Description: "We love what we do and are passionate about helping our clients achieve their goals.",
    storyTitle: "Our Story",
    story1: "CimaTex was born from the need to simplify complex processes in the custom apparel industry. Our team, composed of technology experts and textile industry professionals, identified the main barriers companies face to grow and compete effectively.",
    story2: "After years of research and development, we created a comprehensive platform that combines artificial intelligence, automation, and professional design tools. Today, we help hundreds of companies optimize their processes, reduce costs, and increase their productivity.",
    story3: "Our commitment is to continue innovating and adapting to the changing needs of the market, always with the goal of empowering our clients to reach their full potential.",
    ctaTitle: "Ready to join us?",
    ctaDescription: "Discover how CimaTex can transform your business and take it to the next level.",
    ctaButton: "Get Started Now",
    contactButton: "Contact"
  },
  careers: {
    backToHome: "Back to Home",
    title: "Join Our Team",
    subtitle: "Build the future of the custom apparel industry with us. We're looking for passionate talent who want to make a difference.",
    whyWorkTitle: "Why work with us?",
    whyWorkSubtitle: "We offer a dynamic work environment and exceptional growth opportunities",
    benefit1Title: "Inclusive Culture",
    benefit1Description: "We value diversity and create an environment where everyone can thrive and contribute with their unique ideas.",
    benefit2Title: "Cutting-edge Technology",
    benefit2Description: "Work with the latest technologies and tools in a constant innovation environment.",
    benefit3Title: "Professional Growth",
    benefit3Description: "Continuous investment in our employees' development with learning and promotion opportunities.",
    benefit4Title: "Remote Work",
    benefit4Description: "Flexibility to work from anywhere, with in-person meetings when necessary.",
    benefit5Title: "Impactful Projects",
    benefit5Description: "Contribute to solutions that transform industries and help thousands of companies grow.",
    benefit6Title: "Flexible Hours",
    benefit6Description: "Work-life balance with schedules adaptable to your needs.",
    positionsTitle: "Open Positions",
    positionsSubtitle: "Explore our current job opportunities",
    position1Title: "Senior Full Stack Developer",
    position1Location: "Remote",
    position1Type: "Full Time",
    position1Description: "We're looking for an experienced developer to lead the development of new features and improve our platform.",
    position2Title: "UX/UI Designer",
    position2Location: "Remote",
    position2Type: "Full Time",
    position2Description: "Join our design team to create exceptional user experiences and intuitive interfaces.",
    position3Title: "Digital Marketing Specialist",
    position3Location: "Remote",
    position3Type: "Full Time",
    position3Description: "Help us expand our market presence and connect with more custom apparel companies.",
    applyButton: "Apply Now",
    ctaTitle: "Don't see the perfect position?",
    ctaDescription: "We're always looking for exceptional talent. Send us your CV and we'll contact you when we have an opportunity that matches your profile.",
    ctaButton: "Send CV"
  },
  privacy: {
    backToHome: "Back to Home",
    title: "Privacy Policy",
    subtitle: "Your privacy is important to us. This policy explains how we collect, use, and protect your information.",
    lastUpdated: "Last updated: December 2024",
    introductionTitle: "1. Introduction",
    introductionText: "At CimaTex, we are committed to protecting your privacy and personal data. This Privacy Policy describes how we collect, use, store, and protect your information when you use our automation service for custom apparel companies.",
    introductionText2: "By using our services, you agree to the practices described in this policy. If you disagree with any part of this policy, please do not use our services.",
    dataCollectionTitle: "2. Information We Collect",
    personalInfoTitle: "Personal Information",
    personalInfo1: "Full name and contact information (email, phone, address)",
    personalInfo2: "Company information (name, address, tax data)",
    personalInfo3: "Billing and payment information",
    personalInfo4: "Registration data and user profile",
    usageInfoTitle: "Usage Information",
    usageInfo1: "Platform usage data and features",
    usageInfo2: "Design patterns and generated sublimation files",
    usageInfo3: "Order and transaction information",
    usageInfo4: "Communication and technical support data",
    dataUsageTitle: "3. How We Use Your Information",
    usage1: "Provide and improve our automation services",
    usage2: "Process orders and manage your account",
    usage3: "Communicate with you about updates and support",
    usage4: "Personalize your platform experience",
    usage5: "Comply with legal and regulatory obligations",
    usage6: "Develop new features and improvements",
    dataProtectionTitle: "4. Data Protection",
    dataProtectionText: "We implement technical, administrative, and physical security measures to protect your information against unauthorized access, alteration, disclosure, or destruction. This includes:",
    security1: "Data encryption in transit and at rest",
    security2: "Restricted access to personal information",
    security3: "Regular security monitoring",
    security4: "Staff privacy training",
    dataSharingTitle: "5. Information Sharing",
    dataSharingText: "We do not sell, rent, or share your personal information with third parties, except in the following circumstances:",
    sharing1: "With your explicit consent",
    sharing2: "To comply with legal obligations",
    sharing3: "With service providers who help us operate (under confidentiality agreements)",
    sharing4: "In case of merger, acquisition, or asset sale",
    rightsTitle: "6. Your Rights",
    rightsText: "You have the right to:",
    right1: "Access your personal information",
    right2: "Correct inaccurate data",
    right3: "Request deletion of your data",
    right4: "Limit processing of your information",
    right5: "Data portability",
    right6: "Withdraw your consent at any time",
    contactTitle: "7. Contact",
    contactText: "If you have questions about this Privacy Policy or wish to exercise your rights, contact us:"
  },
  terms: {
    backToHome: "Back to Home",
    title: "Terms of Service",
    subtitle: "These terms govern the use of our automation platform for custom apparel companies.",
    lastUpdated: "Last updated: December 2024",
    introductionTitle: "1. Acceptance of Terms",
    introductionText: "By accessing and using CimaTex, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you disagree with any of these terms, you must not use our service.",
    introductionText2: "We reserve the right to update these terms at any time. Changes will take effect immediately after their publication on our website.",
    serviceTitle: "2. Service Description",
    serviceText: "CimaTex is a SaaS platform that provides automation tools for custom apparel companies, including:",
    service1: "Pattern, design, and font catalogs",
    service2: "Automatic sublimation file generation",
    service3: "AI-powered 2D nesting optimization",
    service4: "Order tracking and management",
    service5: "Customization tools",
    serviceUptime: "We strive to keep the service continuously available, with a 98% up-time. However, the service may experience occasional interruptions due to scheduled maintenance, updates, or circumstances beyond our control.",
    subscriptionTitle: "3. Subscription Plans",
    billingTitle: "Billing and Payments",
    billing1: "Payments are processed monthly or annually according to the selected plan",
    billing2: "Prices are subject to change with 30 days' notice",
    billing3: "Payments are non-refundable except according to our refund policy",
    billing4: "Payment default may result in service suspension",
    limitsTitle: "Usage Limits",
    limits1: "Each plan has specific product limits per month",
    limits2: "Excessive use may result in additional charges",
    limits3: "Limits reset each billing month",
    responsibilitiesTitle: "4. User Responsibilities",
    accountTitle: "User Account",
    account1: "Maintain confidentiality of your access credentials",
    account2: "Provide accurate and up-to-date information",
    account3: "Immediately notify any unauthorized use",
    account4: "Be responsible for all activities in your account",
    contentTitle: "Content and Acceptable Use",
    content1: "Do not use the service for illegal or unauthorized activities",
    content2: "Respect third-party intellectual property rights",
    content3: "Do not upload malicious content or content that violates third-party rights",
    content4: "Comply with all applicable laws and regulations",
    ipTitle: "5. Intellectual Property",
    ipText: "CimaTex and its original content, features, and functionality are owned by CimaTex and are protected by copyright, trademark, and other intellectual property laws.",
    ipText2: "Users retain rights to their content but grant CimaTex a non-exclusive license to use, process, and store such content to provide the service.",
    terminationTitle: "6. Termination",
    terminationText: "Either party may terminate this agreement at any time. Users can cancel their subscription from their control panel.",
    terminationText2: "We reserve the right to suspend or terminate accounts that violate these terms or represent a risk to service security.",
    liabilityTitle: "7. Limitation of Liability",
    liabilityText: "To the maximum extent permitted by law, CimaTex shall not be liable for indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or use.",
    liabilityText2: "Our total liability shall not exceed the amount paid by the user in the 12 months prior to the event giving rise to the claim.",
    liabilityText3: "We are committed to maintaining a high level of service availability, with a target up-time of 98%, and we work to minimize any interruptions. Should interruptions occur due to scheduled maintenance, updates, or circumstances beyond our control, we will make every effort to restore the service as quickly as possible, without this giving rise to liability for indirect damages arising from such interruptions.",
    contactTitle: "8. Contact",
    contactText: "If you have questions about these Terms of Service, contact us:"
  },
  shirtShowcase: {
    mode3d: "Interactive 3D",
    modeVideo: "Video",
    title: "From your order to a production-ready file.",
    description: "See visually how CimaTex connects your whole process."
  },
  benefits: {
    titleLine1: "Produce more.",
    titleLine2: "Waste less.",
    subtitle: "Same workshop, same team, same machines. What changes is how much you get out of every hour and every meter of fabric.",
    items: [
      {
        title: "Less fabric waste",
        metric: "fabric",
        description: "Smart nesting arranges every piece so you get more out of each roll."
      },
      {
        title: "Fewer production errors",
        metric: "rework",
        description: "Standardized, production-ready files, identical every time. No surprises at the printer."
      },
      {
        title: "Less manual work",
        metric: "hours",
        description: "The repetitive part runs on its own: what used to take hours is done in minutes."
      },
      {
        title: "More output",
        metric: "orders",
        description: "Organize and process more orders without adding hours or people to your shop."
      }
    ]
  },
  appMock: {
    title: "Your entire process. One single platform.",
    description: "Explore how CimaTex works from the inside.",
    live: "Live"
  },
  designAnimation: {
    badge: "Automated Design",
    title: "Design once, replicate for all",
    description: "Create your design once and automatically generate all variants with personalized names and numbers.",
    designer: "Designer",
    generate: "Generate →",
    result: "Result",
    name: "Name",
    number: "Number",
    back: "Back"
  },
  nestingAnimation: {
    badge: "Visual Optimization",
    title: "From list to optimized nesting",
    description: "Watch how each piece of your order transforms into optimized shapes that minimize material waste.",
    size: "Size",
    name: "Name"
  },
  chaosAnimation: {
    badge: "Before vs After",
    title: "Stop chasing orders on WhatsApp",
    description: "Your clients complete their orders on their own. You just focus on producing.",
    whatsappOrders: "WhatsApp Orders",
    size: "Size",
    number: "Number",
    name: "Name",
    choose: "Choose...",
    confirmOrder: "Confirm order",
    confirmed: "Confirmed",
    orderConfirmed: "Order #1247 confirmed",
    orderReceived: "Order received",
    inProduction: "In production",
    readyForDelivery: "Ready for delivery",
    today: "Today",
    tomorrow: "Tomorrow",
    summary: "Summary",
    players: "3 players",
    withSublimifyer: "With CimaTex",
    chaosToControl: "From chaos to control",
    client: "Client",
    msg1: "Hi, my size is M I think",
    msg2: "1 XL, 2S 10 Tomi, 1 L, 2 shorts no shirt XL and S",
    msg3: "How's my order coming?",
    msg4: "I sent a change by audio and it's not in my design 🎤",
    msg5: "Will we make it by Friday?",
    msg6: "I'll send you the design photo",
    msg7: "Hi I need 5 t-shirts and a half",
    msg8: "And???",
    msg9: "Changed my mind, XL instead",
    msg10: "Are you going to answer? 😤"
  }
};

export const ptTranslations: LandingTranslations = {
  ...esTranslations,
  nav: {
    features: "Recursos",
    howItWorks: "Como Começar",
    pricing: "Preços",
    diagnosis: "Sua oficina",
    solutions: "Soluções",
    benefits: "Benefícios",
    demo: "O app",
    calculator: "Calcule sua economia",
    faq: "FAQ",
    login: "Entrar",
    getStarted: "Começar"
  },
  hero: {
    badge: "Para fabricantes de roupas personalizadas",
    title: "Produza mais. Menos erros. Menos desperdício.",
    titleLine1: "Todo o seu processo de produção,",
    titleLine2: "automatizado em um só lugar.",
    subtitle: "O sistema para oficinas de sublimação e roupas esportivas que reduz erros, desperdício de tecido e horas de trabalho.",
    subtitle2: "Automatize a preparação de padrões e folhas de impressão para produzir mais com o mesmo equipamento.",
    demoNoCommitment: "Demo guiada, sem compromisso.",
    getStarted: "Começar",
    bookDemo: "Agendar Demonstração",
    contactWhatsApp: "Contatar pelo WhatsApp",
    feature1: "Padrões prontos para usar e personalizar em minutos",
    feature2: "Gere automaticamente folhas de sublimação prontas para imprimir",
    feature3: "Carregue nomes, números e tamanhos em massa sem erros manuais",
    cardSublimation: "Sublimação",
    cardDtf: "DTF",
    cardLaserCut: "Corte a laser",
    cardOrderTag: "Pedido",
    cardOrderStatus: "Em produção",
    cardOrderClient: "Clube Atlético Progresso",
    cardOrderItem: "Camisa listrada · Sublimação",
    cardOrderQtyLabel: "Quantidade",
    cardOrderQtyValue: "24 un.",
    cardOrderDueLabel: "Entrega",
    cardOrderDueValue: "22 ago",
    cardUsageTag: "Consumo",
    cardUsageLabel: "Papel · 7 dias",
    cardUsageValue: "18,4 m",
    cardUsagePeriod: "esta sem.",
    cardPatternTag: "Modelagem",
    cardPatternPiece: "FRENTE",
    cardPatternSize: "M",
    cardTrackTag: "Acompanhamento",
    cardTrackStep1: "Recebido",
    cardTrackStep2: "Design",
    cardTrackStep3: "Impressão",
    cardTrackStep4: "Costura",
    cardTrackStep5: "Entrega",
    cardMixTag: "Produção",
    cardMixLabel: "Mix do mês",
    cardMixTotalLabel: "pedidos",
    cardMix1: "Sublimação",
    cardMix2: "DTF",
    cardMix3: "Corte",
    cardProductTag: "Produto",
    cardProductName: "Short oficial",
    cardProductParts: "Esquerda + direita"
  },
  logos: {
    trustedBy: "Do design à impressão",
    workflowTitle: "Seu fluxo de trabalho no CimaTex"
  },
  features: {
    badge: "Recursos",
    title: "Menos erros. Menos desperdício. Mais produção.",
    subtitle: "CimaTex elimina tarefas manuais repetitivas na montagem de moldes, folhas de sublimação e personalização de peças, reduzindo erros e tempos mortos na produção.",
    feature1: {
      title: "Catálogos de Padrões, Designs e Fontes",
      description: "Acesse padrões profissionais prontos para usar e evite recriá-los do zero a cada pedido. Economize horas de montagem e mantenha consistência em todas as suas peças."
    },
    feature2: {
      title: "Complete centenas de pedidos com um clique",
      description: "Gere automaticamente os arquivos de cada cliente com nomes, números e tamanhos sem editar um por um."
    },
    feature3: {
      title: "Menos desperdício de tecido",
      description: "Reduza o desperdício de tecido otimizando automaticamente a disposição das peças em cada folha de sublimação."
    },
    feature4: {
      title: "Rastreamento e Gerenciamento",
      description: "Centralize todos os seus pedidos em um só lugar e evite perda de informações entre design, produção e entrega."
    },
    feature5: {
      title: "Personalização precisa",
      description: "Coloque logos, nomes e números com precisão e evite erros de posicionamento na impressão."
    },
    feature6: {
      title: "Gerenciamento de Fluxo de Trabalho de Produção de Ponta a Ponta",
      description: "Rastreie cada pedido do design à entrega em um único painel simplificado, com métricas e muitos outros recursos por vir."
    }
  },
  howItWorks: {
    badge: "Como Começar",
    title: "Processo Simples, Resultados Poderosos",
    subtitle: "Comece em minutos e veja a diferença que nossa plataforma pode fazer para seu negócio.",
    step1: {
      title: "Acompanhamento/Consultoria Inicial",
      description: "Entre em contato conosco e te ajudamos a adaptar seu sistema, integrar seus padrões e gerar suas primeiras folhas de sublimação."
    },
    step2: {
      title: "Automação Completa de Vendas",
      description: "Automatize todo seu processo de vendas do design à entrega. Gere mais pedidos com menos esforço e aumente significativamente sua receita."
    },
    step3: {
      title: "Otimização e Economia de Tempo",
      description: "Reduza significativamente o tempo dedicado à montagem manual e minimize erros custosos na produção."
    }
  },
  diagnosis: {
    title: "Isso está acontecendo na sua oficina?",
    subtitle: "Confira esses problemas comuns. Se você se identifica com vários, o custo oculto da sua operação pode ser maior do que você imagina.",
    closing: "Se você respondeu 'sim' a mais de uma, sua operação tem margem para melhorar.",
    question1: {
      question: "Ainda montam as folhas de sublimação manualmente?",
      description: "Cada folha é desenhada e posicionada peça por peça. Horas por pedido, sem escalar.",
      impact: "Horas de mão de obra por pedido, gargalos antes de imprimir, atrasos quando o volume aumenta.",
      solution: "O sistema gera as folhas de sublimação a partir do pedido e dos moldes, com disposição otimizada, prontas para imprimir."
    },
    question2: {
      question: "Perdem tempo carregando nomes e números um a um?",
      description: "Cada nome e número é digitado ou colado em cada peça. Em pedidos de times ou eventos, são centenas de dados.",
      impact: "Muito tempo por pedido, erros de digitação, retrabalho quando algo dá errado.",
      solution: "Carga em massa a partir de planilha ou lista: o sistema associa nome, número e tamanho a cada peça e gera os arquivos sem intervenção manual."
    },
    question3: {
      question: "Erram em tamanhos, nomes ou dados de jogadores?",
      description: "Os dados circulam por WhatsApp, Excel ou papel. Copia errado, perde uma linha ou confunde um tamanho.",
      impact: "Peças mal personalizadas, reclamações, reimpressões e perda de confiança do cliente.",
      solution: "Um único fluxo com dados vinculados ao pedido: o sistema usa a informação correta por peça e reduz erros de transcrição."
    },
    question4: {
      question: "Precisam refazer pedidos por erros de produção?",
      description: "Erros de design, tamanho ou personalização são descobertos depois de imprimir ou cortar. Aí é preciso refazer.",
      impact: "Tecido, tempo e mão de obra desperdiçados; entregas atrasadas e clientes insatisfeitos.",
      solution: "Fluxo controlado do pedido ao arquivo final: menos passos manuais, menos pontos de falha e revisão antes de imprimir."
    },
    question5: {
      question: "Desperdiçam mais tecido do que deveriam?",
      description: "As peças são posicionadas a olho ou com critério fixo. Sobra tecido entre peças ou corta demais.",
      impact: "Gasto extra em tecido, menor rendimento por chapa e margem consumida pelo desperdício.",
      solution: "Otimização automática de nesting: o sistema dispõe as peças para aproveitar melhor o tecido e reduzir sobra."
    },
    question6: {
      question: "Recriam moldes do zero para pedidos parecidos?",
      description: "Cada pedido \"novo\" obriga a remontar o molde ou o layout mesmo quando é muito parecido com um anterior.",
      impact: "Horas de trabalho de design repetitivo, atrasos na entrega e pouca padronização.",
      solution: "Catálogos de moldes reutilizáveis: escolhe a base, ajusta o necessário e gera o pedido sem voltar ao zero."
    },
    question7: {
      question: "A informação dos pedidos está espalhada entre WhatsApp, Excel e designers?",
      description: "Pedidos no WhatsApp, listas no Excel, arquivos no computador do designer. Ninguém tem a visão completa.",
      impact: "Pedidos perdidos, trabalho duplicado, erros por informação desatualizada.",
      solution: "Pedidos centralizados em um só lugar: mesmo registro para vendas, produção e entrega, com histórico e acompanhamento."
    },
    question8: {
      question: "Quando o volume aumenta, o caos aumenta também?",
      description: "Com mais pedidos, os mesmos processos manuais se multiplicam. Mais erros, mais atrasos, mais estresse.",
      impact: "Não conseguir escalar sem contratar mais ou trabalhar até tarde; gargalos em pessoas-chave.",
      solution: "Automação que escala com o volume: mesmo fluxo para 10 ou 500 peças, sem multiplicar horas manuais na mesma proporção."
    },
    question9: {
      question: "Dependem demais de uma pessoa que sabe \"como se monta tudo\"?",
      description: "Uma ou poucas pessoas concentram o conhecimento. Se faltam ou saem, a operação trava.",
      impact: "Risco operacional, dificuldade para incorporar gente e sobrecarga nessas pessoas.",
      solution: "Processos padronizados no sistema: o \"como se faz\" fica em fluxos e modelos que qualquer um pode seguir."
    },
    question10: {
      question: "Custa escalar sem contratar mais gente?",
      description: "Mais pedidos exigem mais mãos na montagem, na carga de dados e na revisão. O crescimento não vira margem.",
      impact: "Contratar só para tarefas repetitivas ou recusar pedidos por falta de capacidade.",
      solution: "O sistema faz o trabalho repetitivo (folhas, dados, nesting); a equipe foca em design, qualidade e cliente—você pode crescer sem acrescentar gente na mesma proporção."
    }
  },
  testimonials: {
    badge: "Depoimentos",
    title: "Confiado por oficinas de roupas personalizadas",
    subtitle: "Veja como negócios de sublimação e roupas esportivas estão produzindo mais com menos erros e menos desperdício.",
    testimonial1: {
      quote: "Deixamos de montar folhas de sublimação à mão. Pedidos que levavam horas agora saem em minutos e cometemos muito menos erros.",
      author: "Oficina de sublimação",
      role: "Roupas esportivas e sublimação"
    },
    testimonial2: {
      quote: "Os dados antes circulavam no WhatsApp e no Excel. Agora tudo está em um só lugar—sabemos exatamente o que tem em cada pedido e não perdemos mais nomes ou tamanhos.",
      author: "Negócio de roupas personalizadas",
      role: "Uniformes de times e eventos"
    },
    testimonial3: {
      quote: "O suporte esteve lá desde o primeiro dia. Ajudaram a carregar nossos padrões e gerar nossas primeiras folhas. Estávamos operando em pouco tempo.",
      author: "Oficina de confecção",
      role: "Sublimação e bordado"
    },
    testimonial4: {
      quote: "Refazíamos pedidos o tempo todo por erros de layout ou personalização. Com o CimaTex revisamos antes de imprimir e as reimpressões caíram bastante.",
      author: "Fabricante de roupas",
      role: "Personalização em volume"
    },
    testimonial5: {
      quote: "A otimização de nesting realmente reduziu nosso desperdício de tecido. Estamos aproveitando mais cada folha e gastando menos em material.",
      author: "Oficina têxtil",
      role: "Impressão por sublimação"
    },
    testimonial6: {
      quote: "Quando o volume subia a gente se afogava em trabalho manual. Agora atendemos mais pedidos sem aumentar gente. O sistema faz a parte repetitiva.",
      author: "Produtor de roupas esportivas",
      role: "Roupas esportivas personalizadas"
    }
  },
  pricing: {
    badge: "Preços",
    title: "Escolha de acordo com quanto você produz.",
    subtitle: "Todos os planos incluem acesso completo ao CimaTex. O preço depende do seu volume mensal de produção.",
    logicIntro: "Você paga conforme o que produz. Quanto maior seu volume, maior o impacto do sistema na sua operação.",
    roiPhrase: "Um único erro de produção pode custar mais que um mês de CimaTex.",
    roiReminderTitle: "Lembrete de ROI estratégico",
    roiReminderLine1: "Um único erro de produção pode custar mais que um mês inteiro do sistema.",
    roiReminderLine2: "Quando você reduz trabalho manual, evita reimpressões e otimiza o uso de tecido, a plataforma muitas vezes se paga apenas com os erros evitados.",
    month: "/ mês",
    founderPriceLabel: "Preço Founder",
    mostPopular: "Mais escolhido",
    sharedFeaturesTitle: "Todos os planos incluem acesso total",
    accessNote: "Acesso completo ao CimaTex",
    currencyLabel: "Moeda",
    currencyArs: "Pesos (ARS)",
    currencyUsd: "Dólares (USD)",
    sharedFeatures: [
      "Onboarding",
      "Suporte",
      "Automação de produção",
      "Geração de arquivos de produção",
      "Gestão de pedidos",
      "Múltiplos usuários"
    ],
    starter: {
      name: "Inicial",
      volume: "Até 1.000 peças/mês",
      originalPrice: "119k ARS",
      price: "99k ARS",
      priceUsd: "69 USD",
      originalPriceUsd: "79 USD",
      description: "Para oficinas pequenas que começam a automatizar e eliminar erros manuais. Se você ainda prepara folhas manualmente, ajusta nomes um a um ou corrige erros de produção, este plano ajuda a estabilizar seu fluxo e economizar horas toda semana.",
      limits: "Até 1.000 peças por mês. Ideal para oficinas que começam sua jornada de automação.",
      cta: "Começar",
      features: [
        "Acesso completo ao sistema",
        "Catálogos de moldes profissionais prontos para usar",
        "Geração automática de folhas de sublimação",
        "Personalização em massa de nomes e números",
        "Otimização automática de disposição de peças",
        "Gestão centralizada de pedidos",
        "Suporte por e-mail padrão",
        "Sessão de onboarding guiado",
        "Até 1.000 peças por mês"
      ]
    },
    professional: {
      name: "Profissional",
      volume: "Até 2.500 peças/mês",
      originalPrice: "229k ARS",
      price: "199k ARS",
      priceUsd: "139 USD",
      originalPriceUsd: "159 USD",
      description: "Para oficinas com produção estável que precisam de eficiência e menos desperdício. Neste nível, cada melhoria impacta diretamente as margens. Este plano ajuda a reduzir desperdício de material, melhorar o fluxo operacional e escalar sem aumentar equipe.",
      limits: "Até 2.500 peças por mês. Para operações em crescimento que precisam de eficiência em escala.",
      cta: "Começar",
      featuresIntro: "Inclui tudo do plano anterior, mais:",
      extraFeatures: [
        "Suporte prioritário",
        "Analytics avançados de produção",
        "Recomendações de otimização de fluxo",
        "Prioridade de processamento mais rápido",
        "Até 2.500 peças por mês"
      ]
    },
    enterprise: {
      name: "Empresarial",
      volume: "Até 5.000 peças/mês",
      originalPrice: "399k ARS",
      price: "299k ARS",
      priceUsd: "199 USD",
      originalPriceUsd: "269 USD",
      description: "Para operações grandes onde cada melhoria afeta milhares de peças. Quando você produz em escala, pequenas ineficiências ficam caras. Este plano oferece máxima alavancagem operacional e suporte estratégico.",
      limits: "Até 5.000 peças por mês. Acima de 5.000: +49 ARS por peça adicional.",
      note: "+49 ARS por peça adicional",
      noteUsd: "+0,03 USD por peça adicional",
      cta: "Começar",
      featuresIntro: "Inclui tudo acima, mais:",
      extraFeatures: [
        "Até 5.000 peças por mês",
        "Acima de 5.000: +49 ARS por peça extra",
        "Sessão dedicada de onboarding e estratégia",
        "Canal direto de suporte prioritário",
        "Acesso antecipado a novas funções",
        "Revisão de desempenho de produção"
      ]
    },
    customPlan: "Precisa de um plano sob medida?",
    customPlanCta: "Fale com a gente",
    customPlanMessage: "Olá! Produzo acima dos planos publicados e gostaria de ver um plano sob medida."
  },
  faq: {
    ...esTranslations.faq,
    badge: "FAQ",
    title: "Perguntas Frequentes",
    subtitle: "Encontre respostas para perguntas comuns sobre nossa plataforma.",
    question1: {
      question: "Posso fazer upload dos meus próprios padrões, fontes e designs?",
      answer: "Sim! O CimaTex permite que você faça upload dos seus próprios padrões de roupas, fontes e designs gráficos. Você pode combiná-los com nossa biblioteca curada de padrões e modelos, dando-lhe total flexibilidade para criar roupas únicas e personalizadas."
    },
    question2: {
      question: "Como o CimaTex ajuda a reduzir o desperdício de tecido?",
      answer: "Nossa plataforma inclui otimização de aninhamento 2D com IA, que automaticamente organiza as peças do padrão no tecido para minimizar o espaço não utilizado. Isso não apenas reduz o desperdício de material, mas também reduz os custos de produção e melhora a eficiência."
    },
    question3: {
      question: "Como funciona o suporte de integração e assistência?",
      answer: "Nosso suporte de integração e assistência oferece acesso completo a todos os recursos do seu plano selecionado."
    },
    question4: {
      question: "O CimaTex é adequado para pequenas empresas de roupas?",
      answer: "Absolutamente. O CimaTex é projetado para escalar com seu negócio. Pequenas e médias marcas de roupas podem aproveitar ferramentas de design profissionais, geração de arquivos prontos para produção e gerenciamento de fluxo de trabalho sem precisar de uma grande equipe de design ou técnica."
    },
    question5: {
      question: "Posso mudar de plano depois?",
      answer: "Sim, você pode fazer upgrade ou downgrade do seu plano a qualquer momento. Se você fizer upgrade, o novo preço será proporcional pelo restante do seu ciclo de cobrança. Se você fizer downgrade, o novo preço entrará em vigor no início do seu próximo ciclo de cobrança."
    },
    question6: {
      question: "Que tipo de suporte vocês oferecem?",
      answer: "O suporte varia por plano. Todos os planos incluem suporte por email, com o plano Profissional oferecendo suporte prioritário por email. O plano Empresarial inclui suporte 24/7 por telefone e email. Também temos uma extensa base de conhecimento e fórum da comunidade disponível para todos os usuários."
    }
  },
  cta: {
    title1: "Pronto para produzir sem erros e com menos desperdício?",
    title2: "Comece hoje. Sem cartão.",
    subtitle: "Configure sua oficina e sublime seu primeiro pedido em minutos",
    getStarted: "Começar teste grátis",
    scheduleDemo: "Agendar Demonstração",
    contactWhatsApp: "Contatar pelo WhatsApp",
    footer: "Comece a moldar seu negócio com suporte de integração e assistência HOJE."
  },
  footer: {
    description: "A plataforma completa que ajuda empresas de roupas personalizadas a automatizar e entregar resultados excepcionais. Simplifique processos e foque no seu negócio.",
    product: "Produto",
    features: "Recursos",
    pricing: "Preços",
    faq: "Perguntas Frequentes",
    demo: "Demo",
    resources: "Recursos",
    documentation: "Documentação",
    guides: "Guias",
    blog: "Blog",
    support: "Suporte",
    company: "Empresa",
    about: "Sobre",
    careers: "Carreiras",
    privacyPolicy: "Política de Privacidade",
    termsOfService: "Termos de Serviço",
    cookiePolicy: "Política de Cookies",
    copyright: "Todos os direitos reservados."
  },
  language: {
    select: "Selecionar Idioma",
    english: "English",
    portuguese: "Português",
    spanish: "Español"
  },
  about: {
    backToHome: "Voltar ao Início",
    title: "Sobre o CimaTex",
    subtitle: "Revolucionando a indústria de roupas personalizadas com tecnologia de ponta e automação inteligente.",
    missionTitle: "Nossa Missão",
    missionDescription: "No CimaTex, acreditamos que toda empresa de roupas personalizadas merece ter acesso a ferramentas profissionais que lhes permitam crescer e competir no mercado atual. Nossa missão é democratizar a tecnologia de design e produção, tornando processos complexos simples e acessíveis para todos.",
    valuesTitle: "Nossos Valores",
    valuesSubtitle: "Os princípios que guiam tudo o que fazemos",
    value1Title: "Colaboração",
    value1Description: "Trabalhamos estreitamente com nossos clientes para entender suas necessidades e criar soluções personalizadas.",
    value2Title: "Excelência",
    value2Description: "Nos esforçamos para oferecer a mais alta qualidade em cada produto e serviço que entregamos.",
    value3Title: "Inovação",
    value3Description: "Constantemente exploramos novas tecnologias para melhorar e otimizar os processos de nossos clientes.",
    value4Title: "Paixão",
    value4Description: "Amamos o que fazemos e somos apaixonados por ajudar nossos clientes a alcançar seus objetivos.",
    storyTitle: "Nossa História",
    story1: "O CimaTex nasceu da necessidade de simplificar processos complexos na indústria de roupas personalizadas. Nossa equipe, composta por especialistas em tecnologia e profissionais da indústria têxtil, identificou as principais barreiras que as empresas enfrentam para crescer e competir efetivamente.",
    story2: "Após anos de pesquisa e desenvolvimento, criamos uma plataforma abrangente que combina inteligência artificial, automação e ferramentas de design profissional. Hoje, ajudamos centenas de empresas a otimizar seus processos, reduzir custos e aumentar sua produtividade.",
    story3: "Nosso compromisso é continuar inovando e nos adaptando às necessidades em constante mudança do mercado, sempre com o objetivo de capacitar nossos clientes para alcançar seu máximo potencial.",
    ctaTitle: "Pronto para se juntar a nós?",
    ctaDescription: "Descubra como o CimaTex pode transformar seu negócio e levá-lo ao próximo nível.",
    ctaButton: "Começar Agora",
    contactButton: "Contatar"
  },
  careers: {
    backToHome: "Voltar ao Início",
    title: "Junte-se à Nossa Equipe",
    subtitle: "Construa o futuro da indústria de roupas personalizadas conosco. Procuramos talentos apaixonados que queiram fazer a diferença.",
    whyWorkTitle: "Por que trabalhar conosco?",
    whyWorkSubtitle: "Oferecemos um ambiente de trabalho dinâmico e oportunidades de crescimento excepcionais",
    benefit1Title: "Cultura Inclusiva",
    benefit1Description: "Valorizamos a diversidade e criamos um ambiente onde todos podem prosperar e contribuir com suas ideias únicas.",
    benefit2Title: "Tecnologia de Ponta",
    benefit2Description: "Trabalhe com as mais recentes tecnologias e ferramentas em um ambiente de inovação constante.",
    benefit3Title: "Crescimento Profissional",
    benefit3Description: "Investimento contínuo no desenvolvimento de nossos funcionários com oportunidades de aprendizado e promoção.",
    benefit4Title: "Trabalho Remoto",
    benefit4Description: "Flexibilidade para trabalhar de qualquer lugar, com reuniões presenciais quando necessário.",
    benefit5Title: "Projetos Impactantes",
    benefit5Description: "Contribua para soluções que transformam indústrias e ajudam milhares de empresas a crescer.",
    benefit6Title: "Horários Flexíveis",
    benefit6Description: "Equilíbrio entre trabalho e vida pessoal com horários adaptáveis às suas necessidades.",
    positionsTitle: "Posições Abertas",
    positionsSubtitle: "Explore nossas oportunidades de emprego atuais",
    position1Title: "Desenvolvedor Full Stack Sênior",
    position1Location: "Remoto",
    position1Type: "Tempo Integral",
    position1Description: "Procuramos um desenvolvedor experiente para liderar o desenvolvimento de novas funcionalidades e melhorar nossa plataforma.",
    position2Title: "Designer UX/UI",
    position2Location: "Remoto",
    position2Type: "Tempo Integral",
    position2Description: "Junte-se à nossa equipe de design para criar experiências de usuário excepcionais e interfaces intuitivas.",
    position3Title: "Especialista em Marketing Digital",
    position3Location: "Remoto",
    position3Type: "Tempo Integral",
    position3Description: "Ajude-nos a expandir nossa presença no mercado e conectar com mais empresas de roupas personalizadas.",
    applyButton: "Candidatar-se Agora",
    ctaTitle: "Não vê a posição perfeita?",
    ctaDescription: "Sempre estamos procurando talentos excepcionais. Envie-nos seu CV e entraremos em contato quando tivermos uma oportunidade que combine com seu perfil.",
    ctaButton: "Enviar CV"
  },
  privacy: {
    backToHome: "Voltar ao Início",
    title: "Política de Privacidade",
    subtitle: "Sua privacidade é importante para nós. Esta política explica como coletamos, usamos e protegemos suas informações.",
    lastUpdated: "Última atualização: Dezembro 2024",
    introductionTitle: "1. Introdução",
    introductionText: "No CimaTex, estamos comprometidos em proteger sua privacidade e dados pessoais. Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas informações quando você usa nosso serviço de automação para empresas de roupas personalizadas.",
    introductionText2: "Ao usar nossos serviços, você concorda com as práticas descritas nesta política. Se você não concordar com alguma parte desta política, por favor não use nossos serviços.",
    dataCollectionTitle: "2. Informações que Coletamos",
    personalInfoTitle: "Informações Pessoais",
    personalInfo1: "Nome completo e informações de contato (email, telefone, endereço)",
    personalInfo2: "Informações da empresa (nome, endereço, dados fiscais)",
    personalInfo3: "Informações de cobrança e pagamento",
    personalInfo4: "Dados de registro e perfil do usuário",
    usageInfoTitle: "Informações de Uso",
    usageInfo1: "Dados de uso da plataforma e funcionalidades",
    usageInfo2: "Padrões de design e arquivos de sublimação gerados",
    usageInfo3: "Informações de pedidos e transações",
    usageInfo4: "Dados de comunicação e suporte técnico",
    dataUsageTitle: "3. Como Usamos suas Informações",
    usage1: "Fornecer e melhorar nossos serviços de automação",
    usage2: "Processar pedidos e gerenciar sua conta",
    usage3: "Comunicar com você sobre atualizações e suporte",
    usage4: "Personalizar sua experiência na plataforma",
    usage5: "Cumprir obrigações legais e regulamentares",
    usage6: "Desenvolver novas funcionalidades e melhorias",
    dataProtectionTitle: "4. Proteção de Dados",
    dataProtectionText: "Implementamos medidas de segurança técnicas, administrativas e físicas para proteger suas informações contra acesso não autorizado, alteração, divulgação ou destruição. Isso inclui:",
    security1: "Criptografia de dados em trânsito e em repouso",
    security2: "Acesso restrito a informações pessoais",
    security3: "Monitoramento regular de segurança",
    security4: "Treinamento da equipe em privacidade",
    dataSharingTitle: "5. Compartilhamento de Informações",
    dataSharingText: "Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros, exceto nas seguintes circunstâncias:",
    sharing1: "Com seu consentimento explícito",
    sharing2: "Para cumprir obrigações legais",
    sharing3: "Com provedores de serviços que nos ajudam a operar (sob acordos de confidencialidade)",
    sharing4: "Em caso de fusão, aquisição ou venda de ativos",
    rightsTitle: "6. Seus Direitos",
    rightsText: "Você tem o direito de:",
    right1: "Acessar suas informações pessoais",
    right2: "Corrigir dados imprecisos",
    right3: "Solicitar exclusão de seus dados",
    right4: "Limitar o processamento de suas informações",
    right5: "Portabilidade de dados",
    right6: "Retirar seu consentimento a qualquer momento",
    contactTitle: "7. Contato",
    contactText: "Se você tiver dúvidas sobre esta Política de Privacidade ou desejar exercer seus direitos, entre em contato conosco:"
  },
  terms: {
    backToHome: "Voltar ao Início",
    title: "Termos de Serviço",
    subtitle: "Estes termos regem o uso de nossa plataforma de automação para empresas de roupas personalizadas.",
    lastUpdated: "Última atualização: Dezembro 2024",
    introductionTitle: "1. Aceitação dos Termos",
    introductionText: "Ao acessar e usar o CimaTex, você concorda em estar sujeito a estes Termos de Serviço e todas as leis e regulamentos aplicáveis. Se você não concordar com algum destes termos, não deve usar nosso serviço.",
    introductionText2: "Reservamo-nos o direito de atualizar estes termos a qualquer momento. As alterações entrarão em vigor imediatamente após sua publicação em nosso site.",
    serviceTitle: "2. Descrição do Serviço",
    serviceText: "O CimaTex é uma plataforma SaaS que fornece ferramentas de automação para empresas de roupas personalizadas, incluindo:",
    service1: "Catálogos de padrões, designs e fontes",
    service2: "Geração automática de arquivos de sublimação",
    service3: "Otimização de aninhamento 2D com IA",
    service4: "Rastreamento e gerenciamento de pedidos",
    service5: "Ferramentas de personalização",
    serviceUptime: "Nos esforçamos para manter o serviço disponível de forma contínua, com um tempo de atividade (up-time) de 98%. No entanto, o serviço pode sofrer interrupções ocasionais devido a manutenção programada, atualizações ou circunstâncias fora do nosso controle.",
    subscriptionTitle: "3. Planos de Assinatura",
    billingTitle: "Cobrança e Pagamentos",
    billing1: "Os pagamentos são processados mensalmente ou anualmente de acordo com o plano selecionado",
    billing2: "Os preços estão sujeitos a alterações com 30 dias de aviso prévio",
    billing3: "Os pagamentos não são reembolsáveis, exceto de acordo com nossa política de reembolso",
    billing4: "O não pagamento pode resultar na suspensão do serviço",
    limitsTitle: "Limites de Uso",
    limits1: "Cada plano tem limites específicos de produtos por mês",
    limits2: "O uso excessivo pode resultar em cobranças adicionais",
    limits3: "Os limites são redefinidos a cada mês de cobrança",
    responsibilitiesTitle: "4. Responsabilidades do Usuário",
    accountTitle: "Conta do Usuário",
    account1: "Manter a confidencialidade de suas credenciais de acesso",
    account2: "Fornecer informações precisas e atualizadas",
    account3: "Notificar imediatamente qualquer uso não autorizado",
    account4: "Ser responsável por todas as atividades em sua conta",
    contentTitle: "Conteúdo e Uso Aceitável",
    content1: "Não usar o serviço para atividades ilegais ou não autorizadas",
    content2: "Respeitar os direitos de propriedade intelectual de terceiros",
    content3: "Não fazer upload de conteúdo malicioso ou que viole direitos de terceiros",
    content4: "Cumprir todas as leis e regulamentos aplicáveis",
    ipTitle: "5. Propriedade Intelectual",
    ipText: "O CimaTex e seu conteúdo original, características e funcionalidades são propriedade do CimaTex e estão protegidos por leis de direitos autorais, marcas registradas e outras leis de propriedade intelectual.",
    ipText2: "Os usuários mantêm os direitos sobre seu conteúdo, mas concedem ao CimaTex uma licença não exclusiva para usar, processar e armazenar tal conteúdo para fornecer o serviço.",
    terminationTitle: "6. Rescisão",
    terminationText: "Qualquer uma das partes pode rescindir este acordo a qualquer momento. Os usuários podem cancelar sua assinatura em seu painel de controle.",
    terminationText2: "Reservamo-nos o direito de suspender ou encerrar contas que violem estes termos ou representem um risco para a segurança do serviço.",
    liabilityTitle: "7. Limitação de Responsabilidade",
    liabilityText: "Na máxima extensão permitida por lei, o CimaTex não será responsável por danos indiretos, incidentais, especiais, consequenciais ou punitivos, incluindo, mas não limitado a, perda de lucros, dados ou uso.",
    liabilityText2: "Nossa responsabilidade total não excederá o valor pago pelo usuário nos 12 meses anteriores ao evento que deu origem ao reclamo.",
    liabilityText3: "Comprometemo-nos a manter um alto nível de disponibilidade do serviço, com um objetivo de tempo de atividade (up-time) de 98%, e trabalhamos para minimizar quaisquer interrupções. Caso ocorram interrupções devido a manutenção programada, atualizações ou circunstâncias fora do nosso controle, faremos todo o possível para restabelecer o serviço o mais rápido possível, sem que isso gere responsabilidade por danos indiretos decorrentes de tais interrupções.",
    contactTitle: "8. Contato",
    contactText: "Se você tiver dúvidas sobre estes Termos de Serviço, entre em contato conosco:"
  },
  cookies: {
    backToHome: "Voltar ao Início",
    title: "Política de Cookies",
    subtitle: "Informações sobre como usamos cookies para melhorar sua experiência em nosso site",
    lastUpdated: "Última atualização: Janeiro 2025",
    introductionTitle: "1. O que são Cookies?",
    introductionText: "Cookies são pequenos arquivos de texto que são armazenados em seu dispositivo quando você visita um site. Esses cookies nos ajudam a lembrar informações sobre sua visita, como seu idioma preferido e outras configurações, o que pode tornar sua próxima visita mais fácil e o site mais útil para você.",
    introductionText2: "O CimaTex usa cookies para melhorar sua experiência de navegação, analisar o uso do site e personalizar o conteúdo de acordo com suas preferências.",
    typesTitle: "2. Tipos de Cookies que Usamos",
    essentialTitle: "Cookies Essenciais",
    essentialText: "Estes cookies são necessários para o funcionamento básico do site e não podem ser desativados.",
    essential1: "Cookies de sessão para manter sua sessão ativa",
    essential2: "Cookies de segurança para proteger contra ataques",
    essential3: "Cookies de preferências de idioma",
    essential4: "Cookies de configuração do tema (claro/escuro)",
    analyticsTitle: "Cookies de Análise",
    analyticsText: "Estes cookies nos ajudam a entender como os visitantes interagem com nosso site.",
    analytics1: "Google Analytics para análise de tráfego web",
    analytics2: "Métricas de performance e velocidade do site",
    analytics3: "Dados de uso de recursos específicos",
    analytics4: "Informações sobre dispositivos e navegadores",
    functionalTitle: "Cookies Funcionais",
    functionalText: "Estes cookies melhoram a funcionalidade do site e fornecem recursos personalizados.",
    functional1: "Lembrar configurações do usuário",
    functional2: "Personalização de conteúdo",
    functional3: "Integração com redes sociais",
    functional4: "Recursos de chat e suporte",
    managementTitle: "3. Gerenciamento de Cookies",
    managementText: "Você pode controlar e gerenciar cookies de várias maneiras:",
    management1: "Configurações do navegador: A maioria dos navegadores permite visualizar, excluir e bloquear cookies",
    management2: "Ferramentas de terceiros: Você pode usar ferramentas como Ghostery ou uBlock Origin",
    management3: "Configurações do Google Analytics: Você pode optar por não participar do Google Analytics",
    management4: "Exclusão manual: Você pode excluir cookies armazenados em seu dispositivo",
    thirdPartyTitle: "4. Cookies de Terceiros",
    thirdPartyText: "Nosso site pode conter cookies de terceiros. Estes cookies são definidos por serviços que aparecem em nossas páginas:",
    thirdParty1: "Google Analytics - Para análise de tráfego web",
    thirdParty2: "Vercel Analytics - Para métricas de performance",
    thirdParty3: "WhatsApp - Para funcionalidade de chat",
    thirdParty4: "Calendly - Para agendamento de consultas",
    thirdPartyNote: "Não temos controle sobre estes cookies de terceiros. Recomendamos revisar as políticas de privacidade destes serviços para mais informações.",
    rightsTitle: "5. Seus Direitos",
    rightsText: "Você tem o direito de:",
    right1: "Saber quais cookies usamos e por quê",
    right2: "Escolher se aceita ou rejeita cookies não essenciais",
    right3: "Excluir cookies existentes de seu dispositivo",
    right4: "Configurar seu navegador para rejeitar cookies",
    right5: "Entrar em contato conosco com perguntas sobre nossos cookies",
    updatesTitle: "6. Atualizações desta Política",
    updatesText: "Podemos atualizar esta Política de Cookies ocasionalmente para refletir mudanças em nossas práticas ou por outras razões operacionais, legais ou regulamentares. Recomendamos revisar esta página periódicamente para se manter informado sobre nosso uso de cookies.",
    updatesNote: "Mudanças significativas nesta política serão notificadas através de nosso site ou por outros meios apropriados.",
    contactTitle: "7. Contato",
    contactText: "Se você tiver dúvidas sobre esta Política de Cookies ou desejar exercer seus direitos, entre em contato conosco:"
  },
  shirtShowcase: {
    mode3d: "3D interativo",
    modeVideo: "Vídeo",
    title: "Do seu pedido ao arquivo pronto para produzir.",
    description: "Entenda visualmente como o CimaTex conecta todo o processo."
  },
  benefits: {
    titleLine1: "Produza mais.",
    titleLine2: "Desperdice menos.",
    subtitle: "A mesma oficina, a mesma equipe, as mesmas máquinas. O que muda é o quanto rende cada hora e cada metro de tecido.",
    items: [
      {
        title: "Menos desperdício de tecido",
        metric: "tecido",
        description: "O nesting inteligente encaixa cada peça para aproveitar melhor cada metro do rolo."
      },
      {
        title: "Menos erros de produção",
        metric: "retrabalho",
        description: "Arquivos padronizados e prontos para produzir, sempre iguais. Sem surpresas na impressora."
      },
      {
        title: "Menos trabalho manual",
        metric: "horas",
        description: "O repetitivo é automatizado: o que levava horas fica resolvido em minutos."
      },
      {
        title: "Mais produção",
        metric: "pedidos",
        description: "Você organiza e processa mais pedidos sem somar horas nem gente à oficina."
      }
    ]
  },
  appMock: {
    title: "Todo o seu processo. Uma única plataforma.",
    description: "Explore como o CimaTex funciona por dentro.",
    live: "Ao vivo"
  },
  designAnimation: {
    badge: "Design Automatizado",
    title: "Projete uma vez, replique para todos",
    description: "Crie seu design uma única vez e gere automaticamente todas as variantes com nomes e números personalizados.",
    designer: "Designer",
    generate: "Gerar →",
    result: "Resultado",
    name: "Nome",
    number: "Número",
    back: "Costas"
  },
  nestingAnimation: {
    badge: "Otimização Visual",
    title: "Da lista ao nesting otimizado",
    description: "Veja como cada peça do seu pedido se transforma em formas otimizadas que minimizam o desperdício de material.",
    size: "Tamanho",
    name: "Nome"
  },
  chaosAnimation: {
    badge: "Antes vs Depois",
    title: "Pare de perseguir pedidos pelo WhatsApp",
    description: "Seus clientes completam o pedido sozinhos. Você só se dedica a produzir.",
    whatsappOrders: "Pedidos WhatsApp",
    size: "Tamanho",
    number: "Número",
    name: "Nome",
    choose: "Escolher...",
    confirmOrder: "Confirmar pedido",
    confirmed: "Confirmado",
    orderConfirmed: "Pedido #1247 confirmado",
    orderReceived: "Pedido recebido",
    inProduction: "Em produção",
    readyForDelivery: "Pronto para entrega",
    today: "Hoje",
    tomorrow: "Amanhã",
    summary: "Resumo",
    players: "3 jogadores",
    withSublimifyer: "Com CimaTex",
    chaosToControl: "Do caos ao controle",
    client: "Cliente",
    msg1: "Oi, meu tamanho é M acho",
    msg2: "1 XL, 2S 10 Tomi, 1 L, 2 shorts sem camiseta XL e S",
    msg3: "Como está meu pedido?",
    msg4: "Mandei uma mudança por áudio e não está no meu design 🎤",
    msg5: "Vai dar tempo pra sexta?",
    msg6: "Vou te mandar a foto do design",
    msg7: "Oi preciso de 5 camisetas e meia",
    msg8: "E???",
    msg9: "Mudei, melhor XL",
    msg10: "Vai responder? 😤"
  }
};

export const translationsByLanguage: Record<LanguageCode, LandingTranslations> = {
  es: esTranslations,
  en: enTranslations,
  pt: ptTranslations,
};

export function detectBrowserLanguage(): LanguageCode {
  if (typeof navigator === 'undefined') return 'es';
  const candidates = navigator.languages && navigator.languages.length > 0
    ? navigator.languages
    : [navigator.language];
  for (const entry of candidates) {
    if (!entry) continue;
    const prefix = entry.toLowerCase().split('-')[0];
    if (prefix === 'en') return 'en';
    if (prefix === 'pt') return 'pt';
    if (prefix === 'es') break;
  }
  return 'es';
}

export async function loadTranslations(lang: LanguageCode): Promise<LandingTranslations> {
  const base = translationsByLanguage[lang] ?? esTranslations;
  if (lang === 'es') return esTranslations;
  if (typeof fetch === 'undefined') return base;
  try {
    const res = await fetch(`/translations/${lang}.json`);
    if (!res.ok) return base;
    const json = (await res.json()) as Partial<LandingTranslations>;
    return {
      ...base,
      ...json,
    };
  } catch {
    return base;
  }
}
