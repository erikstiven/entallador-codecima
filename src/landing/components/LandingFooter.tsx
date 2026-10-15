import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAppRoute } from '../router/landingRouteStore';

export const FOOTER_OVERLAY_GRADIENT =
  'linear-gradient(to bottom,\n  transparent 0%, transparent 55%, rgba(9,4,20,.25) 72%, rgba(9,4,20,.65) 86%, #090414 100%)';

export const LandingFooter: React.FC = () => {
  const { t } = useLanguage();
  const { navigateTo } = useAppRoute();
  const footerRecord = t.footer as unknown as Record<string, string | undefined>;

  const useCasesLabel = footerRecord.useCases ?? 'Casos de Uso';
  const glossaryLabel = footerRecord.glossary ?? 'Glosario';

  const handleLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    e.preventDefault();
    navigateTo(href);
  };

  return (
    <footer className="w-full -mt-px pt-px bg-[#090414] text-white relative">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[2]"
        style={{
          background: FOOTER_OVERLAY_GRADIENT,
        }}
      />

      <div className="container relative z-10 flex flex-col gap-8 px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div className="space-y-4">
            <a
              href="/"
              onClick={(e) => handleLinkClick(e, '/')}
              className="flex items-center gap-2.5 font-bold transition-opacity hover:opacity-90"
            >
              <img
                src="/cimatex-icon.png"
                alt="CimaTex"
                width={36}
                height={36}
                className="size-9 object-contain"
              />
              <span className="text-xl font-black tracking-tight select-none">
                <span className="text-white">Cima</span>
                <span className="text-[#a78bfa]">Tex</span>
              </span>
            </a>
            <p className="text-sm text-white/65">{t.footer.description}</p>
            <div className="flex gap-4">
              <a
                href="https://www.instagram.com/codecimaec"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-white transition-colors"
                title="Instagram @codecimaec"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-5"
                >
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
                <span className="sr-only">Instagram @codecimaec</span>
              </a>
              <a
                href="https://www.facebook.com/codecimaec"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-white transition-colors"
                title="Facebook @codecimaec"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-5"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
                <span className="sr-only">Facebook @codecimaec</span>
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white">{t.footer.product}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="#pricing"
                  onClick={(e) => handleLinkClick(e, '/#pricing')}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  {t.footer.pricing}
                </a>
              </li>
              <li>
                <a
                  href="#cta"
                  onClick={(e) => handleLinkClick(e, '/#cta')}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  {t.footer.demo}
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white">
              {t.footer.resources}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="/documentation"
                  onClick={(e) => handleLinkClick(e, '/documentation')}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  {t.footer.documentation}
                </a>
              </li>
              <li>
                <a
                  href="/guides"
                  onClick={(e) => handleLinkClick(e, '/guides')}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  {t.footer.guides}
                </a>
              </li>
              <li>
                <a
                  href="/blog"
                  onClick={(e) => handleLinkClick(e, '/blog')}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  {t.footer.blog}
                </a>
              </li>
              <li>
                <a
                  href="/casos-de-uso"
                  onClick={(e) => handleLinkClick(e, '/casos-de-uso')}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  {useCasesLabel}
                </a>
              </li>
              <li>
                <a
                  href="/glosario"
                  onClick={(e) => handleLinkClick(e, '/glosario')}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  {glossaryLabel}
                </a>
              </li>
              <li>
                <a
                  href="/support"
                  onClick={(e) => handleLinkClick(e, '/support')}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  {t.footer.support}
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white">{t.footer.company}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="/about"
                  onClick={(e) => handleLinkClick(e, '/about')}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  {t.footer.about}
                </a>
              </li>
              <li>
                <a
                  href="/careers"
                  onClick={(e) => handleLinkClick(e, '/careers')}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  {t.footer.careers}
                </a>
              </li>
              <li>
                <a
                  href="/privacy-policy"
                  onClick={(e) => handleLinkClick(e, '/privacy-policy')}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  {t.footer.privacyPolicy}
                </a>
              </li>
              <li>
                <a
                  href="/terms-of-service"
                  onClick={(e) => handleLinkClick(e, '/terms-of-service')}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  {t.footer.termsOfService}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row justify-between items-center border-t border-white/10 pt-8 text-center sm:text-left">
          <p className="text-xs text-white/60">
            © {new Date().getFullYear()} CimaTex por Codecima. {t.footer.copyright}
          </p>
          <div className="flex flex-wrap justify-center sm:justify-end gap-4">
            <a
              href="/privacy-policy"
              onClick={(e) => handleLinkClick(e, '/privacy-policy')}
              className="text-xs text-white/70 hover:text-white transition-colors"
            >
              {t.footer.privacyPolicy}
            </a>
            <a
              href="/terms-of-service"
              onClick={(e) => handleLinkClick(e, '/terms-of-service')}
              className="text-xs text-white/70 hover:text-white transition-colors"
            >
              {t.footer.termsOfService}
            </a>
            <a
              href="/cookie-policy"
              onClick={(e) => handleLinkClick(e, '/cookie-policy')}
              className="text-xs text-white/70 hover:text-white transition-colors"
            >
              {t.footer.cookiePolicy}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
