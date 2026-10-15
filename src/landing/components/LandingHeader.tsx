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
import { useAuthStore } from '../auth/authStore';

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
  const { openAuthModal } = useAuthStore();
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

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

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
      className={`sticky top-0 z-50 w-full bg-background/95 backdrop-blur-md transition-shadow duration-300 ${
        isScrolled ? 'shadow-sm' : ''
      }`}
    >
      <div className="container relative flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigateTo('/');
          }}
          className="flex shrink-0 items-center gap-2.5 font-bold transition-opacity hover:opacity-90 select-none"
        >
          <img
            src="/cimatex-icon.png"
            alt="CimaTex Logo"
            width={36}
            height={36}
            className="size-9 object-contain"
          />
          <span className="text-xl font-black tracking-tight select-none">
            <span className="text-foreground">Cima</span>
            <span className="text-primary">Tex</span>
          </span>
        </a>

        <nav className="hidden lg:flex gap-6 xl:gap-8 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => {
                e.preventDefault();
                navigateTo(item.target);
              }}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground whitespace-nowrap"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden lg:flex gap-3 xl:gap-4 items-center shrink-0">
          <LanguageSwitcher />
          <button
            type="button"
            onClick={openAuthModal}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground whitespace-nowrap cursor-pointer px-2 py-1"
          >
            {signInLabel}
          </button>
          <button
            type="button"
            onClick={openAuthModal}
            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 text-sm font-medium inline-flex items-center justify-center transition-colors whitespace-nowrap shadow-sm cursor-pointer"
          >
            {t.nav.getStarted}
            <ChevronRight className="ml-1 size-4" />
          </button>
        </div>

        <div className="flex items-center lg:hidden gap-1">
          <LanguageSwitcher />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all hover:bg-accent hover:text-accent-foreground h-11 w-11 active:scale-95 touch-manipulation cursor-pointer"
            aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="size-6 text-foreground" />
            ) : (
              <Menu className="size-6 text-foreground" />
            )}
            <span className="sr-only">Toggle menu</span>
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <>
          {/* Backdrop overlay for outside tap */}
          <div
            className="fixed inset-0 top-16 bg-black/40 backdrop-blur-xs z-30 lg:hidden animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          <div className="lg:hidden absolute top-16 inset-x-0 bg-background border-b border-border shadow-xl z-40 animate-in slide-in-from-top-2 duration-200">
            <div className="container px-4 sm:px-6 py-5 flex flex-col gap-3">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    setMobileMenuOpen(false);
                    navigateTo(item.target);
                  }}
                  className="py-2.5 px-3 rounded-lg text-base font-semibold text-foreground/90 hover:bg-muted transition-colors"
                >
                  {item.label}
                </a>
              ))}
              <div className="flex flex-col gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal();
                  }}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border-[1.5px] border-primary text-[15px] font-semibold text-primary transition-colors hover:bg-primary/5 active:scale-98 touch-manipulation cursor-pointer shadow-xs"
                >
                  <LogIn className="size-4" />
                  <span>{signInLabel}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal();
                  }}
                  className="h-12 w-full rounded-full text-[15px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 active:scale-98 inline-flex items-center justify-center transition-colors touch-manipulation cursor-pointer shadow-md"
                >
                  <span>{t.nav.getStarted}</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
};
