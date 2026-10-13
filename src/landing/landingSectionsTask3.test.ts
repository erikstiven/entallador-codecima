import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { LanguageProvider } from './i18n/LanguageContext';
import { LandingHeader } from './components/LandingHeader';
import { HeroSection } from './components/HeroSection';
import { SolutionsSection } from './components/SolutionsSection';
import { BenefitsSection } from './components/BenefitsSection';
import { DemoSection } from './components/DemoSection';

describe('TASK-3: 1:1 Header, Hero Physics Marquee, Solutions Video, Benefits Card & Interactive Demo', () => {
  it('renders LandingHeader with logo, centered nav links (#soluciones, #beneficios, #demo, #pricing), language switcher and CTAs', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        LanguageProvider,
        null,
        React.createElement(LandingHeader)
      )
    );

    expect(html).toContain('/cimatex-icon.png');
    expect(html).toContain('CimaTex');
    expect(html).toContain('#soluciones');
    expect(html).toContain('#beneficios');
    expect(html).toContain('#demo');
    expect(html).toContain('#pricing');
    expect(html).toContain('Iniciar Sesión');
    expect(html).toContain('Comenzar');
  });

  it('renders HeroSection with 14x14 radial dots, SVG wave divider, and all 10 cards in HeroCardMarquee', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        LanguageProvider,
        null,
        React.createElement(HeroSection)
      )
    );

    expect(html).toContain('Todo tu proceso de producción,');
    expect(html).toContain('automatizado en un solo lugar.');
    expect(html).toContain(
      'M0,70 L0,34 C240,4 480,58 720,42 C960,26 1200,0 1440,26 L1440,70 Z'
    );
    expect(html).toContain('/hero/hero-sublimacion.webp');
    expect(html).toContain('/hero/hero-dtf-sponsors.webp');
    expect(html).toContain('/hero/hero-molde-frente.webp');
    expect(html).toContain('/hero/hero-producto.webp');
    expect(html).toContain('/hero/hero-dtf-cachimbas.webp');
    expect(html).toContain('/hero/hero-corte.webp');
    expect(html).toContain('#1042');
    expect(html).toContain('Club Atlético Progreso');
    expect(html).toContain('DELANTERO');
    expect(html).toContain('Short oficial');
    expect(html).toContain('18,4 m');
    expect(html).toContain('Mix del mes');
    expect(html).toContain('52%');
    expect(html).toContain('31%');
    expect(html).toContain('17%');
  });

  it('renders SolutionsSection (#soluciones) with shirt showcase video', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        LanguageProvider,
        null,
        React.createElement(SolutionsSection)
      )
    );

    expect(html).toContain('id="soluciones"');
    expect(html).toContain('De tu pedido al archivo listo para producir.');
    expect(html).toContain('/shirt-scroll/sublimifyer-scroll.mp4');
  });

  it('renders BenefitsSection (#beneficios) dark teal rounded card with 4 benefit items and metric pills', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        LanguageProvider,
        null,
        React.createElement(BenefitsSection)
      )
    );

    expect(html).toContain('id="beneficios"');
    expect(html).toContain('bg-[#180d33]');
    expect(html).toContain('Producí más.');
    expect(html).toContain('Desperdiciá menos.');
    expect(html).toContain('Menos desperdicio de tela');
    expect(html).toContain('Menos errores de producción');
    expect(html).toContain('Menos trabajo manual');
    expect(html).toContain('Más producción');
  });

  it('renders DemoSection (#demo) with macOS traffic light dots, EN VIVO badge, and /app-mock.html#designer iframe', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        LanguageProvider,
        null,
        React.createElement(DemoSection)
      )
    );

    expect(html).toContain('id="demo"');
    expect(html).toContain('Todo tu proceso. Una sola plataforma.');
    expect(html).toContain('bg-[#FF5F57]');
    expect(html).toContain('bg-[#FEBC2E]');
    expect(html).toContain('bg-[#28C840]');
    expect(html).toContain('/app-mock.html#designer');
  });
});
