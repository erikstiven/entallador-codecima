import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { LanguageProvider } from './i18n/LanguageContext';
import {
  PricingSection,
  PRICING_BG_GRADIENT,
  resolveDefaultPricingCurrency,
} from './components/PricingSection';
import {
  CtaSection,
  CTA_BOTTOM_FADE_GRADIENT,
} from './components/CtaSection';
import {
  LandingFooter,
  FOOTER_OVERLAY_GRADIENT,
} from './components/LandingFooter';
import {
  WhatsAppFloatingButton,
  WHATSAPP_APPEAR_DELAY_MS,
  buildWhatsAppUrl,
} from './components/WhatsAppFloatingButton';
import { SubpageView } from './pages/SubpageView';
import { SUBPAGE_PATHS } from './data/subpagesData';
import { LandingApp } from './LandingApp';
import { navigateTo } from './router/landingRouteStore';

describe('TASK-4: 1:1 Unified Bottom Block (#pricing, #cta, Footer), WhatsApp Floating Button & 11 Subpages', () => {
  it('resolves default pricing currency (ARS vs USD) from stored preference, timezone, or locale', () => {
    expect(
      resolveDefaultPricingCurrency({
        storedValue: 'USD',
        timeZone: 'America/Argentina/Buenos_Aires',
        languages: ['es-AR'],
      })
    ).toBe('USD');

    expect(
      resolveDefaultPricingCurrency({
        storedValue: null,
        timeZone: 'America/Argentina/Buenos_Aires',
        languages: ['en-US'],
      })
    ).toBe('ARS');

    expect(
      resolveDefaultPricingCurrency({
        storedValue: null,
        timeZone: 'America/Buenos_Aires',
        languages: ['en-US'],
      })
    ).toBe('ARS');

    expect(
      resolveDefaultPricingCurrency({
        storedValue: null,
        timeZone: 'America/New_York',
        languages: ['es-AR'],
      })
    ).toBe('ARS');

    expect(
      resolveDefaultPricingCurrency({
        storedValue: null,
        timeZone: 'America/Mexico_City',
        languages: ['es-MX'],
      })
    ).toBe('USD');
  });

  it('renders PricingSection (#pricing) with 24-stop gradient, 2 rows of 3 shared features, ARS/USD toggle, 3 plan cards, footnote, ROI callout, and custom plan CTA', () => {
    const htmlArs = renderToStaticMarkup(
      React.createElement(
        LanguageProvider,
        null,
        React.createElement(PricingSection, { initialCurrency: 'ARS' })
      )
    );

    expect(htmlArs).toContain('id="pricing"');
    expect(htmlArs).toContain('-mt-11');
    expect(PRICING_BG_GRADIENT).toContain('#fbfbfc 0%');
    expect(PRICING_BG_GRADIENT).toContain('#06423e calc(100% - 20px)');
    expect(htmlArs).toContain('Elegí según cuánto producís.');
    expect(htmlArs).toContain('Onboarding');
    expect(htmlArs).toContain('Soporte');
    expect(htmlArs).toContain('Automatización de producción');
    expect(htmlArs).toContain('Generación de archivos de producción');
    expect(htmlArs).toContain('Gestión de pedidos');
    expect(htmlArs).toContain('Múltiples usuarios');
    expect(htmlArs).toContain('Inicial');
    expect(htmlArs).toContain('Profesional');
    expect(htmlArs).toContain('Empresarial');
    expect(htmlArs).toContain('99k ARS');
    expect(htmlArs).toContain('199k ARS');
    expect(htmlArs).toContain('299k ARS');
    expect(htmlArs).toContain('* +49 ARS por prenda adicional');
    expect(htmlArs).toContain(
      'Un solo error de producción puede costar más que un mes de Sublimifyer.'
    );
    expect(htmlArs).toContain('¿Necesitás un plan a medida?');
    expect(htmlArs).toContain('Contactanos');

    const htmlUsd = renderToStaticMarkup(
      React.createElement(
        LanguageProvider,
        null,
        React.createElement(PricingSection, { initialCurrency: 'USD' })
      )
    );

    expect(htmlUsd).toContain('69 USD');
    expect(htmlUsd).toContain('139 USD');
    expect(htmlUsd).toContain('199 USD');
    expect(htmlUsd).toContain('* +0,03 USD por prenda adicional');
  });

  it('renders CtaSection (#cta) with #06423e background, 14-stop bottom fade gradient to #020c0c, and white rounded-full CTA button', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        LanguageProvider,
        null,
        React.createElement(CtaSection)
      )
    );

    expect(html).toContain('id="cta"');
    expect(html).toContain('bg-[#06423e]');
    expect(CTA_BOTTOM_FADE_GRADIENT).toContain('#020c0c calc(100% - 12px)');
    expect(html).toContain('Empezá hoy. Sin tarjeta.');
    expect(html).toContain(
      'Configurá tu taller y sublimá tu primer pedido en minutos'
    );
    expect(html).toContain('Comenzar prueba gratuita');
  });

  it('renders LandingFooter with #020c0c background, 4 columns, social links, and all 11 subpage links', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        LanguageProvider,
        null,
        React.createElement(LandingFooter)
      )
    );

    expect(html).toContain('bg-[#020c0c]');
    expect(FOOTER_OVERLAY_GRADIENT).toContain('#020c0c 100%');
    expect(html).toContain('https://www.instagram.com/sublimifyer/');
    expect(html).toContain(
      'https://www.facebook.com/profile.php?id=61574392834740'
    );
    for (const path of SUBPAGE_PATHS) {
      expect(html).toContain(`href="${path}"`);
    }
  });

  it('configures WhatsAppFloatingButton with 2000ms delay, tooltip, pulse ring, and URL builder', () => {
    expect(WHATSAPP_APPEAR_DELAY_MS).toBe(2000);
    expect(
      buildWhatsAppUrl('+54 9 221 691-1176', 'Hola Sublimifyer')
    ).toBe('https://wa.me/5492216911176?text=Hola%20Sublimifyer');

    const htmlVisible = renderToStaticMarkup(
      React.createElement(WhatsAppFloatingButton, { forceVisible: true })
    );
    expect(htmlVisible).toContain('fixed bottom-6 right-6 z-50');
    expect(htmlVisible).toContain('¡Chatea con nosotros!');
    expect(htmlVisible).toContain('animate-ping');
  });

  it('renders all 11 subpages in SubpageView with 1:1 headings, sticky header, and footer', () => {
    const expectedHeadings: Record<(typeof SUBPAGE_PATHS)[number], string> = {
      '/documentation': 'Documentación',
      '/guides': 'Guías',
      '/blog': 'Recursos para talleres de sublimación',
      '/casos-de-uso': 'Casos de Uso de Sublimifyer',
      '/glosario': 'Glosario de produccion para talleres de sublimacion',
      '/support': 'Centro de Soporte',
      '/about': 'Acerca de Sublimifyer',
      '/careers': 'Únete a Nuestro Equipo',
      '/privacy-policy': 'Política de Privacidad',
      '/terms-of-service': 'Términos de Servicio',
      '/cookie-policy': 'Política de Cookies',
    };

    for (const path of SUBPAGE_PATHS) {
      const html = renderToStaticMarkup(
        React.createElement(
          LanguageProvider,
          null,
          React.createElement(SubpageView, { subpagePath: path })
        )
      );

      expect(html).toContain('data-testid="landing-subpage-view"');
      expect(html).toContain(`data-subpage="${path}"`);
      expect(html).toContain(expectedHeadings[path]);
      expect(html).toContain('Volver al Inicio');
      expect(html).toContain('Sublimifyer');
    }
  });

  it('wires Unified Bottom Block and SubpageView into LandingApp', () => {
    navigateTo('/');
    const homeHtml = renderToStaticMarkup(React.createElement(LandingApp));
    expect(homeHtml).toContain('data-testid="landing-home-view"');
    expect(homeHtml).toContain('data-testid="landing-unified-bottom-block"');
    expect(homeHtml).toContain('id="pricing"');
    expect(homeHtml).toContain('id="cta"');

    navigateTo('/casos-de-uso');
    const subpageHtml = renderToStaticMarkup(React.createElement(LandingApp));
    expect(subpageHtml).toContain('data-testid="landing-subpage-view"');
    expect(subpageHtml).toContain('data-subpage="/casos-de-uso"');
    expect(subpageHtml).toContain('Casos de Uso de Sublimifyer');

    navigateTo('/');
  });
});
