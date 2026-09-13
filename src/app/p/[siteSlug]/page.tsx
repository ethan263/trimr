import { cache } from "react";
import type { Metadata } from "next";

import { PublicSite } from "@/components/public-site/public-site";
import { PublicSiteUnavailable } from "@/components/public-site/public-site-states";
import { getPublishedBySlug } from "@/lib/data/public-site";

const getPublishedSite = cache((siteSlug: string) =>
  getPublishedBySlug(siteSlug),
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ siteSlug: string }>;
}): Promise<Metadata> {
  const { siteSlug } = await params;
  const publishedSite = await getPublishedSite(siteSlug);

  if (!publishedSite) {
    return {
      title: "Page unavailable",
      robots: { index: false, follow: false },
    };
  }

  const { config } = publishedSite.site;
  const title = `${config.businessName} · Book online`;

  return {
    title,
    description: config.subheadline || config.about,
    openGraph: {
      title,
      description: config.subheadline || config.about,
    },
  };
}

export default async function PublicSitePage({
  params,
}: {
  params: Promise<{ siteSlug: string }>;
}) {
  const { siteSlug } = await params;
  const publishedSite = await getPublishedSite(siteSlug);

  if (!publishedSite) {
    return <PublicSiteUnavailable />;
  }

  return (
    <PublicSite
      siteSlug={publishedSite.site.siteSlug}
      publishedSite={publishedSite}
      textAgentEnabled={true}
      voiceAgentEnabled={true}
    />
  );
}