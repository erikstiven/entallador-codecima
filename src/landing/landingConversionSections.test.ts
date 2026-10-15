import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SavingsCalculatorSection, RECOVERY_RATE } from './components/SavingsCalculatorSection';
import { ComparisonSection } from './components/ComparisonSection';
import { FaqSection, FAQ_ITEMS } from './components/FaqSection';
import { LandingApp } from './LandingApp';
import { useAuthStore } from './auth/authStore';
import { navigateTo } from './router/landingRouteStore';

describe('Landing Conversion & Persuasion Modules (Comparison, Calculator, FAQ)', () => {
  describe('SavingsCalculatorSection', () => {
    it('calculates 13.5% recovery, 135 m, $378 monthly savings, and $4,536 annual savings with default values', () => {
      expect(RECOVERY_RATE).toBe(0.135);

      const defaultMeters = 1000;
      const defaultCost = 2.8;
      const recMeters = Math.round(defaultMeters * RECOVERY_RATE);
      const monthly = Math.round(recMeters * defaultCost);
      const annual = monthly * 12;

      expect(recMeters).toBe(135);
      expect(monthly).toBe(378);
      expect(annual).toBe(4536);

      const html = renderToStaticMarkup(React.createElement(SavingsCalculatorSection));

      expect(html).toContain('id="calculadora"');
      expect(html).toContain('Calculadora de Ahorro para tu Taller');
      expect(html).toContain('13.5%');
      expect(html).toContain('135 m');
      expect(html).toContain('378');
      expect(html).toContain('USD / mes');
      expect(html).toContain('4,536');
      expect(html).toContain('USD / año');
      expect(html).toContain('Comenzar a ahorrar gratis con Google');
      expect(html).toContain('slider-meters');
      expect(html).toContain('slider-cost');
      expect(html).toContain('min="100"');
      expect(html).toContain('max="5000"');
      expect(html).toContain('step="50"');
      expect(html).toContain('min="1"');
      expect(html).toContain('max="6"');
      expect(html).toContain('step="0.1"');
    });

    it('exposes openAuthModal invocation capability via useAuthStore', () => {
      const openModalSpy = vi.fn();
      useAuthStore.setState({ openAuthModal: openModalSpy });

      const state = useAuthStore.getState();
      state.openAuthModal();
      expect(openModalSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('ComparisonSection', () => {
    it('renders contrasting cards for traditional manual method vs modern CimaTex automated workflow', () => {
      const html = renderToStaticMarkup(React.createElement(ComparisonSection));

      expect(html).toContain('id="comparativa"');
      expect(html).toContain('Antes vs. Con CimaTex');
      expect(html).toContain('El dolor del confeccionista vs. la solución moderna');

      // Card 1: Traditional method
      expect(html).toContain('El método tradicional (Manual en Corel / Illustrator)');
      expect(html).toContain('3 horas acomodando a mano');
      expect(html).toContain('Mermas del 25-35%');
      expect(html).toContain('Errores en dorsales y nombres');
      expect(html).toContain('Estrés en fechas de entrega');

      // Card 2: CimaTex automated
      expect(html).toContain('Con CimaTex (Automatizado 1:1)');
      expect(html).toContain('10 segundos de cálculo automático');
      expect(html).toContain('&gt;90% de aprovechamiento en bobina');
      expect(html).toContain('Carga masiva desde Excel sin faltas ortográficas');
      expect(html).toContain('Exportación directa para RIP (Mimaki/Epson)');
    });
  });

  describe('FaqSection', () => {
    it('renders all 4 required questions and answers in an interactive accordion structure', () => {
      expect(FAQ_ITEMS).toHaveLength(4);

      const html = renderToStaticMarkup(React.createElement(FaqSection));

      expect(html).toContain('id="faq"');
      expect(html).toContain('Preguntas Frecuentes');

      // Question 1
      expect(html).toContain('¿Necesito instalar un software pesado en mi computadora?');
      expect(html).toContain('corre 100% en la nube y en cualquier navegador moderno');

      // Question 2
      expect(html).toContain('¿Es compatible con mis archivos y plóteres?');
      expect(html).toContain('SVG 1:1, PDF vectorial y EPS calibrado');
      expect(html).toContain('Mimaki RasterLink, Epson Edge Print');

      // Question 3
      expect(html).toContain('¿Por qué el plan inicial es gratis?');
      expect(html).toContain('compruebes el ahorro en tu propio taller sin riesgo ni tarjetas');

      // Question 4
      expect(html).toContain('¿Mis moldes, diseños y nóminas de clientes están seguros?');
      expect(html).toContain('Cada taller opera de forma privada y aislada');
    });
  });

  describe('LandingApp Integration Order', () => {
    it('mounts sections in natural conversion order: Hero -> Solutions -> Benefits -> Demo -> Comparison -> Calculator -> FAQ -> Bottom Block', () => {
      navigateTo('/');
      const html = renderToStaticMarkup(React.createElement(LandingApp));

      const heroIdx = html.indexOf('Todo tu proceso de producción');
      const solutionsIdx = html.indexOf('id="soluciones"');
      const benefitsIdx = html.indexOf('id="beneficios"');
      const demoIdx = html.indexOf('id="demo"');
      const comparisonIdx = html.indexOf('id="comparativa"');
      const calculatorIdx = html.indexOf('id="calculadora"');
      const faqIdx = html.indexOf('id="faq"');
      const pricingIdx = html.indexOf('id="pricing"');
      const ctaIdx = html.indexOf('id="cta"');
      const footerIdx = html.indexOf('<footer');

      expect(heroIdx).toBeGreaterThan(-1);
      expect(solutionsIdx).toBeGreaterThan(heroIdx);
      expect(benefitsIdx).toBeGreaterThan(solutionsIdx);
      expect(demoIdx).toBeGreaterThan(benefitsIdx);
      expect(comparisonIdx).toBeGreaterThan(demoIdx);
      expect(calculatorIdx).toBeGreaterThan(comparisonIdx);
      expect(faqIdx).toBeGreaterThan(calculatorIdx);
      expect(pricingIdx).toBeGreaterThan(faqIdx);
      expect(ctaIdx).toBeGreaterThan(pricingIdx);
      expect(footerIdx).toBeGreaterThan(ctaIdx);
    });
  });
});
