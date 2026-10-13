import React, { useEffect, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Globe,
  LogIn,
  Menu,
  X,
} from 'lucide-react';
import { useLanguage, type Language } from '../i18n/LanguageContext';
import { useAppRoute } from '../router/landingRouteStore';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const languages: { code: Language; name: string }[] = [
    { code: 'en', name: t.language.english },
    { code: 'pt', name: t.language.portuguese },
    { code: 'es', name: t.language.spanish },
  ];

  const currentLanguage = languages.find((item) => item.code === language);

  const handleSelect = (code: Language) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={currentLanguage?.name ?? t.language.select}
        className="inline-flex items-center justify-center whitespace-nowrap rounded-md ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent h-8 gap-1 px-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <Globe className="size-3.5" />
        <span>{currentLanguage?.code.toUpperCase() ?? language.toUpperCase()}</span>
        <ChevronDown className="size-3" />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label={t.language.select}
          className="absolute right-0 top-full mt-2 min-w-36 md:left-0 md:right-auto rounded-md border bg-background shadow-lg z-50"
        >
          <div className="py-1">
            {languages.map((item) => (
              <button
                key={item.code}
                type="button"
                role="menuitem"
                onClick={() => handleSelect(item.code)}
                className={`w-full flex items-center gap-2 whitespace-nowrap px-3 py-1.5 text-xs transition-colors hover:bg-muted ${
                  language === item.code ? 'bg-muted font-medium' : ''
                }`}
              >
                <span>{item.name}</span>
                {language === item.code && (
                  <span className="ml-auto text-primary">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export const LandingHeader: React.FC = () => {
  const { t } = useLanguage();
  const { navigateTo } = useAppRoute();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navRecord = t.nav as Record<string, string | undefined>;
  const appNavLabel = navRecord.app ?? t.nav.demo;
  const signInLabel = navRecord.signIn ?? t.nav.login;

  const navItems = [
    { href: '#soluciones', target: '/#soluciones', label: t.nav.solutions },
    { href: '#beneficios', target: '/#beneficios', label: t.nav.benefits },
    { href: '#demo', target: '/#demo', label: appNavLabel },
    { href: '#pricing', target: '/#pricing', label: t.nav.pricing },
  ].filter((item) => Boolean(item.label));

  return (
    <header
      className={`sticky top-0 z-50 w-full bg-background transition-shadow duration-300 ${
        isScrolled ? 'shadow-sm' : ''
      }`}
    >
      <div className="container relative flex h-16 items-center justify-between">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigateTo('/');
          }}
          className="flex items-center gap-2 font-bold"
        >
          <img
            src="/subly-mark-teal.svg"
            alt="Sublimifyer Logo"
            width={32}
            height={32}
            className="size-8"
          />
          <span>Sublimifyer</span>
        </a>

        <nav className="hidden md:flex gap-8 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => {
                e.preventDefault();
                navigateTo(item.target);
              }}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex gap-4 items-center">
          <LanguageSwitcher />
          <a
            href="/app"
            onClick={(e) => {
              e.preventDefault();
              navigateTo('/app');
            }}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {signInLabel}
          </a>
          <button
            type="button"
            onClick={() => navigateTo('/app')}
            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 text-sm font-medium inline-flex items-center justify-center transition-colors"
          >
            {t.nav.getStarted}
            <ChevronRight className="ml-1 size-4" />
          </button>
        </div>

        <div className="flex items-center md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground h-10 w-10"
          >
            {mobileMenuOpen ? (
              <X className="size-5" />
            ) : (
              <Menu className="size-5" />
            )}
            <span className="sr-only">Toggle menu</span>
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 inset-x-0 bg-background border-b shadow-[0_10px_15px_-3px_rgba(9,14,13,0.12),0_20px_40px_-24px_rgba(9,14,13,0.45)]">
          <div className="container py-4 flex flex-col gap-4">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  setMobileMenuOpen(false);
                  navigateTo(item.target);
                }}
                className="py-2 text-sm font-medium"
              >
                {item.label}
              </a>
            ))}
            <div className="flex flex-col gap-3 pt-3 border-t">
              <div className="self-start">
                <LanguageSwitcher />
              </div>
              <a
                href="/app"
                onClick={(e) => {
                  e.preventDefault();
                  setMobileMenuOpen(false);
                  navigateTo('/app');
                }}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border-[1.5px] border-primary text-[15px] font-semibold text-primary transition-colors hover:bg-primary/5"
              >
                <LogIn className="size-4" />
                {signInLabel}
              </a>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigateTo('/app');
                }}
                className="h-11 w-full rounded-full text-[15px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center transition-colors"
              >
                {t.nav.getStarted}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
