import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { App } from '@/App';
import { LandingApp } from '@/landing/LandingApp';
import {
  isSubpagePath,
  navigateTo,
  parseAppRoute,
  useLandingRouteStore,
} from '@/landing/router/landingRouteStore';
import {
  SUBPAGE_PATHS,
  type SubpagePath,
} from '@/landing/data/subpagesData';
import { HERO_CARDS } from '@/landing/components/HeroCardMarquee';
import { SOLUTIONS_VIDEO_PLAYBACK_RATE } from '@/landing/components/SolutionsSection';
import {
  PRICING_BG_GRADIENT,
  resolveDefaultPricingCurrency,
} from '@/landing/components/PricingSection';
import { CTA_BOTTOM_FADE_GRADIENT } from '@/landing/components/CtaSection';
import { FOOTER_OVERLAY_GRADIENT } from '@/landing/components/LandingFooter';
import {
  WHATSAPP_APPEAR_DELAY_MS,
  buildWhatsAppUrl,
} from '@/landing/components/WhatsAppFloatingButton';
import {
  esTranslations,
  enTranslations,
  ptTranslations,
} from '@/landing/i18n/translations';
import { dbService } from '@/core/database/db';

describe('TASK-5: End-to-End Integration Test Suite for 1:1 Sublimifyer Landing Replica & Routing Separation', () => {
  beforeEach(() => {
    navigateTo('/');
  });

  it('separates routing cleanly between / and /landing (landing-home), all 11 subpages (/subpage and /landing/subpage), and /app (workshop)', () => {
    expect(parseAppRoute('/', '')).toEqual({
      mode: 'landing-home',
      pathname: '/',
      hash: '',
      subpagePath: null,
    });

    expect(parseAppRoute('/landing', '')).toEqual({
      mode: 'landing-home',
      pathname: '/landing',
      hash: '',
      subpagePath: null,
    });

    expect(parseAppRoute('/landing/', '#pricing')).toEqual({
      mode: 'landing-home',
      pathname: '/landing',
      hash: '#pricing',
      subpagePath: null,
    });

    expect(SUBPAGE_PATHS).toHaveLength(11);
    for (const subpagePath of SUBPAGE_PATHS) {
      expect(isSubpagePath(subpagePath)).toBe(true);

      const directRoute = parseAppRoute(subpagePath, '');
      expect(directRoute).toEqual({
        mode: 'landing-subpage',
        pathname: subpagePath,
        hash: '',
        subpagePath,
      });

      const prefixedRoute = parseAppRoute(`/landing${subpagePath}`, '');
      expect(prefixedRoute).toEqual({
        mode: 'landing-subpage',
        pathname: subpagePath,
        hash: '',
        subpagePath,
      });

      const hashRoute = parseAppRoute('/', `#${subpagePath}`);
      expect(hashRoute).toEqual({
        mode: 'landing-subpage',
        pathname: subpagePath,
        hash: '',
        subpagePath,
      });
    }

    expect(parseAppRoute('/app', '')).toEqual({
      mode: 'workshop',
      pathname: '/app',
      hash: '',
      subpagePath: null,
    });

    expect(parseAppRoute('/app/orders', '')).toEqual({
      mode: 'workshop',
      pathname: '/app',
      hash: '',
      subpagePath: null,
    });

    expect(parseAppRoute('/', '#/app')).toEqual({
      mode: 'workshop',
      pathname: '/app',
      hash: '',
      subpagePath: null,
    });
  });

  const getEsArsHomeHtml = (() => {
    let cached: string | null = null;
    return () => {
      if (!cached) {
        navigateTo('/');
        cached = renderToStaticMarkup(
          React.createElement(LandingApp, {
            initialLanguage: 'es',
            initialCurrency: 'ARS',
            forceWhatsAppVisible: true,
          })
        );
      }
      return cached;
    };
  })();

  it('renders <LandingApp /> across all 3 languages (es, en, pt) and both pricing currencies (ARS, USD)', () => {
    const htmlEsArs = getEsArsHomeHtml();
    expect(htmlEsArs).toContain(esTranslations.hero.titleLine1);
    expect(htmlEsArs).toContain(esTranslations.hero.titleLine2);
    expect(htmlEsArs).toContain(esTranslations.pricing.title);
    expect(htmlEsArs).toContain('99k ARS');
    expect(htmlEsArs).toContain('199k ARS');
    expect(htmlEsArs).toContain('299k ARS');
    expect(htmlEsArs).toContain('* +49 ARS por prenda adicional');

    const htmlEnUsd = renderToStaticMarkup(
      React.createElement(LandingApp, {
        initialLanguage: 'en',
        initialCurrency: 'USD',
        forceWhatsAppVisible: true,
      })
    );
    expect(htmlEnUsd).toContain(enTranslations.hero.titleLine1);
    expect(htmlEnUsd).toContain(enTranslations.hero.titleLine2);
    expect(htmlEnUsd).toContain(enTranslations.pricing.title);
    expect(htmlEnUsd).toContain('Initial');
    expect(htmlEnUsd).toContain('Professional');
    expect(htmlEnUsd).toContain('Enterprise');
    expect(htmlEnUsd).toContain('69 USD');
    expect(htmlEnUsd).toContain('139 USD');
    expect(htmlEnUsd).toContain('199 USD');
    expect(htmlEnUsd).toContain('* +0.03 USD per additional garment');

    const htmlPtUsd = renderToStaticMarkup(
      React.createElement(LandingApp, {
        initialLanguage: 'pt',
        initialCurrency: 'USD',
        forceWhatsAppVisible: true,
      })
    );
    expect(htmlPtUsd).toContain(ptTranslations.hero.titleLine1);
    expect(htmlPtUsd).toContain(ptTranslations.hero.titleLine2);
    expect(htmlPtUsd).toContain(ptTranslations.pricing.title);
    expect(htmlPtUsd).toContain('Profissional');
    expect(htmlPtUsd).toContain('Empresarial');
    expect(htmlPtUsd).toContain('69 USD');
    expect(htmlPtUsd).toContain('139 USD');
    expect(htmlPtUsd).toContain('199 USD');
  });

  it('verifies all 10 Hero marquee cards, #soluciones video (playbackRate = 1.5), #beneficios 4 metrics, #demo /app-mock.html#designer iframe, #pricing 24-stop gradient & 3 plans, #cta, 4-column Footer, and WhatsAppFloatingButton', () => {
    expect(HERO_CARDS).toHaveLength(10);
    expect(SOLUTIONS_VIDEO_PLAYBACK_RATE).toBe(1.5);
    expect(WHATSAPP_APPEAR_DELAY_MS).toBe(2000);

    // Count 24 gradient stops in PRICING_BG_GRADIENT
    const gradientStopMatches = PRICING_BG_GRADIENT.match(/#[0-9a-fA-F]{6}/g) ?? [];
    expect(gradientStopMatches).toHaveLength(24);
    expect(PRICING_BG_GRADIENT).toContain('#fbfbfc 0%');
    expect(PRICING_BG_GRADIENT).toContain('#180d33 calc(100% - 20px)');
    expect(CTA_BOTTOM_FADE_GRADIENT).toContain('#090414 calc(100% - 12px)');
    expect(FOOTER_OVERLAY_GRADIENT).toContain('#090414 100%');

    const html = getEsArsHomeHtml();

    // 1. Hero 10 marquee cards (6 WebP images + 4 DOM UI cards)
    expect(html).toContain('/hero/hero-sublimacion.webp');
    expect(html).toContain('/hero/hero-dtf-sponsors.webp');
    expect(html).toContain('/hero/hero-molde-frente.webp');
    expect(html).toContain('/hero/hero-producto.webp');
    expect(html).toContain('/hero/hero-dtf-cachimbas.webp');
    expect(html).toContain('/hero/hero-corte.webp');
    expect(html).toContain('#1042');
    expect(html).toContain('Club Atlético Progreso');
    expect(html).toContain(esTranslations.hero.cardTrackStep1);
    expect(html).toContain(esTranslations.hero.cardTrackStep2);
    expect(html).toContain(esTranslations.hero.cardTrackStep3);
    expect(html).toContain(esTranslations.hero.cardTrackStep4);
    expect(html).toContain(esTranslations.hero.cardTrackStep5);
    expect(html).toContain('18,4 m');
    expect(html).toContain('Mix del mes');
    expect(html).toContain('52%');
    expect(html).toContain('31%');
    expect(html).toContain('17%');

    // 2. #soluciones video showcase with playbackRate = 1.5
    expect(html).toContain('id="soluciones"');
    expect(html).toContain('/shirt-scroll/sublimifyer-scroll.mp4');
    expect(html).toContain('data-playback-rate="1.5"');

    // 3. #beneficios 4 metrics
    expect(html).toContain('id="beneficios"');
    expect(html).toContain('Menos desperdicio de tela');
    expect(html).toContain('Menos errores de producción');
    expect(html).toContain('Menos trabajo manual');
    expect(html).toContain('Más producción');
    for (const item of esTranslations.benefits.items) {
      expect(html).toContain(item.metric);
    }

    // 4. #demo /app-mock.html#designer iframe
    expect(html).toContain('id="demo"');
    expect(html).toContain('src="/app-mock.html#designer"');

    // 5. #pricing 3 plans & currency options
    expect(html).toContain('id="pricing"');
    expect(html).toContain('Inicial');
    expect(html).toContain('Profesional');
    expect(html).toContain('Empresarial');
    expect(html).toContain('data-currency="ARS"');
    expect(html).toContain('data-currency="USD"');
    expect(
      resolveDefaultPricingCurrency({
        storedValue: null,
        timeZone: 'America/Argentina/Buenos_Aires',
        languages: ['es-AR'],
      })
    ).toBe('ARS');
    expect(
      resolveDefaultPricingCurrency({
        storedValue: null,
        timeZone: 'America/New_York',
        languages: ['en-US'],
      })
    ).toBe('USD');

    // 6. #cta
    expect(html).toContain('id="cta"');
    expect(html).toContain('Empezá hoy. Sin tarjeta.');
    expect(html).toContain('Comenzar prueba gratuita');

    // 7. LandingFooter 4 columns (Brand, Producto, Recursos, Empresa) + 11 subpage links
    expect(html).toContain('md:grid-cols-4');
    expect(html).toContain(esTranslations.footer.product);
    expect(html).toContain(esTranslations.footer.resources);
    expect(html).toContain(esTranslations.footer.company);
    for (const subpagePath of SUBPAGE_PATHS) {
      expect(html).toContain(`href="${subpagePath}"`);
    }

    // 8. WhatsAppFloatingButton
    expect(html).toContain('fixed bottom-6 right-6 z-50');
    expect(html).toContain('¡Chatea con nosotros!');
    expect(html).toContain('animate-ping');
    expect(buildWhatsAppUrl('+54 9 221 691-1176', 'Hola')).toBe(
      'https://wa.me/5492216911176?text=Hola'
    );
  });

  it('renders all 11 subpages via LandingApp when routed to /<subpage> and /landing/<subpage>', () => {
    const expectedHeadings: Record<SubpagePath, string> = {
      '/documentation': 'Documentación',
      '/guides': 'Guías',
      '/blog': 'Recursos para talleres de sublimación',
      '/casos-de-uso': 'Casos de Uso de CimaTex',
      '/glosario': 'Glosario de produccion para talleres de sublimacion',
      '/support': 'Centro de Soporte',
      '/about': 'Acerca de CimaTex',
      '/careers': 'Únete a Nuestro Equipo',
      '/privacy-policy': 'Política de Privacidad',
      '/terms-of-service': 'Términos de Servicio',
      '/cookie-policy': 'Política de Cookies',
    };

    for (const subpagePath of SUBPAGE_PATHS) {
      navigateTo(`/landing${subpagePath}`);
      expect(useLandingRouteStore.getState().mode).toBe('landing-subpage');
      expect(useLandingRouteStore.getState().subpagePath).toBe(subpagePath);

      navigateTo(subpagePath);
      expect(useLandingRouteStore.getState().mode).toBe('landing-subpage');
      expect(useLandingRouteStore.getState().subpagePath).toBe(subpagePath);

      const subpageHtml = renderToStaticMarkup(
        React.createElement(LandingApp, { initialLanguage: 'es' })
      );
      expect(subpageHtml).toContain('data-testid="landing-subpage-view"');
      expect(subpageHtml).toContain(`data-subpage="${subpagePath}"`);
      expect(subpageHtml).toContain(expectedHeadings[subpagePath]);
    }
  });

  it('isolates WorkshopApp and does not trigger dbService.initialize() when rendering LandingApp or <App /> on landing routes', () => {
    const initSpy = vi.spyOn(dbService, 'initialize');

    try {
      navigateTo('/');
      const homeHtml = renderToStaticMarkup(React.createElement(App));
      expect(homeHtml).toContain('data-testid="landing-root"');
      expect(homeHtml).toContain('data-testid="landing-home-view"');
      expect(homeHtml).not.toContain('data-testid="workshop-app-shell"');
      expect(initSpy).not.toHaveBeenCalled();

      navigateTo('/landing');
      const landingAliasHtml = renderToStaticMarkup(React.createElement(App));
      expect(landingAliasHtml).toContain('data-testid="landing-root"');
      expect(landingAliasHtml).not.toContain('data-testid="workshop-app-shell"');
      expect(initSpy).not.toHaveBeenCalled();

      navigateTo('/documentation');
      const subpageHtml = renderToStaticMarkup(React.createElement(App));
      expect(subpageHtml).toContain('data-testid="landing-subpage-view"');
      expect(subpageHtml).not.toContain('data-testid="workshop-app-shell"');
      expect(initSpy).not.toHaveBeenCalled();

      navigateTo('/app');
      const workshopHtml = renderToStaticMarkup(React.createElement(App));
      expect(workshopHtml).toContain('data-testid="workshop-app-shell"');
      expect(workshopHtml).not.toContain('data-testid="landing-root"');
    } finally {
      initSpy.mockRestore();
      navigateTo('/');
    }
  });
});
