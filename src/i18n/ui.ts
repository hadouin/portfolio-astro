export const locales = ["en", "fr"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  fr: "Français",
};

export const ogLocaleTag: Record<Locale, string> = {
  en: "en_US",
  fr: "fr_FR",
};

export const htmlLangTag: Record<Locale, string> = {
  en: "en",
  fr: "fr",
};

export const dateLocaleTag: Record<Locale, string> = {
  en: "en-US",
  fr: "fr-FR",
};

export const ui = {
  en: {
    "site.title.fallback": "Hadouin Leroy — Creative Developer",
    "site.description":
      "Hi, I'm Hadouin — freelance creative dev in Paris. I build things for the web, turning raw ideas into polished products.",
    "site.image.alt":
      "Hadouin Leroy — creative developer building things for the web",

    "nav.about": "About",
    "nav.experience": "Experience",
    "nav.projects": "Projects",
    "nav.contact": "Contact",
    "nav.blog": "Blog",
    "nav.cv": "CV",
    "nav.cv.en": "English",
    "nav.cv.fr": "Français",
    "nav.hireMe": "Hire me!",

    "hero.greeting": "Hi, my name is",
    "hero.tagline": "I build things for the web",
    "hero.intro":
      "I'm a freelance creative dev turning raw ideas into polished products.",

    "about.title": "About me",
    "about.p1":
      "Hello! My name is Hadouin LEROY, a creative developer with a strong technical background, shaped by hands-on experience designing and building applications from scratch. I like turning raw ideas into polished, tangible products.",
    "about.p2":
      "I graduated from ISEP engineering school in Paris (2025), with exchanges at Glyndwr University in Wales (UX design, mobile apps) and Presidency University in Bangalore (management, blockchain). Along the way I worked at Dassault Systèmes, Enoria, JuniorISEP, and now Runelabs.",
    "about.p3":
      "Today I'm a freelance creative dev, also wearing hats as a UX designer and certified scrum master. Fluent in English, native in French.",
    "about.image.alt":
      "Portrait of Hadouin Leroy, creative developer based in Paris",

    "experience.title": "My experience",
    "experience.subtitle": "stuff i've shipped along the way",

    "education.title": "Education",
    "education.subtitle": "where i trained",

    "projects.title": "My projects",
    "projects.subtitle": "things i've done during my life",

    "cta.title": "Build things with me.",
    "cta.body":
      "I'm very flexible both in learning quickly different subjects but also in adapting and being empathic to my fellow teammates.",
    "cta.contact": "Get In Touch",
    "cta.blog": "Check out my blog !",

    "contact.page.title": "Contact",
    "contact.page.desc": "I'm the one you need.",
    "contact.page.headline": "Get in touch",
    "contact.page.body":
      "Have something you want to develop ? Fill up the form or send an email directly.",
    "contact.page.location": "Paris, France",
    "contact.page.cv.en": "CV — English",
    "contact.page.cv.fr": "CV — Français",
    "contact.form.name": "Full Name",
    "contact.form.email": "Email Address",
    "contact.form.email.label": "Email Address",
    "contact.form.message": "Your Message",
    "contact.form.submit": "Send Message",
    "contact.form.error.name": "Please provide your full name.",
    "contact.form.error.email.empty": "Please provide your email address.",
    "contact.form.error.email.invalid":
      "Please provide a valid email address.",
    "contact.form.error.message": "Please enter your message.",
    "contact.form.sending": "Sending...",
    "contact.form.crash": "Something went wrong!",

    "blog.page.title": "My Blog",
    "blog.page.desc": "I write about things I learn and projects I work on.",
    "blog.page.metaTitle": "Blog",
    "blog.page.metaDescription":
      "Articles, tutorials and notes by Hadouin Leroy on creative development, 3D workflows, Blender, web engineering and onchain gaming.",
    "blog.post.back": "← Back to Blog",
    "blog.post.copy": "Copy",
    "blog.post.copied": "Copied",
    "blog.post.copyError": "Error",
    "blog.post.section": "Projects",
    "blog.post.relatedProjects": "Related projects",

    "project.back.short": "Back to projects",
    "project.back.long": "← Back to Projects",
    "project.present": "Present",
    "project.github": "View on GitHub",
    "project.demo": "Live Demo",
    "project.continue": "Continue reading",
    "project.translationPending":
      "FR translation pending — showing the English version.",

    "footer.copyright": "Copyright © {year} Hadouin. All rights reserved.",

    "contact.meta.description":
      "Get in touch with Hadouin Leroy — creative developer based in Paris. Reach out for freelance work, collaborations or gaming and web projects.",

    "person.schemaDescription":
      "Freelance creative developer in Paris with a strong technical background. Founding Engineer at Runelabs. Builds web apps, 3D experiences (Blender, Three.js), and onchain games (Starknet, Dojo). UX designer and certified Scrum Master.",

    "glance.title": "At a glance",
    "glance.who.label": "Who",
    "glance.who.value": "Hadouin Leroy — creative developer",
    "glance.what.label": "What",
    "glance.what.value":
      "Web apps, 3D (Blender, Three.js), onchain games (Starknet, Dojo)",
    "glance.now.label": "Now",
    "glance.now.value": "Founding Engineer @ Runelabs",
    "glance.where.label": "Where",
    "glance.where.value": "Paris, France",
    "glance.contact.label": "Contact",
    "glance.contact.value": "contact@hadouin.com",

    "footer.home": "Home",
    "footer.blog": "Blog",
    "footer.contact": "Contact",
    "footer.cv": "CV",
    "footer.llms": "llms.txt",

    "breadcrumb.home": "Home",
    "breadcrumb.projects": "Projects",
    "breadcrumb.blog": "Blog",

    "switcher.toFr": "Voir en français",
    "switcher.toEn": "View in English",
  },
  fr: {
    "site.title.fallback": "Hadouin Leroy — Creative Developer",
    "site.description":
      "Salut, moi c'est Hadouin — creative dev freelance à Paris. Je construis des choses pour le web et transforme des idées brutes en produits aboutis.",
    "site.image.alt":
      "Hadouin Leroy — creative developer qui construit des choses pour le web",

    "nav.about": "À propos",
    "nav.experience": "Expérience",
    "nav.projects": "Projets",
    "nav.contact": "Contact",
    "nav.blog": "Blog",
    "nav.cv": "CV",
    "nav.cv.en": "English",
    "nav.cv.fr": "Français",
    "nav.hireMe": "Recrutez-moi !",

    "hero.greeting": "Salut, je m'appelle",
    "hero.tagline": "Je construis des choses pour le web",
    "hero.intro":
      "Je suis creative dev freelance et je transforme des idées brutes en produits aboutis.",

    "about.title": "À propos de moi",
    "about.p1":
      "Bonjour ! Je m'appelle Hadouin LEROY, un creative developer avec une solide base technique, forgée par l'expérience concrète du design et du développement d'applications de zéro. J'aime transformer des idées brutes en produits aboutis et tangibles.",
    "about.p2":
      "Diplômé de l'ISEP à Paris (2025), avec des échanges à Glyndwr University au pays de Galles (UX design, applications mobiles) et à Presidency University à Bangalore (management, blockchain). En chemin, j'ai travaillé chez Dassault Systèmes, Enoria, JuniorISEP, et aujourd'hui chez Runelabs.",
    "about.p3":
      "Aujourd'hui, je suis creative dev freelance, avec aussi des casquettes d'UX designer et de Scrum Master certifié. Anglais courant, français natif.",
    "about.image.alt":
      "Portrait de Hadouin Leroy, creative developer basé à Paris",

    "experience.title": "Mon expérience",
    "experience.subtitle": "ce que j'ai livré en chemin",

    "education.title": "Formation",
    "education.subtitle": "là où j'ai été formé",

    "projects.title": "Mes projets",
    "projects.subtitle": "des choses faites au fil du temps",

    "cta.title": "Construisons ensemble.",
    "cta.body":
      "Je suis flexible : j'apprends vite sur des sujets variés et je m'adapte facilement à mon équipe avec empathie.",
    "cta.contact": "Me contacter",
    "cta.blog": "Voir mon blog !",

    "contact.page.title": "Contact",
    "contact.page.desc": "Je suis celui qu'il vous faut.",
    "contact.page.headline": "Prenez contact",
    "contact.page.body":
      "Un projet à développer ? Remplissez le formulaire ou envoyez-moi un email directement.",
    "contact.page.location": "Paris, France",
    "contact.page.cv.en": "CV — English",
    "contact.page.cv.fr": "CV — Français",
    "contact.form.name": "Nom complet",
    "contact.form.email": "Adresse email",
    "contact.form.email.label": "Adresse email",
    "contact.form.message": "Votre message",
    "contact.form.submit": "Envoyer",
    "contact.form.error.name": "Veuillez indiquer votre nom complet.",
    "contact.form.error.email.empty": "Veuillez indiquer votre email.",
    "contact.form.error.email.invalid": "Veuillez saisir un email valide.",
    "contact.form.error.message": "Veuillez écrire un message.",
    "contact.form.sending": "Envoi…",
    "contact.form.crash": "Une erreur s'est produite !",

    "blog.page.title": "Mon blog",
    "blog.page.desc":
      "J'y écris sur ce que j'apprends et les projets sur lesquels je travaille.",
    "blog.page.metaTitle": "Blog",
    "blog.page.metaDescription":
      "Articles, tutoriels et notes de Hadouin Leroy sur le creative development, les workflows 3D, Blender, l'ingénierie web et l'onchain gaming.",
    "blog.post.back": "← Retour au blog",
    "blog.post.copy": "Copier",
    "blog.post.copied": "Copié",
    "blog.post.copyError": "Erreur",
    "blog.post.section": "Projets",
    "blog.post.relatedProjects": "Projets associés",

    "project.back.short": "Retour aux projets",
    "project.back.long": "← Retour aux projets",
    "project.present": "Aujourd'hui",
    "project.github": "Voir sur GitHub",
    "project.demo": "Démo live",
    "project.continue": "Reprendre la lecture",
    "project.translationPending":
      "Traduction FR en attente — version anglaise affichée.",

    "footer.copyright":
      "Copyright © {year} Hadouin. Tous droits réservés.",

    "contact.meta.description":
      "Contactez Hadouin Leroy — creative developer basé à Paris. Disponible pour des missions freelance, collaborations, projets gaming et web.",

    "person.schemaDescription":
      "Creative developer freelance à Paris avec une solide base technique. Founding Engineer chez Runelabs. Conçoit des apps web, des expériences 3D (Blender, Three.js) et des jeux onchain (Starknet, Dojo). UX designer et Scrum Master certifié.",

    "glance.title": "En bref",
    "glance.who.label": "Qui",
    "glance.who.value": "Hadouin Leroy — creative developer",
    "glance.what.label": "Quoi",
    "glance.what.value":
      "Apps web, 3D (Blender, Three.js), jeux onchain (Starknet, Dojo)",
    "glance.now.label": "Actuellement",
    "glance.now.value": "Founding Engineer @ Runelabs",
    "glance.where.label": "Où",
    "glance.where.value": "Paris, France",
    "glance.contact.label": "Contact",
    "glance.contact.value": "contact@hadouin.com",

    "footer.home": "Accueil",
    "footer.blog": "Blog",
    "footer.contact": "Contact",
    "footer.cv": "CV",
    "footer.llms": "llms.txt",

    "breadcrumb.home": "Accueil",
    "breadcrumb.projects": "Projets",
    "breadcrumb.blog": "Blog",

    "switcher.toFr": "Voir en français",
    "switcher.toEn": "View in English",
  },
} as const;

export type TranslationKey = keyof (typeof ui)["en"];
