import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Book,
  BookOpen,
  Briefcase,
  Calendar,
  ChartNoAxesColumnIncreasing,
  Check,
  CircleHelp,
  Clock,
  Code,
  Cookie,
  Download,
  ExternalLink,
  Factory,
  FileText,
  Heart,
  Lightbulb,
  Mail,
  MapPin,
  MessageCircle,
  Palette,
  Phone,
  Play,
  Search,
  Send,
  Settings,
  Shield,
  ShieldCheck,
  Star,
  Target,
  TrendingUp,
  User,
  Users,
  Video,
  X,
  Zap,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAppRoute } from '../router/landingRouteStore';
import {
  aboutPageData,
  blogPageData,
  careersPageData,
  casosDeUsoPageData,
  cookiePolicyPageData,
  documentationPageData,
  glosarioPageData,
  guidesPageData,
  privacyPolicyPageData,
  SUBLIMIFYER_WHATSAPP_DEFAULT_MESSAGE,
  SUBLIMIFYER_WHATSAPP_PHONE,
  supportPageData,
  termsOfServicePageData,
  type SubpagePath,
} from '../data/subpagesData';
import { LandingFooter } from '../components/LandingFooter';
import { openWhatsApp } from '../components/WhatsAppFloatingButton';

export interface SubpageViewProps {
  subpagePath: SubpagePath;
}

const CARD_BASE =
  'rounded-lg border bg-card text-card-foreground shadow-sm';
const BADGE_SECONDARY =
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80';
const BADGE_OUTLINE =
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors text-foreground';
const INPUT_BASE =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm';
const BUTTON_PRIMARY =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md';
const BUTTON_OUTLINE =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 rounded-md';
const BUTTON_GHOST_SM =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3';

function getTranslationField(
  section: unknown,
  key: string,
  fallback: string
): string {
  if (
    section &&
    typeof section === 'object' &&
    key in (section as Record<string, unknown>)
  ) {
    const val = (section as Record<string, unknown>)[key];
    if (typeof val === 'string' && val.trim().length > 0) {
      return val;
    }
  }
  return fallback;
}

interface SubpageHeaderBarProps {
  backLabel: string;
  logoAlt?: string;
}

const SubpageHeaderBar: React.FC<SubpageHeaderBarProps> = ({
  backLabel,
  logoAlt = 'Sublimifyer',
}) => {
  const { navigateTo } = useAppRoute();

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-lg bg-background/80 border-b">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigateTo('/');
          }}
          className="flex items-center gap-2 font-bold"
        >
          <img
            src="/sublimifyer-logo.png"
            alt={logoAlt}
            width={120}
            height={40}
            className="h-8 w-auto"
          />
        </a>
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigateTo('/');
          }}
          className={BUTTON_GHOST_SM}
        >
          <ArrowLeft className="size-4 mr-2" />
          {backLabel}
        </a>
      </div>
    </header>
  );
};

// ---------------------------------------------------------------------------
// 1. /documentation
// ---------------------------------------------------------------------------

