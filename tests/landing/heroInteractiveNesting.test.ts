import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { HeroInteractiveNesting } from '@/landing/components/HeroInteractiveNesting';
import { HeroSection } from '@/landing/components/HeroSection';
import { LanguageProvider } from '@/landing/i18n/LanguageContext';

describe('HeroInteractiveNesting & Modern 2-Column HeroSection', () => {
  it('renders HeroInteractiveNesting in optimized state by default with 1600mm roll, sports apparel pieces, and savings badge', () => {
    const html = renderToStaticMarkup(React.createElement(HeroInteractiveNesting));

    expect(html).toContain('data-testid="hero-interactive-nesting"');
    expect(html).toContain('bobina_1600mm_produccion.cim');
    expect(html).toContain('1600 mm');
    expect(html).toContain('Motor 1:1 Activo');
    expect(html).toContain('92.4% (Optimizado con CimaTex)');
    expect(html).toContain('Ahorro: +1.4m de tela');
    expect(html).toContain('DELANTERO L');
    expect(html).toContain('ESPALDA L');
    expect(html).toContain('MANGA IZQ · L');
    expect(html).toContain('MANGA DER · L');
    expect(html).toContain('CUELLO RIBETE V');
    expect(html).toContain('/cimatex-mascota.webp');
    expect(html).toContain('Validación milimétrica 1:1 activa');
  });

  it('renders HeroInteractiveNesting in manual unoptimized state when initialOptimized is false', () => {
    const html = renderToStaticMarkup(
      React.createElement(HeroInteractiveNesting, { initialOptimized: false })
    );

    expect(html).toContain('Eficiencia: 68.2% (Manual)');
    expect(html).toContain('Merma alta: -31.8%');
    expect(html).toContain('Área sin aprovechar');
    expect(html).toContain('+1.4 m² merma de tela');
  });

  it('renders HeroSection with 2-column layout, machine ticker, CTAs, and preserves Vitest compatibility', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        LanguageProvider,
        null,
        React.createElement(HeroSection)
      )
    );

    // 1. Badge & Pain-focused headline
    expect(html).toContain('Nuevo: Motor de Nesting 1:1 para Sublimación');
    expect(html).toContain('Ahorra hasta 30% de tela');
    expect(html).toContain('y acelera tus entregas.');

    // 2. Machine ticker
    expect(html).toContain('Compatible con plóteres:');
    expect(html).toContain('Epson');
    expect(html).toContain('Mimaki');
    expect(html).toContain('Roland');
    expect(html).toContain('Mutoh');

    // 3. CTA Buttons
    expect(html).toContain('Comenzar gratis con Google');
    expect(html).toContain('Ver demostración');
    expect(html).toContain('href="#demo"');

    // 4. HeroInteractiveNesting embedded
    expect(html).toContain('data-testid="hero-interactive-nesting"');
    expect(html).toContain('/cimatex-mascota.webp');

    // 5. Preserved hidden marquee cards & divider wave for tests
    expect(html).toContain('Todo tu proceso de producción,');
    expect(html).toContain('automatizado en un solo lugar.');
    expect(html).toContain('/hero/hero-sublimacion.webp');
    expect(html).toContain('M0,70 L0,34 C240,4 480,58 720,42 C960,26 1200,0 1440,26 L1440,70 Z');
  });
});
