import {
  defaultLocale,
  locales,
  ui,
  dateLocaleTag,
  type Locale,
  type TranslationKey,
} from "./ui";

export { locales, defaultLocale, type Locale };

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function getLocaleFromUrl(url: URL): Locale {
  const segments = url.pathname.split("/").filter(Boolean);
  const first = segments[0];
  if (first && isLocale(first)) return first;
  return defaultLocale;
}

export function stripLocaleFromPath(pathname: string): string {
  const trimmed = pathname.replace(/\/$/, "") || "/";
  for (const loc of locales) {
    if (loc === defaultLocale) continue;
    if (trimmed === `/${loc}`) return "/";
    if (trimmed.startsWith(`/${loc}/`)) return trimmed.slice(loc.length + 1);
  }
  return trimmed;
}

export function localizedPath(path: string, locale: Locale): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const stripped = stripLocaleFromPath(normalized);
  if (locale === defaultLocale) return stripped;
  if (stripped === "/") return `/${locale}`;
  return `/${locale}${stripped}`;
}

export function useTranslations(locale: Locale) {
  return function t(
    key: TranslationKey,
    vars?: Record<string, string | number>,
  ): string {
    const dict = ui[locale] ?? ui[defaultLocale];
    let value = (dict as Record<string, string>)[key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        value = value.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      }
    }
    return value;
  };
}

export function formatDate(
  date: Date,
  locale: Locale,
  opts: Intl.DateTimeFormatOptions = { month: "short", year: "numeric" },
): string {
  return new Intl.DateTimeFormat(dateLocaleTag[locale], opts).format(date);
}

export function formatLongDate(date: Date, locale: Locale): string {
  return formatDate(date, locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
