import type { Locale } from "./ui";

export type Experience = {
  company: string;
  role: string;
  context: string;
  period: string;
  bullets: string[];
  skills: string[];
};

export type Education = {
  school: string;
  degree: string;
  location: string;
  duration: string;
  note: string;
};

const experiencesEn: Experience[] = [
  {
    company: "Runelabs",
    role: "Founding Engineer",
    context: "Web3 Game Studio",
    period: "Jan 2025 → Now · 1.5 years",
    bullets: [
      "Designed Midgard from the ground up, crafting its full UX/UI, logo, brand and 3D assets with a strong gaming identity and mobile-first responsive approach. Helped shape a platform enabling decentralized monetization for indie studios.",
      "Led the full frontend development of PonziLand, crafting a polished on-chain game experience at the intersection of gaming and crypto. Partnered closely with the Game Designer to turn gameplay into intuitive, immersive user flows.",
      "Built animated landing page experiences, Three.js 3D scenes and Blender assets, then led major rendering optimizations.",
    ],
    skills: ["Svelte", "Three.js", "Blender", "Figma", "UX/UI", "Branding"],
  },
  {
    company: "Dassault Systèmes",
    role: "Software Engineer · R&D Delmia",
    context: "3D software for industry",
    period: "Sept 2023 → Jan 2025 · 2 years",
    bullets: [
      "Led the end-to-end architecture and redesign of a documentation engine, taking it from requirements gathering to production deployment. Defined user needs, selected the technical stack, developed custom plugins, and set up Docker + GitLab CI/CD infrastructure.",
      "Owned the integration of a code demo tool in a Product Owner role, coordinating with an international team and applying a user-centered approach across product, UX and technical implementation.",
    ],
    skills: ["Docker", "GitLab CI/CD", "Plugins", "Product Owner", "UX"],
  },
  {
    company: "JuniorISEP",
    role: "Tech Lead",
    context: "Junior Dev Shop",
    period: "Feb 2023 → Sept 2024 · 1.5 years",
    bullets: [
      "Created JE Intervenants, a full Angular PWA combining a user-facing mobile app and an admin dashboard. Designed both mobile and desktop interfaces, led frontend development and structured the project with several collaborators.",
      "Technical qualification of bespoke client apps, including projects for Ampère-Renault, assessing feasibility and defining appropriate technical approaches.",
    ],
    skills: ["Angular", "PWA", "Frontend", "Scrum Master", "Prototyping"],
  },
  {
    company: "Enoria",
    role: "Frontend Dev",
    context: "ERP / CRM Software",
    period: "Sept 2022 · 6 months",
    bullets: [
      "Delivered a full UI redesign and UX improvements for a CRM-like management application, making the product clearer, more modern and easier to use. Bootstrap, SCSS and JavaScript in an agile environment.",
    ],
    skills: ["Bootstrap", "SCSS", "JavaScript", "Agile"],
  },
];

const experiencesFr: Experience[] = [
  {
    company: "Runelabs",
    role: "Founding Engineer",
    context: "Studio de jeu Web3",
    period: "Janv. 2025 → aujourd'hui · 1,5 an",
    bullets: [
      "Conception de Midgard de zéro, en réalisant l'UX/UI complète, le logo, l'identité de marque et les assets 3D avec une forte identité gaming et une approche mobile-first responsive. Contribution à façonner une plateforme permettant la monétisation décentralisée pour les studios indépendants.",
      "Direction du développement frontend complet de PonziLand, pour livrer une expérience de jeu on-chain soignée à la croisée du gaming et de la crypto. Collaboration étroite avec le Game Designer pour transformer le gameplay en parcours utilisateurs intuitifs et immersifs.",
      "Développement de landing pages animées, scènes 3D Three.js et assets Blender, puis pilotage d'optimisations majeures de rendu.",
    ],
    skills: ["Svelte", "Three.js", "Blender", "Figma", "UX/UI", "Branding"],
  },
  {
    company: "Dassault Systèmes",
    role: "Software Engineer · R&D Delmia",
    context: "Logiciel 3D pour l'industrie",
    period: "Sept. 2023 → janv. 2025 · 2 ans",
    bullets: [
      "Pilotage de l'architecture et du redesign de bout en bout d'un moteur de documentation, du recueil des besoins jusqu'au déploiement en production. Définition des besoins utilisateurs, choix de la stack technique, développement de plugins sur mesure, et mise en place de l'infrastructure Docker + GitLab CI/CD.",
      "Intégration d'un outil de démo de code en tant que Product Owner, en coordonnant une équipe internationale et en appliquant une approche centrée utilisateur sur les axes produit, UX et technique.",
    ],
    skills: ["Docker", "GitLab CI/CD", "Plugins", "Product Owner", "UX"],
  },
  {
    company: "JuniorISEP",
    role: "Tech Lead",
    context: "Junior-Entreprise de développement",
    period: "Févr. 2023 → sept. 2024 · 1,5 an",
    bullets: [
      "Création de JE Intervenants, une PWA Angular combinant une application mobile pour les utilisateurs et un dashboard d'administration. Conception des interfaces mobiles et desktop, direction du développement frontend et structuration du projet avec plusieurs collaborateurs.",
      "Qualification technique d'applications client sur mesure, notamment pour Ampère-Renault, en évaluant la faisabilité et en définissant les approches techniques adaptées.",
    ],
    skills: ["Angular", "PWA", "Frontend", "Scrum Master", "Prototyping"],
  },
  {
    company: "Enoria",
    role: "Frontend Dev",
    context: "Logiciel ERP / CRM",
    period: "Sept. 2022 · 6 mois",
    bullets: [
      "Refonte complète de l'UI et améliorations UX d'une application de gestion type CRM, pour rendre le produit plus clair, plus moderne et plus simple à utiliser. Bootstrap, SCSS et JavaScript en environnement agile.",
    ],
    skills: ["Bootstrap", "SCSS", "JavaScript", "Agile"],
  },
];

