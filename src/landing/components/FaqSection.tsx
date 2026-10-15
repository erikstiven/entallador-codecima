import React, { useState } from 'react';
import { ChevronDown, HelpCircle, MessageCircle } from 'lucide-react';
import { SUBLIMIFYER_WHATSAPP_PHONE } from '../data/subpagesData';
import { openWhatsApp } from './WhatsAppFloatingButton';

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'software-instalacion',
    question: '¿Necesito instalar un software pesado en mi computadora?',
    answer:
      'No. CimaTex corre 100% en la nube y en cualquier navegador moderno (Google Chrome, Microsoft Edge, Safari o Firefox). No necesitas descargar ejecutables pesados ni contar con una computadora de diseño de alta gama: puedes optimizar tus tiradas desde la PC del taller, tu laptop personal o revisar pedidos desde cualquier lugar.',
  },
  {
    id: 'compatibilidad-ploteres',
    question: '¿Es compatible con mis archivos y plóteres?',
    answer:
      'Totalmente. CimaTex exporta en SVG 1:1, PDF vectorial y EPS calibrado para los procesadores de imagen (RIP) líderes del mercado, como Mimaki RasterLink, Epson Edge Print, Photoprint (FlexiPRINT), Wasatch SoftRIP y Roland VersaWorks. Tus moldes conservan su escala milimétrica exacta y los perfiles de color listos para producción.',
  },
  {
    id: 'plan-inicial-gratis',
    question: '¿Por qué el plan inicial es gratis?',
    answer:
      'Para que compruebes el ahorro en tu propio taller sin riesgo ni tarjetas de crédito. Queremos que pruebes la velocidad del acomodo automático y verifiques de primera mano cuántos metros de tela y horas de diseño recuperas. Puedes empezar a producir hoy mismo y escalar a un plan superior solo cuando tu volumen de trabajo lo requiera.',
  },
  {
    id: 'seguridad-moldes',
    question: '¿Mis moldes, diseños y nóminas de clientes están seguros?',
    answer:
      'Absolutamente. Cada taller opera de forma privada y aislada. Tus moldes vectoriales, diseños gráficos y listas de nombres o dorsales son de tu exclusiva propiedad; están cifrados y jamás se comparten ni se utilizan para alimentar modelos públicos. Solo tú y los miembros autorizados de tu taller tienen acceso a ellos.',
  },
];

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleItem = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section
      id="faq"
      data-testid="landing-faq-section"
      className="relative w-full py-20 md:py-32 bg-white overflow-hidden scroll-mt-16 border-t border-slate-100"
    >
      {/* Soft ambient background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(124,58,237,0.04),transparent)]"
      />

      <div className="container relative z-10 px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-violet-100 text-violet-800 mb-4">
            <HelpCircle className="size-3.5 text-violet-600" />
            <span>Respuestas Claras</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900">
            Preguntas Frecuentes
          </h2>

          <p className="mt-4 text-sm sm:text-base md:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Todo lo que necesitas saber sobre compatibilidad, instalación y seguridad
            antes de automatizar la producción de tu taller con CimaTex.
          </p>
        </div>

        {/* Minimalist Accordion */}
        <div className="mt-10 sm:mt-12 max-w-3xl mx-auto space-y-3 sm:space-y-3.5">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index;

            return (
              <div
                key={item.id}
                data-testid={`faq-item-${index}`}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? 'border-violet-300 bg-violet-50/30 shadow-sm ring-1 ring-violet-200/50'
                    : 'border-slate-200/80 bg-white hover:border-slate-300'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleItem(index)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${item.id}`}
                  className="w-full flex items-center justify-between gap-3 sm:gap-4 p-4 sm:p-6 text-left cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded-2xl touch-manipulation"
                >
                  <span className="text-sm sm:text-base md:text-lg font-bold text-slate-900 leading-snug">
                    {item.question}
                  </span>
                  <div
                    className={`size-7 sm:size-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                      isOpen
                        ? 'bg-violet-600 text-white rotate-180 shadow-sm'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <ChevronDown className="size-4" />
                  </div>
                </button>

                <div
                  id={`faq-answer-${item.id}`}
                  className={`grid transition-all duration-300 ease-in-out ${
                    isOpen
                      ? 'grid-rows-[1fr] opacity-100'
                      : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-4 sm:px-6 pb-5 sm:pb-6 pt-1 text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed border-t border-violet-100/60">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Support Note */}
        <div className="mt-10 sm:mt-12 text-center px-2">
          <p className="text-xs sm:text-sm text-slate-500">
            ¿Tienes alguna consulta técnica específica sobre las bobinas o formatos de tu taller?
          </p>
          <button
            type="button"
            onClick={() =>
              openWhatsApp(
                SUBLIMIFYER_WHATSAPP_PHONE,
                'Hola, tengo una consulta técnica sobre la compatibilidad de CimaTex con mi taller.'
              )
            }
            className="mt-3 inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-violet-700 hover:text-violet-900 transition-colors cursor-pointer underline-offset-4 hover:underline touch-manipulation"
          >
            <MessageCircle className="size-4 text-emerald-600" />
            <span>Conversar directamente por WhatsApp con un especialista</span>
          </button>
        </div>
      </div>
    </section>
  );
};
