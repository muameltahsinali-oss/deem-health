import { AnnouncementBar, SiteFooter } from "@/components/store/site-footer";
import { SiteHeader } from "@/components/store/site-header";
import { JsonLd } from "@/components/seo/json-ld";
import { MetaPixel } from "@/components/tracking/meta-pixel";
import { FirstPartyAnalytics } from "@/components/tracking/first-party-analytics";
import { getActiveCategories } from "@/server/catalog";
import { getStoreSettings } from "@/server/settings";
import { getPublicTrackingConfig } from "@/server/tracking/config";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import { t } from "@/i18n";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [categories, settings, tracking] = await Promise.all([
    getActiveCategories(),
    getStoreSettings(),
    getPublicTrackingConfig(),
  ]);
  const nav = categories.map((c) => ({ name: c.name, slug: c.slug }));
  const announcement = settings.announcementEnabled && settings.announcementText ? settings.announcementText : t.announcement.cod;

  return (
    <>
      <MetaPixel pixelId={tracking.pixelId} serverRelay={tracking.serverRelay} />
      <FirstPartyAnalytics />
      <a
        href="#main"
        className="sr-only z-50 rounded-full bg-sun-300 px-4 py-2 text-sm font-medium text-plum-950 focus:not-sr-only focus:fixed focus:start-4 focus:top-4"
      >
        {t.common.skipToContent}
      </a>
      <AnnouncementBar text={announcement} />
      <SiteHeader categories={nav} />
      <main id="main" className="min-h-[60vh]">
        {children}
      </main>
      <SiteFooter categories={nav} settings={settings} />
      <JsonLd data={[organizationJsonLd(settings), websiteJsonLd()]} />
    </>
  );
}