const DocumentationSubpage: React.FC = () => {
  const { t } = useLanguage();
  const { navigateTo } = useAppRoute();
  const docT = (t as unknown as Record<string, unknown>).documentation;
  const backLabel = getTranslationField(
    docT,
    'backToHome',
    documentationPageData.defaultBackToHome
  );

  const renderQuickLinkIcon = (icon: 'Video' | 'Download' | 'Users') => {
    switch (icon) {
      case 'Video':
        return <Video className="size-5 text-primary" />;
      case 'Download':
        return <Download className="size-5 text-primary" />;
      case 'Users':
        return <Users className="size-5 text-primary" />;
    }
  };

  const renderCategoryIcon = (
    icon: 'Zap' | 'Settings' | 'Code' | 'ChartNoAxesColumnIncreasing'
  ) => {
    switch (icon) {
      case 'Zap':
        return <Zap className="size-6 text-primary" />;
      case 'Settings':
        return <Settings className="size-6 text-primary" />;
      case 'Code':
        return <Code className="size-6 text-primary" />;
      case 'ChartNoAxesColumnIncreasing':
        return <ChartNoAxesColumnIncreasing className="size-6 text-primary" />;
    }
  };

  return (
    <>
      <SubpageHeaderBar backLabel={backLabel} />
      <main className="flex-1">
        {/* Hero */}
        <section className="w-full py-20 md:py-32 bg-gradient-to-br from-background to-muted/20">
          <div className="container px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center">
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Book className="size-8 text-primary" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
                {getTranslationField(
                  docT,
                  'title',
                  documentationPageData.defaultTitle
                )}
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                {getTranslationField(
                  docT,
                  'subtitle',
                  documentationPageData.defaultSubtitle
                )}
              </p>
              <div className="max-w-md mx-auto relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4" />
                <input
                  type="text"
                  placeholder={getTranslationField(
                    docT,
                    'searchPlaceholder',
                    documentationPageData.defaultSearchPlaceholder
                  )}
                  className={`${INPUT_BASE} pl-10 pr-4 py-2`}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section className="w-full py-16 bg-muted/30">
          <div className="container px-4 md:px-6">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-2xl font-bold mb-4">
                  {documentationPageData.quickLinksTitle}
                </h2>
                <p className="text-muted-foreground">
                  {documentationPageData.quickLinksSubtitle}
                </p>
              </div>
              <div className="grid gap-6 md:grid-cols-3">
                {documentationPageData.quickLinks.map((item, idx) => (
                  <div
                    key={idx}
                    className={`${CARD_BASE} border-border/40 bg-gradient-to-b from-background to-muted/10 hover:shadow-md transition-all`}
                  >
                    <div className="p-6 text-center">
                      <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        {renderQuickLinkIcon(item.icon)}
                      </div>
                      <h3 className="text-lg font-bold mb-2">
                        {getTranslationField(
                          docT,
                          item.titleKey,
                          item.defaultTitle
                        )}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-4">
                        {getTranslationField(
                          docT,
                          item.descKey,
                          item.defaultDescription
                        )}
                      </p>
                      <button
                        type="button"
                        onClick={() => navigateTo('/guides')}
                        className={`${BUTTON_OUTLINE} h-9 px-3 rounded-full`}
                      >
                        {documentationPageData.exploreLabel}
                        <ExternalLink className="size-3 ml-1" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="w-full py-20">
          <div className="container px-4 md:px-6">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold mb-4">
                  {documentationPageData.categoriesTitle}
                </h2>
                <p className="text-lg text-muted-foreground">
                  {documentationPageData.categoriesSubtitle}
                </p>
              </div>
              <div className="grid gap-8 md:grid-cols-2">
                {documentationPageData.categories.map((cat, idx) => (
                  <div
                    key={idx}
                    className={`${CARD_BASE} border-border/40 bg-gradient-to-b from-background to-muted/10`}
                  >
                    <div className="p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          {renderCategoryIcon(cat.icon)}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold mb-2">
                            {getTranslationField(
                              docT,
                              cat.titleKey,
                              cat.defaultTitle
                            )}
                          </h3>
                          <p className="text-muted-foreground">
                            {getTranslationField(
                              docT,
                              cat.descKey,
                              cat.defaultDescription
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {cat.defaultArticles.map((articleTitle, aIdx) => {
                          const key = cat.articleKeys[aIdx];
                          const resolvedArticle = getTranslationField(
                            docT,
                            key,
                            articleTitle
                          );
                          return (
                            <a
                              key={aIdx}
                              href="#article"
                              onClick={(e) => {
                                e.preventDefault();
                              }}
                              className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                            >
                              <div className="flex items-center gap-3">
                                <FileText className="size-4 text-muted-foreground" />
                                <span className="text-sm font-medium group-hover:text-primary transition-colors">
                                  {resolvedArticle}
                                </span>
                              </div>
                              <ExternalLink className="size-3 text-muted-foreground group-hover:text-primary transition-colors" />
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="w-full py-20 bg-muted/30">
          <div className="container px-4 md:px-6">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">
                {getTranslationField(
                  docT,
                  documentationPageData.cta.titleKey,
                  documentationPageData.cta.defaultTitle
                )}
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                {getTranslationField(
                  docT,
                  documentationPageData.cta.descKey,
                  documentationPageData.cta.defaultDescription
                )}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  type="button"
                  onClick={() =>
                    openWhatsApp(
                      documentationPageData.cta.whatsappPhone,
                      documentationPageData.cta.whatsappMessage
                    )
                  }
                  className={`${BUTTON_PRIMARY} h-11 rounded-full px-8`}
                >
                  {getTranslationField(
                    docT,
                    documentationPageData.cta.buttonKey,
                    documentationPageData.cta.defaultPrimaryButton
                  )}
                </button>
                <a
                  href="/"
                  onClick={(e) => {
                    e.preventDefault();
                    navigateTo('/');
                  }}
                  className={`${BUTTON_OUTLINE} h-11 rounded-full px-8`}
                >
                  {documentationPageData.cta.defaultSecondaryButton}
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <LandingFooter />
    </>
  );
};

// ---------------------------------------------------------------------------
// 2. /guides
// ---------------------------------------------------------------------------

const GuidesSubpage: React.FC = () => {
  const { t } = useLanguage();
  const { navigateTo } = useAppRoute();
  const guidesT = (t as unknown as Record<string, unknown>).guides;
  const backLabel = getTranslationField(
    guidesT,
    'backToHome',
    guidesPageData.defaultBackToHome
  );

  const renderQuickStartIcon = (icon: 'Play' | 'Download' | 'BookOpen') => {
    switch (icon) {
      case 'Play':
        return <Play className="size-5 text-primary" />;
      case 'Download':
        return <Download className="size-5 text-primary" />;
      case 'BookOpen':
        return <BookOpen className="size-5 text-primary" />;
    }
  };

  const renderCategoryIcon = (icon: 'Target' | 'Zap' | 'Lightbulb') => {
    switch (icon) {
      case 'Target':
        return <Target className="size-6 text-primary" />;
      case 'Zap':
        return <Zap className="size-6 text-primary" />;
      case 'Lightbulb':
        return <Lightbulb className="size-6 text-primary" />;
    }
  };

  return (
    <>
      <SubpageHeaderBar backLabel={backLabel} />
      <main className="flex-1">
        {/* Hero */}
        <section className="w-full py-20 md:py-32 bg-gradient-to-br from-background to-muted/20">
          <div className="container px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center">
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <BookOpen className="size-8 text-primary" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
                {getTranslationField(
                  guidesT,
                  'title',
                  guidesPageData.defaultTitle
                )}
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                {getTranslationField(
                  guidesT,
                  'subtitle',
                  guidesPageData.defaultSubtitle
                )}
              </p>
            </div>
          </div>
        </section>

        {/* Featured Guides */}
        <section className="w-full py-20">
          <div className="container px-4 md:px-6">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold mb-4">
                  {getTranslationField(
                    guidesT,
                    'featuredTitle',
                    guidesPageData.featuredTitle
                  )}
                </h2>
                <p className="text-lg text-muted-foreground">
                  {getTranslationField(
                    guidesT,
                    'featuredSubtitle',
                    guidesPageData.featuredSubtitle
                  )}
                </p>
              </div>
              <div className="grid gap-8 md:grid-cols-2">
                {guidesPageData.featuredGuides.map((guide, idx) => (
                  <div
                    key={idx}
                    className={`${CARD_BASE} border-border/40 bg-gradient-to-b from-background to-muted/10 overflow-hidden`}
                  >
                    <div className="p-8">
                      <div className="flex items-center gap-2 mb-4">
                        <span className={BADGE_SECONDARY}>
                          {getTranslationField(
                            guidesT,
                            guide.categoryKey,
                            guide.defaultCategory
                          )}
                        </span>
                        <span className={BADGE_OUTLINE}>
                          {getTranslationField(
                            guidesT,
                            guide.difficultyKey,
                            guide.defaultDifficulty
                          )}
                        </span>
                        {guide.featured && (
                          <span className="inline-flex items-center rounded-full border border-transparent px-2.5 py-0.5 text-xs font-semibold bg-yellow-100 text-yellow-800">
                            <Star className="size-3 mr-1" />
                            {guidesPageData.featuredBadge}
                          </span>
                        )}
                      </div>
                      <h3 className="text-2xl font-bold mb-3">
                        {getTranslationField(
                          guidesT,
                          guide.titleKey,
                          guide.defaultTitle
                        )}
                      </h3>
                      <p className="text-muted-foreground mb-6">
                        {getTranslationField(
                          guidesT,
                          guide.descKey,
                          guide.defaultDescription
                        )}
                      </p>
                      <div className="flex items-center justify-between mb-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Clock className="size-4" />
                            {guide.duration}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="size-4" />
                            {guide.author}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="size-4 text-yellow-500 fill-current" />
                          {guide.rating}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigateTo('/documentation')}
                        className={`${BUTTON_PRIMARY} w-full rounded-full`}
                      >
                        {guidesPageData.readGuideLabel}
                        <ArrowRight className="size-4 ml-2" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Quick Start */}
        <section className="w-full py-16 bg-muted/30">
          <div className="container px-4 md:px-6">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-2xl font-bold mb-4">
                  {guidesPageData.quickStartTitle}
                </h2>
                <p className="text-muted-foreground">
                  {guidesPageData.quickStartSubtitle}
                </p>
              </div>
              <div className="grid gap-6 md:grid-cols-3">
                {guidesPageData.quickStartItems.map((item, idx) => (
                  <div
                    key={idx}
                    className={`${CARD_BASE} border-border/40 bg-gradient-to-b from-background to-muted/10 hover:shadow-md transition-all`}
                  >
                    <div className="p-6 text-center">
                      <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        {renderQuickStartIcon(item.icon)}
                      </div>
                      <span className={`${BADGE_OUTLINE} mb-3`}>
                        {item.type}
                      </span>
                      <h3 className="text-lg font-bold mb-2">
                        {getTranslationField(
                          guidesT,
                          item.titleKey,
                          item.defaultTitle
                        )}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-4">
                        {getTranslationField(
                          guidesT,
                          item.descKey,
                          item.defaultDescription
                        )}
                      </p>
                      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-4">
                        <Clock className="size-3" />
                        {item.duration}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          navigateTo(
                            item.icon === 'BookOpen'
                              ? '/glosario'
                              : '/documentation'
                          )
                        }
                        className={`${BUTTON_OUTLINE} h-9 px-3 rounded-full w-full`}
                      >
                        {guidesPageData.accessLabel}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="w-full py-20">
          <div className="container px-4 md:px-6">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold mb-4">
                  {guidesPageData.categoriesTitle}
                </h2>
                <p className="text-lg text-muted-foreground">
                  {guidesPageData.categoriesSubtitle}
                </p>
              </div>
              <div className="grid gap-8 md:grid-cols-3">
                {guidesPageData.categories.map((cat, idx) => (
                  <div
                    key={idx}
                    className={`${CARD_BASE} border-border/40 bg-gradient-to-b from-background to-muted/10`}
                  >
                    <div className="p-6">
                      <div className="flex items-start gap-4 mb-6">
                        <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          {renderCategoryIcon(cat.icon)}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold mb-2">
                            {getTranslationField(
                              guidesT,
                              cat.titleKey,
                              cat.defaultTitle
                            )}
                          </h3>
                          <p className="text-muted-foreground text-sm">
                            {getTranslationField(
                              guidesT,
                              cat.descKey,
                              cat.defaultDescription
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {cat.guides.map((sub, sIdx) => (
                          <div
                            key={sIdx}
                            className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer"
                          >
                            <div>
                              <h4 className="font-medium text-sm group-hover:text-primary transition-colors">
                                {getTranslationField(
                                  guidesT,
                                  sub.titleKey,
                                  sub.defaultTitle
                                )}
                              </h4>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{sub.duration}</span>
                                <span>•</span>
                                <span>
                                  {getTranslationField(
                                    guidesT,
                                    sub.difficultyKey,
                                    sub.defaultDifficulty
                                  )}
                                </span>
                              </div>
                            </div>
                            <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="w-full py-20 bg-muted/30">
          <div className="container px-4 md:px-6">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">
                {getTranslationField(
                  guidesT,
                  guidesPageData.cta.titleKey,
                  guidesPageData.cta.defaultTitle
                )}
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                {getTranslationField(
                  guidesT,
                  guidesPageData.cta.descKey,
                  guidesPageData.cta.defaultDescription
                )}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  type="button"
                  onClick={() =>
                    openWhatsApp(
                      guidesPageData.cta.whatsappPhone,
                      guidesPageData.cta.whatsappMessage
                    )
                  }
                  className={`${BUTTON_PRIMARY} h-11 rounded-full px-8`}
                >
                  {getTranslationField(
                    guidesT,
                    guidesPageData.cta.buttonKey,
                    guidesPageData.cta.defaultPrimaryButton
                  )}
                </button>
                <a
                  href="/documentation"
                  onClick={(e) => {
                    e.preventDefault();
                    navigateTo('/documentation');
                  }}
                  className={`${BUTTON_OUTLINE} h-11 rounded-full px-8`}
                >
                  {getTranslationField(
                    guidesT,
                    guidesPageData.cta.docsButtonKey,
                    guidesPageData.cta.defaultSecondaryButton
                  )}
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <LandingFooter />
    </>
  );
};

// ---------------------------------------------------------------------------
// 3. /blog
// ---------------------------------------------------------------------------

const BlogSubpage: React.FC = () => {
  const { navigateTo } = useAppRoute();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  const filteredPosts = blogPageData.posts.filter((post) => {
    const matchesCategory =
      selectedCategory === 'Todos' || post.category === selectedCategory;
    const matchesQuery =
      searchQuery.trim().length === 0 ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <>
      <SubpageHeaderBar
        backLabel={blogPageData.backToHome}
        logoAlt={blogPageData.logoAlt}
      />
      <main className="flex-1">
        {/* Hero */}
        <section className="w-full py-20 md:py-32 bg-gradient-to-br from-background to-muted/20">
          <div className="container px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center">
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <BookOpen className="size-8 text-primary" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
                {blogPageData.title}
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                {blogPageData.subtitle}
              </p>
              <div className="max-w-md mx-auto relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={blogPageData.searchPlaceholder}
                  className={`${INPUT_BASE} pl-10 pr-4 py-2`}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Featured Post */}
        <section className="w-full py-16 bg-muted/30">
          <div className="container px-4 md:px-6">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-2xl font-bold mb-4">
                  {blogPageData.featuredSectionTitle}
                </h2>
              </div>
              <div
                className={`${CARD_BASE} border-border/40 bg-gradient-to-b from-background to-muted/10 overflow-hidden`}
              >
                <div className="p-0">
                  <div className="grid md:grid-cols-2 gap-0">
                    <div className="relative h-64 md:h-auto">
                      <img
                        src={blogPageData.featuredPost.image}
                        alt={blogPageData.featuredPost.imageAlt}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-8 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-4">
                        <span className={BADGE_SECONDARY}>
                          {blogPageData.featuredPost.category}
                        </span>
                        <span className="inline-flex items-center rounded-full border border-transparent px-2.5 py-0.5 text-xs font-semibold bg-yellow-100 text-yellow-800">
                          {blogPageData.featuredPost.badge}
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold mb-4">
                        {blogPageData.featuredPost.title}
                      </h3>
                      <p className="text-muted-foreground mb-6">
                        {blogPageData.featuredPost.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                        <div className="flex items-center gap-1">
                          <User className="size-4" />
                          {blogPageData.featuredPost.author}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="size-4" />
                          {blogPageData.featuredPost.date}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="size-4" />
                          {blogPageData.featuredPost.readTime}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigateTo('/casos-de-uso')}
                        className={`${BUTTON_PRIMARY} rounded-full w-fit`}
                      >
                        {blogPageData.featuredPost.buttonLabel}
                        <ArrowRight className="size-4 ml-2" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sidebar + Posts Grid */}
        <section className="w-full py-20">
          <div className="container px-4 md:px-6">
            <div className="max-w-6xl mx-auto">
              <div className="grid lg:grid-cols-4 gap-8">
                {/* Sidebar */}
                <div className="lg:col-span-1">
                  <div className={`${CARD_BASE} border-border/40 bg-gradient-to-b from-background to-muted/10`}>
                    <div className="p-6">
                      <h3 className="font-bold mb-4">
                        {blogPageData.categoriesTitle}
                      </h3>
                      <div className="space-y-2">
                        {blogPageData.categories.map((cat) => {
                          const isSelected = selectedCategory === cat.name;
                          return (
                            <div
                              key={cat.name}
                              onClick={() => setSelectedCategory(cat.name)}
                              className={`flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer ${
                                isSelected ? 'bg-primary/10 text-primary' : ''
                              }`}
                            >
                              <span className="text-sm font-medium">
                                {cat.name}
                              </span>
                              <span className={`${BADGE_OUTLINE} text-xs`}>
                                {cat.count}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`${CARD_BASE} border-border/40 bg-gradient-to-b from-background to-muted/10 mt-6`}
                  >
                    <div className="p-6">
                      <h3 className="font-bold mb-4">
                        {blogPageData.usefulPagesTitle}
                      </h3>
                      <div className="space-y-3 text-sm">
                        {blogPageData.usefulPages.map((page) => (
                          <a
                            key={page.href}
                            href={page.href}
                            onClick={(e) => {
                              e.preventDefault();
                              navigateTo(page.href);
                            }}
                            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                          >
                            <ArrowRight className="size-3.5" />
                            {page.label}
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Posts Grid */}
                <div className="lg:col-span-3">
                  <div className="grid gap-8 md:grid-cols-2">
                    {filteredPosts.map((post, idx) => (
                      <div
                        key={idx}
                        className={`${CARD_BASE} border-border/40 bg-gradient-to-b from-background to-muted/10 overflow-hidden hover:shadow-md transition-all`}
                      >
                        <div className="p-0">
                          <div className="relative h-48">
                            <img
                              src={post.image}
                              alt={post.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-4 left-4">
                              <span className={BADGE_SECONDARY}>
                                {post.category}
                              </span>
                            </div>
                          </div>
                          <div className="p-6">
                            <h3 className="text-xl font-bold mb-3 line-clamp-2">
                              {post.title}
                            </h3>
                            <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                              {post.excerpt}
                            </p>
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                              <div className="flex items-center gap-2">
                                <User className="size-3" />
                                {post.author}
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="size-3" />
                                {post.date}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="size-3" />
                                {post.readTime}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => navigateTo('/casos-de-uso')}
                              className={`${BUTTON_OUTLINE} h-9 px-3 rounded-full w-full`}
                            >
                              {blogPageData.readArticleLabel}
                              <ArrowRight className="size-3 ml-1" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="w-full py-20 bg-muted/30">
          <div className="container px-4 md:px-6">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">
                {blogPageData.cta.title}
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                {blogPageData.cta.description}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  type="button"
                  onClick={() => navigateTo('/app')}
                  className={`${BUTTON_PRIMARY} h-11 rounded-full px-8`}
                >
                  {blogPageData.cta.primaryButton}
                  <ArrowRight className="size-4 ml-2" />
                </button>
                <a
                  href={blogPageData.cta.secondaryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${BUTTON_OUTLINE} h-11 rounded-full px-8`}
                >
                  {blogPageData.cta.secondaryButton}
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <LandingFooter />
    </>
  );
};

// ---------------------------------------------------------------------------
// 4. /casos-de-uso
// ---------------------------------------------------------------------------

const CasosDeUsoSubpage: React.FC = () => {
  const { navigateTo } = useAppRoute();

  const renderCaseIcon = (
    icon: 'ShieldCheck' | 'Factory' | 'TrendingUp' | 'Palette'
  ) => {
    switch (icon) {
      case 'ShieldCheck':
        return <ShieldCheck className="size-6 text-primary" />;
      case 'Factory':
        return <Factory className="size-6 text-primary" />;
      case 'TrendingUp':
        return <TrendingUp className="size-6 text-primary" />;
      case 'Palette':
        return <Palette className="size-6 text-primary" />;
    }
  };

  return (
    <>
      <SubpageHeaderBar backLabel={casosDeUsoPageData.backToHome} />
      <main className="flex-1">
        {/* Hero */}
        <section className="w-full py-20 md:py-28 bg-gradient-to-br from-background to-muted/20">
          <div className="container px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center">
              <span className={`${BADGE_SECONDARY} rounded-full px-4 py-1.5 text-sm font-medium mb-4`}>
                {casosDeUsoPageData.badge}
              </span>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
                {casosDeUsoPageData.title}
              </h1>
              <p className="text-xl text-muted-foreground">
                {casosDeUsoPageData.subtitle}
              </p>
            </div>
          </div>
        </section>

        {/* Cases List */}
        <section className="w-full py-16 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="max-w-4xl mx-auto space-y-12">
              {casosDeUsoPageData.cases.map((useCase, idx) => (
                <div
                  key={idx}
                  className={`${CARD_BASE} border-border/40 bg-gradient-to-b from-background to-muted/10 overflow-hidden`}
                >
                  <div className="p-6 md:p-8">
                    <div className="flex items-start gap-4 mb-6">
                      <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        {renderCaseIcon(useCase.icon)}
                      </div>
                      <div>
                        <span className={`${BADGE_OUTLINE} mb-2 text-xs`}>
                          {useCase.badge}
                        </span>
                        <h2 className="text-2xl font-bold">{useCase.title}</h2>
                        <p className="text-muted-foreground text-sm mt-1">
                          {useCase.description}
                        </p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-5">
                        <h3 className="font-semibold text-sm text-destructive mb-3 flex items-center gap-2">
                          <X className="size-4" />
                          {casosDeUsoPageData.problemHeading}
                        </h3>
                        <ul className="space-y-2.5">
                          {useCase.pains.map((pain, pIdx) => (
                            <li
                              key={pIdx}
                              className="text-sm text-muted-foreground flex items-start gap-2"
                            >
                              <span className="text-destructive mt-1 flex-shrink-0">
                                •
                              </span>
                              <span>{pain}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="rounded-lg border border-primary/20 bg-primary/5 p-5">
                        <h3 className="font-semibold text-sm text-primary mb-3 flex items-center gap-2">
                          <Check className="size-4" />
                          {casosDeUsoPageData.solutionHeading}
                        </h3>
                        <ul className="space-y-2.5">
                          {useCase.resolutions.map((res, rIdx) => (
                            <li
                              key={rIdx}
                              className="text-sm text-foreground flex items-start gap-2"
                            >
                              <Check className="size-4 text-primary mt-0.5 flex-shrink-0" />
                              <span>{res}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {useCase.relatedLinks.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-border/30 flex flex-wrap gap-4">
                        <span className="text-xs text-muted-foreground">
                          {casosDeUsoPageData.learnMoreLabel}
                        </span>
                        {useCase.relatedLinks.map((rel, lIdx) => (
                          <a
                            key={lIdx}
                            href={rel.href}
                            onClick={(e) => {
                              e.preventDefault();
                              navigateTo(
                                rel.href.startsWith('/blog/')
                                  ? '/blog'
                                  : rel.href
                              );
                            }}
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            {rel.label}
                            <ArrowRight className="size-3" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Summary */}
        <section className="w-full py-16 bg-muted/30">
          <div className="container px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                {casosDeUsoPageData.summary.title}
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                {casosDeUsoPageData.summary.description}
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                {casosDeUsoPageData.summary.links.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={(e) => {
                      e.preventDefault();
                      navigateTo(link.href);
                    }}
                    className={`${BUTTON_OUTLINE} h-9 px-3 rounded-full`}
                  >
                    {link.label}
                    <ArrowRight className="size-3.5 ml-1.5" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="w-full py-20">
          <div className="container px-4 md:px-6">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">
                {casosDeUsoPageData.cta.title}
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                {casosDeUsoPageData.cta.description}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  type="button"
                  onClick={() =>
                    openWhatsApp(
                      casosDeUsoPageData.cta.whatsappPhone,
                      casosDeUsoPageData.cta.whatsappMessage
                    )
                  }
                  className={`${BUTTON_PRIMARY} h-11 rounded-full px-8`}
                >
                  <MessageCircle className="size-4 mr-2" />
                  {casosDeUsoPageData.cta.primaryButton}
                </button>
                <a
                  href="/"
                  onClick={(e) => {
                    e.preventDefault();
                    navigateTo('/');
                  }}
                  className={`${BUTTON_OUTLINE} h-11 rounded-full px-8`}
                >
                  {casosDeUsoPageData.cta.secondaryButton}
                  <ArrowRight className="size-4 ml-2" />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <LandingFooter />
    </>
  );
};

// ---------------------------------------------------------------------------
// 5. /glosario
// ---------------------------------------------------------------------------

const GlosarioSubpage: React.FC = () => {
  const { navigateTo } = useAppRoute();

  return (
    <>
      <SubpageHeaderBar backLabel={glosarioPageData.backToHome} />
      <main className="flex-1">
        {/* Hero */}
        <section className="w-full py-20 md:py-28 bg-gradient-to-br from-background to-muted/20">
          <div className="container px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center">
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <BookOpen className="size-8 text-primary" />
              </div>
              <span className={`${BADGE_SECONDARY} rounded-full px-4 py-1.5 text-sm font-medium mb-4`}>
                {glosarioPageData.badge}
              </span>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
                {glosarioPageData.title}
              </h1>
              <p className="text-xl text-muted-foreground">
                {glosarioPageData.subtitle}
              </p>
            </div>
          </div>
        </section>

        {/* Terms List */}
        <section className="w-full py-16 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="max-w-3xl mx-auto space-y-6">
              {glosarioPageData.terms.map((item) => (
                <div
                  key={item.id}
                  id={item.id}
                  className={`${CARD_BASE} border-border/40 bg-gradient-to-b from-background to-muted/10`}
                >
                  <div className="p-6 md:p-8">
                    <div className="flex items-start gap-3 mb-3">
                      <span className="inline-flex items-center justify-center size-7 rounded-md bg-primary/10 text-primary text-xs font-bold flex-shrink-0 mt-0.5">
                        {item.letter}
                      </span>
                      <h2 className="text-xl font-bold">{item.term}</h2>
                    </div>
                    <p className="text-muted-foreground leading-relaxed pl-10">
                      {item.definition}
                    </p>
                    {item.relatedLinks.length > 0 && (
                      <div className="mt-4 pl-10 flex flex-wrap gap-4">
                        <span className="text-xs text-muted-foreground">
                          {glosarioPageData.relatedLabel}
                        </span>
                        {item.relatedLinks.map((rel, rIdx) => (
                          <a
                            key={rIdx}
                            href={rel.href}
                            onClick={(e) => {
                              e.preventDefault();
                              navigateTo(
                                rel.href.startsWith('/blog/')
                                  ? '/blog'
                                  : rel.href
                              );
                            }}
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            {rel.label}
                            <ArrowRight className="size-3" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Summary */}
        <section className="w-full py-16 bg-muted/30">
          <div className="container px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                {glosarioPageData.summary.title}
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                {glosarioPageData.summary.description}
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                {glosarioPageData.summary.links.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={(e) => {
                      e.preventDefault();
                      navigateTo(link.href);
                    }}
                    className={`${BUTTON_OUTLINE} h-9 px-3 rounded-full`}
                  >
                    {link.label}
                    <ArrowRight className="size-3.5 ml-1.5" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="w-full py-20">
          <div className="container px-4 md:px-6">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">
                {glosarioPageData.cta.title}
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                {glosarioPageData.cta.description}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  type="button"
                  onClick={() =>
                    openWhatsApp(
                      glosarioPageData.cta.whatsappPhone,
                      glosarioPageData.cta.whatsappMessage
                    )
                  }
                  className={`${BUTTON_PRIMARY} h-11 rounded-full px-8`}
                >
                  <MessageCircle className="size-4 mr-2" />
                  {glosarioPageData.cta.primaryButton}
                </button>
                <a
                  href="/"
                  onClick={(e) => {
                    e.preventDefault();
                    navigateTo('/');
                  }}
                  className={`${BUTTON_OUTLINE} h-11 rounded-full px-8`}
                >
                  {glosarioPageData.cta.secondaryButton}
                  <ArrowRight className="size-4 ml-2" />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <LandingFooter />
    </>
  );
};

// ---------------------------------------------------------------------------
// 6. /support
// ---------------------------------------------------------------------------

const SupportSubpage: React.FC = () => {
  const { t } = useLanguage();
  const { navigateTo } = useAppRoute();
  const supportT = (t as unknown as Record<string, unknown>).support;
  const backLabel = getTranslationField(
    supportT,
    'backToHome',
    supportPageData.defaultBackToHome
  );

  const renderContactIcon = (icon: 'MessageCircle' | 'Mail' | 'Phone') => {
    switch (icon) {
      case 'MessageCircle':
        return <MessageCircle className="size-6 text-primary" />;
      case 'Mail':
        return <Mail className="size-6 text-primary" />;
      case 'Phone':
        return <Phone className="size-6 text-primary" />;
    }
  };

  const renderResourceIcon = (
    icon: 'FileText' | 'Video' | 'Users' | 'Zap'
  ) => {
    switch (icon) {
      case 'FileText':
        return <FileText className="size-5 text-primary" />;
      case 'Video':
        return <Video className="size-5 text-primary" />;
      case 'Users':
        return <Users className="size-5 text-primary" />;
      case 'Zap':
        return <Zap className="size-5 text-primary" />;
    }
  };

  return (
    <>
      <SubpageHeaderBar backLabel={backLabel} />
      <main className="flex-1">
        {/* Hero */}
        <section className="w-full py-20 md:py-32 bg-gradient-to-br from-background to-muted/20">
          <div className="container px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center">
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <CircleHelp className="size-8 text-primary" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
                {getTranslationField(
                  supportT,
                  'title',
                  supportPageData.defaultTitle
                )}
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                {getTranslationField(
                  supportT,
                  'subtitle',
                  supportPageData.defaultSubtitle
                )}
              </p>
              <div className="max-w-md mx-auto relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4" />
                <input
                  type="text"
                  placeholder={getTranslationField(
                    supportT,
                    'searchPlaceholder',
                    supportPageData.defaultSearchPlaceholder
                  )}
                  className={`${INPUT_BASE} pl-10 pr-4 py-2`}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Contact Options */}
        <section className="w-full py-20">
          <div className="container px-4 md:px-6">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold mb-4">
                  {getTranslationField(
                    supportT,
                    'contactTitle',
                    supportPageData.defaultContactTitle
                  )}
                </h2>
                <p className="text-lg text-muted-foreground">
                  {getTranslationField(
                    supportT,
                    'contactSubtitle',
                    supportPageData.defaultContactSubtitle
                  )}
                </p>
              </div>
              <div className="grid gap-8 md:grid-cols-3">
                {supportPageData.contactOptions.map((option, idx) => (
                  <div
                    key={idx}
                    className={`${CARD_BASE} border-border/40 bg-gradient-to-b from-background to-muted/10 text-center`}
                  >
                    <div className="p-8">
                      <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                        {renderContactIcon(option.icon)}
                      </div>
                      <h3 className="text-xl font-bold mb-3">
                        {getTranslationField(
                          supportT,
                          option.titleKey,
                          option.defaultTitle
                        )}
                      </h3>
                      <p className="text-muted-foreground mb-6">
                        {getTranslationField(
                          supportT,
                          option.descKey,
                          option.defaultDescription
                        )}
                      </p>
                      <div className="space-y-2 mb-6 text-sm">
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                          <Clock className="size-4" />
                          {getTranslationField(
                            supportT,
                            option.availabilityKey,
                            option.defaultAvailability
                          )}
                        </div>
                        <div className="flex items-center justify-center gap-2 text-green-600">
                          <Check className="size-4" />
                          {getTranslationField(
                            supportT,
                            option.responseKey,
                            option.defaultResponseTime
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          openWhatsApp(
                            SUBLIMIFYER_WHATSAPP_PHONE,
                            SUBLIMIFYER_WHATSAPP_DEFAULT_MESSAGE
                          )
                        }
                        className={`${BUTTON_PRIMARY} w-full rounded-full`}
                      >
                        {getTranslationField(
                          supportT,
                          'contactNow',
                          supportPageData.defaultContactNow
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="w-full py-20 bg-muted/30">
          <div className="container px-4 md:px-6">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold mb-4">
                  {getTranslationField(
                    supportT,
                    'faqTitle',
                    supportPageData.defaultFaqTitle
                  )}
                </h2>
                <p className="text-lg text-muted-foreground">
                  {getTranslationField(
                    supportT,
                    'faqSubtitle',
                    supportPageData.defaultFaqSubtitle
                  )}
                </p>
              </div>
              <div className="space-y-8">
                {supportPageData.faqCategories.map((cat, idx) => (
                  <div
                    key={idx}
                    className={`${CARD_BASE} border-border/40 bg-gradient-to-b from-background to-muted/10`}
                  >
                    <div className="p-8">
                      <h3 className="text-2xl font-bold mb-6">
                        {getTranslationField(
                          supportT,
                          cat.titleKey,
                          cat.defaultTitle
                        )}
                      </h3>
                      <div className="space-y-6">
                        {cat.questions.map((q, qIdx) => (
                          <div
                            key={qIdx}
                            className="border-b border-border/40 pb-6 last:border-b-0 last:pb-0"
                          >
                            <h4 className="font-semibold text-lg mb-2">
                              {getTranslationField(
                                supportT,
                                q.questionKey,
                                q.defaultQuestion
                              )}
                            </h4>
                            <p className="text-muted-foreground">
                              {getTranslationField(
                                supportT,
                                q.answerKey,
                                q.defaultAnswer
                              )}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Useful Resources */}
        <section className="w-full py-20">
          <div className="container px-4 md:px-6">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold mb-4">
                  {getTranslationField(
                    supportT,
                    'resourcesTitle',
                    supportPageData.defaultResourcesTitle
                  )}
                </h2>
                <p className="text-lg text-muted-foreground">
                  {getTranslationField(
                    supportT,
                    'resourcesSubtitle',
                    supportPageData.defaultResourcesSubtitle
                  )}
                </p>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {supportPageData.resources.map((res, idx) => (
                  <div
                    key={idx}
                    className={`${CARD_BASE} border-border/40 bg-gradient-to-b from-background to-muted/10 hover:shadow-md transition-all`}
                  >
                    <div className="p-6 text-center">
                      <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        {renderResourceIcon(res.icon)}
                      </div>
                      <h3 className="text-lg font-bold mb-2">
                        {getTranslationField(
                          supportT,
                          res.titleKey,
                          res.defaultTitle
                        )}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-4">
                        {getTranslationField(
                          supportT,
                          res.descKey,
                          res.defaultDescription
                        )}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          navigateTo(
                            res.link === '#' ? '/documentation' : res.link
                          )
                        }
                        className={`${BUTTON_OUTLINE} h-9 px-3 rounded-full w-full`}
                      >
                        {supportPageData.exploreLabel}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section className="w-full py-20 bg-muted/30">
          <div className="container px-4 md:px-6">
            <div className="max-w-2xl mx-auto">
              <div
                className={`${CARD_BASE} border-border/40 bg-gradient-to-b from-background to-muted/10`}
              >
                <div className="p-8">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold mb-2">
                      {getTranslationField(
                        supportT,
                        'formTitle',
                        supportPageData.contactForm.defaultTitle
                      )}
                    </h2>
                    <p className="text-muted-foreground">
                      {getTranslationField(
                        supportT,
                        'formSubtitle',
                        supportPageData.contactForm.defaultSubtitle
                      )}
                    </p>
                  </div>
                  <form
                    className="space-y-6"
                    onSubmit={(e) => {
                      e.preventDefault();
                      openWhatsApp(
                        SUBLIMIFYER_WHATSAPP_PHONE,
                        SUBLIMIFYER_WHATSAPP_DEFAULT_MESSAGE
                      );
                    }}
                  >
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          {getTranslationField(
                            supportT,
                            'nameLabel',
                            supportPageData.contactForm.defaultNameLabel
                          )}
                        </label>
                        <input
                          type="text"
                          placeholder={getTranslationField(
                            supportT,
                            'namePlaceholder',
                            supportPageData.contactForm.defaultNamePlaceholder
                          )}
                          className={INPUT_BASE}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          {getTranslationField(
                            supportT,
                            'emailLabel',
                            supportPageData.contactForm.defaultEmailLabel
                          )}
                        </label>
                        <input
                          type="email"
                          placeholder={getTranslationField(
                            supportT,
                            'emailPlaceholder',
                            supportPageData.contactForm.defaultEmailPlaceholder
                          )}
                          className={INPUT_BASE}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        {getTranslationField(
                          supportT,
                          'subjectLabel',
                          supportPageData.contactForm.defaultSubjectLabel
                        )}
                      </label>
                      <input
                        type="text"
                        placeholder={getTranslationField(
                          supportT,
                          'subjectPlaceholder',
                          supportPageData.contactForm.defaultSubjectPlaceholder
                        )}
                        className={INPUT_BASE}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        {getTranslationField(
                          supportT,
                          'messageLabel',
                          supportPageData.contactForm.defaultMessageLabel
                        )}
                      </label>
                      <textarea
                        rows={5}
                        placeholder={getTranslationField(
                          supportT,
                          'messagePlaceholder',
                          supportPageData.contactForm.defaultMessagePlaceholder
                        )}
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                    </div>
                    <button
                      type="submit"
                      className={`${BUTTON_PRIMARY} w-full rounded-full`}
                    >
                      <Send className="size-4 mr-2" />
                      {getTranslationField(
                        supportT,
                        'sendButton',
                        supportPageData.contactForm.defaultSubmitLabel
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <LandingFooter />
    </>
  );
};

// ---------------------------------------------------------------------------
// 7. /about
// ---------------------------------------------------------------------------

const AboutSubpage: React.FC = () => {
  const { t } = useLanguage();
  const { navigateTo } = useAppRoute();

  const values = [
    {
      icon: <Target className="size-6 text-primary" />,
      title: t.about.value1Title,
      description: t.about.value1Description,
    },
    {
      icon: <Users className="size-6 text-primary" />,
      title: t.about.value2Title,
      description: t.about.value2Description,
    },
    {
      icon: <Zap className="size-6 text-primary" />,
      title: t.about.value3Title,
      description: t.about.value3Description,
    },
    {
      icon: <Heart className="size-6 text-primary" />,
      title: t.about.value4Title,
      description: t.about.value4Description,
    },
  ];

  return (
    <>
      <SubpageHeaderBar backLabel={t.about.backToHome} />
      <main className="flex-1">
        {/* Hero */}
        <section className="w-full py-20 md:py-32 bg-gradient-to-br from-background to-muted/20">
          <div className="container px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
                {t.about.title}
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                {t.about.subtitle}
              </p>
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="w-full py-20">
          <div className="container px-4 md:px-6">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold mb-4">
                  {t.about.missionTitle}
                </h2>
                <p className="text-lg text-muted-foreground">
                  {t.about.missionDescription}
                </p>
              </div>
              <div className="grid gap-8 md:grid-cols-2">
                {values.slice(0, 2).map((val, idx) => (
                  <div
                    key={idx}
                    className={`${CARD_BASE} border-border/40 bg-gradient-to-b from-background to-muted/10`}
                  >
                    <div className="p-8 text-center">
                      <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        {val.icon}
                      </div>
                      <h3 className="text-xl font-bold mb-3">{val.title}</h3>
                      <p className="text-muted-foreground">{val.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="w-full py-20 bg-muted/30">
          <div className="container px-4 md:px-6">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold mb-4">
                  {t.about.valuesTitle}
                </h2>
                <p className="text-lg text-muted-foreground">
                  {t.about.valuesSubtitle}
                </p>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                {values.map((val, idx) => (
                  <div key={idx} className="flex items-start gap-4">
                    <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                      {val.icon}
                    </div>
                    <div>
                      <h3 className="font-bold mb-2">{val.title}</h3>
                      <p className="text-muted-foreground text-sm">
                        {val.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Story */}
        <section className="w-full py-20">
          <div className="container px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-6">{t.about.storyTitle}</h2>
              <div className="space-y-6 text-muted-foreground text-left">
                <p>{t.about.story1}</p>
                <p>{t.about.story2}</p>
                <p>{t.about.story3}</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="w-full py-20 bg-muted/30">
          <div className="container px-4 md:px-6">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">{t.about.ctaTitle}</h2>
              <p className="text-lg text-muted-foreground mb-8">
                {t.about.ctaDescription}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  type="button"
                  onClick={() => navigateTo('/app')}
                  className={`${BUTTON_PRIMARY} h-11 rounded-full px-8`}
                >
                  {t.about.ctaButton}
                </button>
                <a
                  href={aboutPageData.secondaryCtaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${BUTTON_OUTLINE} h-11 rounded-full px-8`}
                >
                  {t.about.contactButton}
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <LandingFooter />
    </>
  );
};

// ---------------------------------------------------------------------------
// 8. /careers
// ---------------------------------------------------------------------------

const CareersSubpage: React.FC = () => {
  const { t } = useLanguage();

  const benefits = [
    {
      icon: <Heart className="size-6 text-primary" />,
      title: t.careers.benefit1Title,
      description: t.careers.benefit1Description,
    },
    {
      icon: <Zap className="size-6 text-primary" />,
      title: t.careers.benefit2Title,
      description: t.careers.benefit2Description,
    },
    {
      icon: <Target className="size-6 text-primary" />,
      title: t.careers.benefit3Title,
      description: t.careers.benefit3Description,
    },
    {
      icon: <Users className="size-6 text-primary" />,
      title: t.careers.benefit4Title,
      description: t.careers.benefit4Description,
    },
    {
      icon: <Briefcase className="size-6 text-primary" />,
      title: t.careers.benefit5Title,
      description: t.careers.benefit5Description,
    },
    {
      icon: <Clock className="size-6 text-primary" />,
      title: t.careers.benefit6Title,
      description: t.careers.benefit6Description,
    },
  ];

  const positions = [
    {
      title: t.careers.position1Title,
      location: t.careers.position1Location,
      type: t.careers.position1Type,
      description: t.careers.position1Description,
    },
    {
      title: t.careers.position2Title,
      location: t.careers.position2Location,
      type: t.careers.position2Type,
      description: t.careers.position2Description,
    },
    {
      title: t.careers.position3Title,
      location: t.careers.position3Location,
      type: t.careers.position3Type,
      description: t.careers.position3Description,
    },
  ];

  return (
    <>
      <SubpageHeaderBar backLabel={t.careers.backToHome} />
      <main className="flex-1">
        {/* Hero */}
        <section className="w-full py-20 md:py-32 bg-gradient-to-br from-background to-muted/20">
          <div className="container px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
                {t.careers.title}
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                {t.careers.subtitle}
              </p>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="w-full py-20">
          <div className="container px-4 md:px-6">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold mb-4">
                  {t.careers.whyWorkTitle}
                </h2>
                <p className="text-lg text-muted-foreground">
                  {t.careers.whyWorkSubtitle}
                </p>
              </div>
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {benefits.map((b, idx) => (
                  <div
                    key={idx}
                    className={`${CARD_BASE} border-border/40 bg-gradient-to-b from-background to-muted/10`}
                  >
                    <div className="p-6 text-center">
                      <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        {b.icon}
                      </div>
                      <h3 className="text-lg font-bold mb-2">{b.title}</h3>
                      <p className="text-muted-foreground text-sm">
                        {b.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Positions */}
        <section className="w-full py-20 bg-muted/30">
          <div className="container px-4 md:px-6">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold mb-4">
                  {t.careers.positionsTitle}
                </h2>
                <p className="text-lg text-muted-foreground">
                  {t.careers.positionsSubtitle}
                </p>
              </div>
              <div className="space-y-6">
                {positions.map((pos, idx) => (
                  <div
                    key={idx}
                    className={`${CARD_BASE} border-border/40 bg-gradient-to-b from-background to-muted/10`}
                  >
                    <div className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="space-y-2">
                          <h3 className="text-xl font-bold">{pos.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MapPin className="size-4" />
                              {pos.location}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="size-4" />
                              {pos.type}
                            </div>
                          </div>
                          <p className="text-muted-foreground">
                            {pos.description}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            openWhatsApp(
                              SUBLIMIFYER_WHATSAPP_PHONE,
                              `Hola! Me interesa aplicar a la posición: ${pos.title}`
                            )
                          }
                          className={`${BUTTON_PRIMARY} rounded-full`}
                        >
                          {t.careers.applyButton}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="w-full py-20">
          <div className="container px-4 md:px-6">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">{t.careers.ctaTitle}</h2>
              <p className="text-lg text-muted-foreground mb-8">
                {t.careers.ctaDescription}
              </p>
              <button
                type="button"
                onClick={() =>
                  openWhatsApp(
                    SUBLIMIFYER_WHATSAPP_PHONE,
                    SUBLIMIFYER_WHATSAPP_DEFAULT_MESSAGE
                  )
                }
                className={`${BUTTON_PRIMARY} h-11 rounded-full px-8`}
              >
                {t.careers.ctaButton}
              </button>
            </div>
          </div>
        </section>
      </main>
      <LandingFooter />
    </>
  );
};

// ---------------------------------------------------------------------------
// 9. /privacy-policy
// ---------------------------------------------------------------------------

const PrivacyPolicySubpage: React.FC = () => {
  const { t } = useLanguage();

  return (
    <>
      <SubpageHeaderBar backLabel={t.privacy.backToHome} />
      <main className="flex-1">
        {/* Hero */}
        <section className="w-full py-20 md:py-32 bg-gradient-to-br from-background to-muted/20">
          <div className="container px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center">
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Shield className="size-8 text-primary" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
                {t.privacy.title}
              </h1>
              <p className="text-xl text-muted-foreground mb-4">
                {t.privacy.subtitle}
              </p>
              <p className="text-sm text-muted-foreground">
                {t.privacy.lastUpdated}
              </p>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="w-full py-20">
          <div className="container px-4 md:px-6">
            <div className="max-w-4xl mx-auto space-y-12">
              <div
                className={`${CARD_BASE} border-border/40 bg-gradient-to-b from-background to-muted/10`}
              >
                <div className="p-8">
                  <h2 className="text-2xl font-bold mb-4">
                    {t.privacy.introductionTitle}
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    {t.privacy.introductionText}
                  </p>
                  <p className="text-muted-foreground">
                    {t.privacy.introductionText2}
                  </p>
                </div>
              </div>

              <div
                className={`${CARD_BASE} border-border/40 bg-gradient-to-b from-background to-muted/10`}
              >
                <div className="p-8">
                  <h2 className="text-2xl font-bold mb-4">
                    {t.privacy.dataCollectionTitle}
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                        {t.privacy.personalInfoTitle}
                      </h3>
                      <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                        <li>{t.privacy.personalInfo1}</li>
                        <li>{t.privacy.personalInfo2}</li>
                        <li>{t.privacy.personalInfo3}</li>
                        <li>{t.privacy.personalInfo4}</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                        {t.privacy.usageInfoTitle}
                      </h3>
                      <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                        <li>{t.privacy.usageInfo1}</li>
                        <li>{t.privacy.usageInfo2}</li>
                        <li>{t.privacy.usageInfo3}</li>
                        <li>{t.privacy.usageInfo4}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className={`${CARD_BASE} border-border/40 bg-gradient-to-b from-background to-muted/10`}
              >
                <div className="p-8">
                  <h2 className="text-2xl font-bold mb-4">
                    {t.privacy.dataUsageTitle}
                  </h2>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>{t.privacy.usage1}</li>
                    <li>{t.privacy.usage2}</li>
                    <li>{t.privacy.usage3}</li>
                    <li>{t.privacy.usage4}</li>
                    <li>{t.privacy.usage5}</li>
                    <li>{t.privacy.usage6}</li>
                  </ul>
                </div>
              </div>

              <div
                className={`${CARD_BASE} border-border/40 bg-gradient-to-b from-background to-muted/10`}
              >
                <div className="p-8">
                  <h2 className="text-2xl font-bold mb-4">
                    {t.privacy.dataProtectionTitle}
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    {t.privacy.dataProtectionText}
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>{t.privacy.security1}</li>
                    <li>{t.privacy.security2}</li>
                    <li>{t.privacy.security3}</li>
                    <li>{t.privacy.security4}</li>
                  </ul>
                </div>
              </div>

              <div
                className={`${CARD_BASE} border-border/40 bg-gradient-to-b from-background to-muted/10`}
              >
                <div className="p-8">
                  <h2 className="text-2xl font-bold mb-4">
                    {t.privacy.dataSharingTitle}
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    {t.privacy.dataSharingText}
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>{t.privacy.sharing1}</li>
                    <li>{t.privacy.sharing2}</li>
                    <li>{t.privacy.sharing3}</li>
                    <li>{t.privacy.sharing4}</li>
                  </ul>
                </div>
              </div>

              <div
                className={`${CARD_BASE} border-border/40 bg-gradient-to-b from-background to-muted/10`}
              >
                <div className="p-8">
                  <h2 className="text-2xl font-bold mb-4">
                    {t.privacy.rightsTitle}
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    {t.privacy.rightsText}
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>{t.privacy.right1}</li>
                    <li>{t.privacy.right2}</li>
                    <li>{t.privacy.right3}</li>
                    <li>{t.privacy.right4}</li>
                    <li>{t.privacy.right5}</li>
                    <li>{t.privacy.right6}</li>
                  </ul>
                </div>
              </div>

              <div
                className={`${CARD_BASE} border-border/40 bg-gradient-to-b from-background to-muted/10`}
              >
                <div className="p-8">
                  <h2 className="text-2xl font-bold mb-4">
                    {t.privacy.contactTitle}
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    {t.privacy.contactText}
                  </p>
                  <div className="space-y-2 text-muted-foreground">
                    <p>
                      <strong>{privacyPolicyPageData.contact.emailLabel}</strong>{' '}
                      {privacyPolicyPageData.contact.email}
                    </p>
                    <p>
                      <strong>
                        {privacyPolicyPageData.contact.addressLabel}
                      </strong>{' '}
                      {privacyPolicyPageData.contact.address}
                    </p>
                    <p>
                      <strong>
                        {privacyPolicyPageData.contact.phoneLabel}
                      </strong>{' '}
                      {privacyPolicyPageData.contact.phone}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <LandingFooter />
    </>
  );
};

// ---------------------------------------------------------------------------
// 10. /terms-of-service
// ---------------------------------------------------------------------------

const TermsOfServiceSubpage: React.FC = () => {
  const { t } = useLanguage();

  return (
    <>
      <SubpageHeaderBar backLabel={t.terms.backToHome} />
      <main className="flex-1">
        {/* Hero */}
        <section className="w-full py-20 md:py-32 bg-gradient-to-br from-background to-muted/20">
          <div className="container px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center">
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <FileText className="size-8 text-primary" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
                {t.terms.title}
              </h1>
              <p className="text-xl text-muted-foreground mb-4">
                {t.terms.subtitle}
              </p>
              <p className="text-sm text-muted-foreground">
                {t.terms.lastUpdated}
              </p>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="w-full py-20">
          <div className="container px-4 md:px-6">
            <div className="max-w-4xl mx-auto space-y-12">
              <div
                className={`${CARD_BASE} border-border/40 bg-gradient-to-b from-background to-muted/10`}
              >
                <div className="p-8">
                  <h2 className="text-2xl font-bold mb-4">
                    {t.terms.introductionTitle}
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    {t.terms.introductionText}
                  </p>
                  <p className="text-muted-foreground">
                    {t.terms.introductionText2}
                  </p>
                </div>
              </div>

              <div
                className={`${CARD_BASE} border-border/40 bg-gradient-to-b from-background to-muted/10`}
              >
                <div className="p-8">
                  <h2 className="text-2xl font-bold mb-4">
                    {t.terms.serviceTitle}
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    {t.terms.serviceText}
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
                    <li>{t.terms.service1}</li>
                    <li>{t.terms.service2}</li>
                    <li>{t.terms.service3}</li>
                    <li>{t.terms.service4}</li>
                    <li>{t.terms.service5}</li>
                  </ul>
                  <p className="text-muted-foreground">
                    {t.terms.serviceUptime}
                  </p>
                </div>
              </div>

              <div
                className={`${CARD_BASE} border-border/40 bg-gradient-to-b from-background to-muted/10`}
              >
                <div className="p-8">
                  <h2 className="text-2xl font-bold mb-4">
                    {t.terms.subscriptionTitle}
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                        {t.terms.billingTitle}
                      </h3>
                      <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                        <li>{t.terms.billing1}</li>
                        <li>{t.terms.billing2}</li>
                        <li>{t.terms.billing3}</li>
                        <li>{t.terms.billing4}</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                        {t.terms.limitsTitle}
                      </h3>
                      <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                        <li>{t.terms.limits1}</li>
                        <li>{t.terms.limits2}</li>
                        <li>{t.terms.limits3}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className={`${CARD_BASE} border-border/40 bg-gradient-to-b from-background to-muted/10`}
              >
                <div className="p-8">
                  <h2 className="text-2xl font-bold mb-4">
                    {t.terms.responsibilitiesTitle}
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                        {t.terms.accountTitle}
                      </h3>
                      <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                        <li>{t.terms.account1}</li>
                        <li>{t.terms.account2}</li>
                        <li>{t.terms.account3}</li>
                        <li>{t.terms.account4}</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                        {t.terms.contentTitle}
                      </h3>
                      <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                        <li>{t.terms.content1}</li>
                        <li>{t.terms.content2}</li>
                        <li>{t.terms.content3}</li>
                        <li>{t.terms.content4}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className={`${CARD_BASE} border-border/40 bg-gradient-to-b from-background to-muted/10`}
              >
                <div className="p-8">
                  <h2 className="text-2xl font-bold mb-4">{t.terms.ipTitle}</h2>
                  <p className="text-muted-foreground mb-4">{t.terms.ipText}</p>
                  <p className="text-muted-foreground">{t.terms.ipText2}</p>
                </div>
              </div>

              <div
                className={`${CARD_BASE} border-border/40 bg-gradient-to-b from-background to-muted/10`}
              >
                <div className="p-8">
                  <h2 className="text-2xl font-bold mb-4">
                    {t.terms.terminationTitle}
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    {t.terms.terminationText}
                  </p>
                  <p className="text-muted-foreground">
                    {t.terms.terminationText2}
                  </p>
                </div>
              </div>

              <div
                className={`${CARD_BASE} border-border/40 bg-gradient-to-b from-background to-muted/10`}
              >
                <div className="p-8">
                  <h2 className="text-2xl font-bold mb-4">
                    {t.terms.liabilityTitle}
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    {t.terms.liabilityText}
                  </p>
                  <p className="text-muted-foreground mb-4">
                    {t.terms.liabilityText2}
                  </p>
                  <p className="text-muted-foreground">
                    {t.terms.liabilityText3}
                  </p>
                </div>
              </div>

              <div
                className={`${CARD_BASE} border-border/40 bg-gradient-to-b from-background to-muted/10`}
              >
                <div className="p-8">
                  <h2 className="text-2xl font-bold mb-4">
                    {t.terms.contactTitle}
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    {t.terms.contactText}
                  </p>
                  <div className="space-y-2 text-muted-foreground">
                    <p>
                      <strong>
                        {termsOfServicePageData.contact.emailLabel}
                      </strong>{' '}
                      {termsOfServicePageData.contact.email}
                    </p>
                    <p>
                      <strong>
                        {termsOfServicePageData.contact.addressLabel}
                      </strong>{' '}
                      {termsOfServicePageData.contact.address}
                    </p>
                    <p>
                      <strong>
                        {termsOfServicePageData.contact.phoneLabel}
                      </strong>{' '}
                      {termsOfServicePageData.contact.phone}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <LandingFooter />
    </>
  );
};

// ---------------------------------------------------------------------------
// 11. /cookie-policy
// ---------------------------------------------------------------------------

const CookiePolicySubpage: React.FC = () => {
  const { t } = useLanguage();

  return (
    <>
      <SubpageHeaderBar backLabel={t.cookies.backToHome} />
      <main className="flex-1">
        {/* Hero */}
        <section className="w-full py-20 md:py-32 bg-gradient-to-br from-background to-muted/20">
          <div className="container px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center">
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Cookie className="size-8 text-primary" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
                {t.cookies.title}
              </h1>
              <p className="text-xl text-muted-foreground mb-4">
                {t.cookies.subtitle}
              </p>
              <p className="text-sm text-muted-foreground">
                {t.cookies.lastUpdated}
              </p>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="w-full py-20">
          <div className="container px-4 md:px-6">
            <div className="max-w-4xl mx-auto space-y-12">
              <div
                className={`${CARD_BASE} border-border/40 bg-gradient-to-b from-background to-muted/10`}
              >
                <div className="p-8">
                  <h2 className="text-2xl font-bold mb-4">
                    {t.cookies.introductionTitle}
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    {t.cookies.introductionText}
                  </p>
                  <p className="text-muted-foreground">
                    {t.cookies.introductionText2}
                  </p>
                </div>
              </div>

              <div
                className={`${CARD_BASE} border-border/40 bg-gradient-to-b from-background to-muted/10`}
              >
                <div className="p-8">
                  <h2 className="text-2xl font-bold mb-4">
                    {t.cookies.typesTitle}
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                        {t.cookies.essentialTitle}
                      </h3>
                      <p className="text-muted-foreground mb-3">
                        {t.cookies.essentialText}
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        <li>{t.cookies.essential1}</li>
                        <li>{t.cookies.essential2}</li>
                        <li>{t.cookies.essential3}</li>
                        <li>{t.cookies.essential4}</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                        {t.cookies.analyticsTitle}
                      </h3>
                      <p className="text-muted-foreground mb-3">
                        {t.cookies.analyticsText}
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        <li>{t.cookies.analytics1}</li>
                        <li>{t.cookies.analytics2}</li>
                        <li>{t.cookies.analytics3}</li>
                        <li>{t.cookies.analytics4}</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                        {t.cookies.functionalTitle}
                      </h3>
                      <p className="text-muted-foreground mb-3">
                        {t.cookies.functionalText}
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        <li>{t.cookies.functional1}</li>
                        <li>{t.cookies.functional2}</li>
                        <li>{t.cookies.functional3}</li>
                        <li>{t.cookies.functional4}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className={`${CARD_BASE} border-border/40 bg-gradient-to-b from-background to-muted/10`}
              >
                <div className="p-8">
                  <h2 className="text-2xl font-bold mb-4">
                    {t.cookies.managementTitle}
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    {t.cookies.managementText}
                  </p>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                        {t.cookies.management1.split(':')[0]}:
                      </h3>
                      <p className="text-muted-foreground">
                        {t.cookies.management1.split(':')[1]}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                        {t.cookies.management2.split(':')[0]}:
                      </h3>
                      <p className="text-muted-foreground">
                        {t.cookies.management2.split(':')[1]}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                        {t.cookies.management3.split(':')[0]}:
                      </h3>
                      <p className="text-muted-foreground">
                        {t.cookies.management3.split(':')[1]}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className={`${CARD_BASE} border-border/40 bg-gradient-to-b from-background to-muted/10`}
              >
                <div className="p-8">
                  <h2 className="text-2xl font-bold mb-4">
                    {t.cookies.thirdPartyTitle}
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    {t.cookies.thirdPartyText}
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
                    <li>{t.cookies.thirdParty1}</li>
                    <li>{t.cookies.thirdParty2}</li>
                    <li>{t.cookies.thirdParty3}</li>
                    <li>{t.cookies.thirdParty4}</li>
                  </ul>
                  <p className="text-muted-foreground">
                    {t.cookies.thirdPartyNote}
                  </p>
                </div>
              </div>

              <div
                className={`${CARD_BASE} border-border/40 bg-gradient-to-b from-background to-muted/10`}
              >
                <div className="p-8">
                  <h2 className="text-2xl font-bold mb-4">
                    {t.cookies.rightsTitle}
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    {t.cookies.rightsText}
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>{t.cookies.right1}</li>
                    <li>{t.cookies.right2}</li>
                    <li>{t.cookies.right3}</li>
                    <li>{t.cookies.right4}</li>
                    <li>{t.cookies.right5}</li>
                  </ul>
                </div>
              </div>

              <div
                className={`${CARD_BASE} border-border/40 bg-gradient-to-b from-background to-muted/10`}
              >
                <div className="p-8">
                  <h2 className="text-2xl font-bold mb-4">
                    {t.cookies.updatesTitle}
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    {t.cookies.updatesText}
                  </p>
                  <p className="text-muted-foreground">
                    {t.cookies.updatesNote}
                  </p>
                </div>
              </div>

              <div
                className={`${CARD_BASE} border-border/40 bg-gradient-to-b from-background to-muted/10`}
              >
                <div className="p-8">
                  <h2 className="text-2xl font-bold mb-4">
                    {t.cookies.contactTitle}
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    {t.cookies.contactText}
                  </p>
                  <div className="space-y-2 text-muted-foreground">
                    <p>
                      <strong>{cookiePolicyPageData.contact.emailLabel}</strong>{' '}
                      {cookiePolicyPageData.contact.email}
                    </p>
                    <p>
                      <strong>
                        {cookiePolicyPageData.contact.addressLabel}
                      </strong>{' '}
                      {cookiePolicyPageData.contact.address}
                    </p>
                    <p>
                      <strong>{cookiePolicyPageData.contact.phoneLabel}</strong>{' '}
                      {cookiePolicyPageData.contact.phone}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <LandingFooter />
    </>
  );
};

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

export const SubpageView: React.FC<SubpageViewProps> = ({ subpagePath }) => {
  const renderSubpageContent = () => {
    switch (subpagePath) {
      case '/documentation':
        return <DocumentationSubpage />;
      case '/guides':
        return <GuidesSubpage />;
      case '/blog':
        return <BlogSubpage />;
      case '/casos-de-uso':
        return <CasosDeUsoSubpage />;
      case '/glosario':
        return <GlosarioSubpage />;
      case '/support':
        return <SupportSubpage />;
      case '/about':
        return <AboutSubpage />;
      case '/careers':
        return <CareersSubpage />;
      case '/privacy-policy':
        return <PrivacyPolicySubpage />;
      case '/terms-of-service':
        return <TermsOfServiceSubpage />;
      case '/cookie-policy':
        return <CookiePolicySubpage />;
    }
  };

  return (
    <div
      data-testid="landing-subpage-view"
      data-subpage={subpagePath}
      className="flex min-h-[100dvh] flex-col"
    >
      {renderSubpageContent()}
    </div>
  );
};