const educationEn: Education[] = [
  {
    school: "ISEP",
    degree: "Engineering Degree",
    location: "Paris, France",
    duration: "5 years",
    note: "School coding projects, game dev and hackathons.",
  },
  {
    school: "Glyndwr University",
    degree: "Exchange",
    location: "Wrexham, Wales",
    duration: "6 months",
    note: "UX design courses, mobile app development.",
  },
  {
    school: "Presidency University",
    degree: "Exchange",
    location: "Bangalore, India",
    duration: "3 months",
    note: "Management class, blockchain group project.",
  },
];

const educationFr: Education[] = [
  {
    school: "ISEP",
    degree: "Diplôme d'ingénieur",
    location: "Paris, France",
    duration: "5 ans",
    note: "Projets de code à l'école, game dev et hackathons.",
  },
  {
    school: "Glyndwr University",
    degree: "Échange",
    location: "Wrexham, Pays de Galles",
    duration: "6 mois",
    note: "Cours d'UX design, développement d'applications mobiles.",
  },
  {
    school: "Presidency University",
    degree: "Échange",
    location: "Bangalore, Inde",
    duration: "3 mois",
    note: "Cours de management, projet de groupe blockchain.",
  },
];

export function getExperiences(locale: Locale): Experience[] {
  return locale === "fr" ? experiencesFr : experiencesEn;
}

export function getEducation(locale: Locale): Education[] {
  return locale === "fr" ? educationFr : educationEn;
}

export type Recommendation = {
  name: string;
  /** Job title: Locale-Agnostic Term, stays EN across locales. */
  role: string;
  company: string;
  /** ISO date the recommendation was received. */
  date: string;
  rating: number;
  /**
   * Verbatim recommendation, one entry per paragraph. Originals were written
   * in French; `en` is a translation. An empty array hides the quote block and
   * renders the person card alone.
   */
  quote: Record<Locale, string[]>;
  /**
   * Portfolio slugs worked on together. Rendered as links; an empty array is
   * fine when the work never became a portfolio entry.
   */
  projects: string[];
  /**
   * Filename inside `src/assets/recommendations/`. Falls back to an initials
   * monogram when the file is absent.
   */
  avatar?: string;
  /** Rendered wide, as the lead card of the section. At most one. */
  featured?: boolean;
};

const recommendations: Recommendation[] = [
  {
    name: "Hippolyte Bach",
    role: "CTO",
    company: "GreenLeaze",
    date: "2026-06-08",
    rating: 5,
    avatar: "hippolyte-bach.jpg",
    quote: {
      en: [
        "Hadouin showed real rigour across the whole engagement and handled a number of projects that are in production today, efficiently and professionally.",
      ],
      fr: [
        "Hadouin a fait preuve de beaucoup de sérieux sur l'ensemble de sa mission et a su gérer de nombreux projets aujourd'hui en production de manière efficace et professionnelle.",
      ],
    },
    projects: ["je-intervenants"],
  },
  {
    name: "Raphael Cournault",
    role: "President",
    company: "Enoria",
    date: "2026-06-03",
    rating: 5,
    avatar: "raphael-cournault.jpg",
    quote: {
      en: [
        "I had Hadouin work on frontend parts, VueJS and an application redesign. Hadouin is a pleasant freelancer, very strong on the frontend, with a genuine sense of user experience. He fitted in well within a team of 3 on the VueJS rebuild of a management form originally built in Bootstrap. Vue component creation, integration, testing.",
      ],
      fr: [
        "J'ai fait travailler Hadouin sur des parties front, VueJS et redesign d'application. Hadouin est un freelance agréable, très compétent en front, qui a un vrai sens de l'expérience utilisateur. Il s'est bien intégré dans une équipe de 3 sur un projet de refonte en VueJS de formulaire de Gestion à l'origine en Bootstrap. Création de composant Vue, intégration, test.",
      ],
    },
    projects: ["enoria"],
  },
  {
    name: "Valentin Ricard",
    role: "CTO",
    company: "Runelabs",
    date: "2026-06-03",
    rating: 5,
    avatar: "valentin-ricard.jpg",
    quote: {
      en: [
        "I had the pleasure of working with Hadouin at RuneLabs, where he contributed to the frontend development of both our game products. Skilled in Three.js, Svelte and Blender, he can carry a project end to end with remarkable autonomy, from development to documentation, 2D/3D asset creation and application maintenance.",
        "Beyond his technical skills, Hadouin stands out for his ability to ship polished user experiences and to level up the people around him on the technologies he works with.",
      ],
      fr: [
        "J'ai eu le plaisir de collaborer avec Hadouin chez RuneLabs, où il a contribué au développement frontend de nos deux produits de jeu. Maîtrisant Three.js, Svelte et Blender, il est capable de porter un projet de bout en bout avec une autonomie remarquable, du développement à la documentation, la création d'assets 2D/3D et la maintenance applicative.",
        "Au-delà de ses compétences techniques, Hadouin se distingue par sa capacité à livrer des expériences utilisateur soignées et à faire monter en compétences ses collaborateurs sur les technologies qu'il utilise.",
      ],
    },
    projects: ["midgard", "ponziland"],
    featured: true,
  },
];

export function getRecommendations(_locale: Locale): Recommendation[] {
  return recommendations;
}
