import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  SUBPAGE_PATHS,
  aboutPageData,
  blogPageData,
  careersPageData,
  casosDeUsoPageData,
  cookiePolicyPageData,
  documentationPageData,
  glosarioPageData,
  guidesPageData,
  privacyPolicyPageData,
  supportPageData,
  termsOfServicePageData
} from "./data/subpagesData";
import { esTranslations } from "./i18n/es";
import {
  detectBrowserLanguage,
  enTranslations,
  ptTranslations,
  translationsByLanguage
} from "./i18n/translations";

const publicDir = path.resolve(process.cwd(), "public");

describe("Sublimifyer Landing Assets, i18n, and Subpage Data (TASK-1)", () => {
  it("has all required static assets downloaded in public/ with non-zero size", () => {
    const expectedAssets = [
      "subly-mark-teal.svg",
      "subly-icon-teal.png",
      "subly-mark-teal.png",
      "placeholder.jpg",
      "app-mock.html",
      "shirt-scroll/sublimifyer-scroll.mp4",
      "hero/hero-sublimacion.webp",
      "hero/hero-dtf-sponsors.webp",
      "hero/hero-molde-frente.webp",
      "hero/hero-producto.webp",
      "hero/hero-dtf-cachimbas.webp",
      "hero/hero-corte.webp",
      "translations/es.json",
      "translations/en.json",
      "translations/pt.json"
    ];

    for (const relPath of expectedAssets) {
      const fullPath = path.join(publicDir, relPath);
      expect(fs.existsSync(fullPath), `Missing asset: ${relPath}`).toBe(true);
      const stat = fs.statSync(fullPath);
      expect(stat.size, `Empty asset: ${relPath}`).toBeGreaterThan(100);
    }
  });

  it("provides complete es, en, and pt translation dictionaries", () => {
    expect(esTranslations.hero.title).toContain("Producí más");
    expect(esTranslations.hero.titleLine1).toContain("Todo tu proceso de producción,");
    expect(esTranslations.pricing.starter.price).toBe("99k ARS");
    expect(esTranslations.faq.question14?.question).toContain("desperdicio de tela");
    expect(enTranslations.hero?.title).toBeTruthy();
    expect(ptTranslations.hero?.title).toBeTruthy();
    expect(translationsByLanguage.es).toBe(esTranslations);
    expect(detectBrowserLanguage()).toBe("es");
  });

  it("exports all 11 subpage routes and structured data matching sublimifyer.com", () => {
    expect(SUBPAGE_PATHS).toHaveLength(11);
    expect(documentationPageData.categories).toHaveLength(4);
    expect(documentationPageData.quickLinks).toHaveLength(3);
    expect(guidesPageData.featuredGuides).toHaveLength(2);
    expect(guidesPageData.quickStartItems).toHaveLength(3);
    expect(guidesPageData.categories).toHaveLength(3);
    expect(blogPageData.posts).toHaveLength(10);
    expect(blogPageData.categories).toHaveLength(7);
    expect(casosDeUsoPageData.cases).toHaveLength(4);
    expect(glosarioPageData.terms).toHaveLength(8);
    expect(glosarioPageData.terms[0].letter).toBe("A");
    expect(glosarioPageData.terms[7].letter).toBe("H");
    expect(supportPageData.contactOptions).toHaveLength(3);
    expect(supportPageData.faqCategories).toHaveLength(3);
    expect(supportPageData.resources).toHaveLength(4);
    expect(aboutPageData.valueIcons).toEqual(["Target", "Users", "Zap", "Heart"]);
    expect(careersPageData.benefitIcons).toHaveLength(6);
    expect(privacyPolicyPageData.contact.email).toBe("soporte@sublimifyer.com");
    expect(termsOfServicePageData.contact.email).toBe("soporte@sublimifyer.com");
    expect(cookiePolicyPageData.contact.email).toBe("soporte@sublimifyer.com");
  });
});
