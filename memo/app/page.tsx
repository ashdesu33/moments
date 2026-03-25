import Link from "next/link";

import { ProjectPortfolio } from "@/app/components/ProjectPortfolio";
import { client } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";

import type { SanityImageSource } from "@sanity/image-url/lib/types/types";

/** Published documents only — click “Publish” in Studio so content appears here. */
export const dynamic = "force-dynamic";

/** Cover expands asset for dimensions + CDN fallback; `images` stays default refs (reliable for urlFor). */
const PROJECTS_QUERY = `*[_type == "project"] | order(year desc, title asc) {
  _id,
  title,
  year,
  coverImage {
    _type,
    crop,
    hotspot,
    asset->{
      _id,
      _ref,
      url,
      metadata {
        dimensions {
          width,
          height
        }
      }
    }
  },
  images
}`;

type RawProject = {
  _id: string;
  title: string | null;
  year: string | null;
  coverImage: SanityImageSource | null;
  images: SanityImageSource[] | null;
};

function assetRef(source: SanityImageSource | null | undefined): string | null {
  if (!source || typeof source !== "object" || !("asset" in source)) {
    return null;
  }
  const asset = source.asset;
  if (!asset || typeof asset !== "object") return null;
  if ("_ref" in asset && typeof asset._ref === "string") return asset._ref;
  return null;
}

function getDimensions(
  source: SanityImageSource | null | undefined,
): { width: number; height: number } | null {
  if (!source || typeof source !== "object" || !("asset" in source)) return null;
  const asset = source.asset;
  if (!asset || typeof asset !== "object" || !("metadata" in asset)) return null;
  const meta = (asset as { metadata?: { dimensions?: { width?: number; height?: number } } })
    .metadata;
  const w = meta?.dimensions?.width;
  const h = meta?.dimensions?.height;
  if (typeof w === "number" && typeof h === "number" && w > 0 && h > 0) {
    return { width: w, height: h };
  }
  return null;
}

const FALLBACK_RATIO = { width: 3, height: 2 };

/** CDN fallback when urlFor cannot parse the image (e.g. unusual asset shape). */
function cdnUrlFromAsset(
  source: SanityImageSource | null | undefined,
  width: number,
): string | null {
  if (!source || typeof source !== "object" || !("asset" in source)) return null;
  const asset = source.asset as { url?: string } | undefined;
  if (!asset?.url || typeof asset.url !== "string") return null;
  try {
    const u = new URL(asset.url);
    u.searchParams.set("w", String(width));
    u.searchParams.set("q", "88");
    u.searchParams.set("auto", "format");
    return u.toString();
  } catch {
    return null;
  }
}

function imageUrl(
  source: SanityImageSource | null | undefined,
  width: number,
): string | null {
  if (!source) return null;
  try {
    return urlFor(source).width(width).quality(88).auto("format").url();
  } catch {
    return cdnUrlFromAsset(source, width);
  }
}

type Sized = { url: string; width: number; height: number };

function buildGallery(
  cover: SanityImageSource | null,
  images: SanityImageSource[] | null,
): Sized[] {
  const seen = new Set<string>();
  const out: Sized[] = [];

  const push = (src: SanityImageSource | null | undefined) => {
    const ref = assetRef(src);
    if (!ref || seen.has(ref)) return;
    seen.add(ref);
    const url = imageUrl(src, 2400);
    if (!url) return;
    const dim = getDimensions(src) ?? FALLBACK_RATIO;
    out.push({ url, width: dim.width, height: dim.height });
  };

  push(cover);
  for (const img of images ?? []) push(img);

  return out;
}

export default async function Home() {
  const rows = await client.fetch<RawProject[]>(
    PROJECTS_QUERY,
    {},
    { next: { revalidate: 0 } },
  );

  const projects = rows.map((row) => {
    const title = row.title ?? null;
    const coverAlt = title ? `${title} — cover` : "Project cover";
    const gallery = buildGallery(row.coverImage, row.images);

    const coverDim = getDimensions(row.coverImage) ?? FALLBACK_RATIO;
    const coverUrl = imageUrl(row.coverImage, 1920);

    return {
      id: row._id,
      title,
      year: row.year ?? null,
      cover:
        coverUrl !== null
          ? {
              url: coverUrl,
              width: coverDim.width,
              height: coverDim.height,
              alt: coverAlt,
            }
          : null,
      gallery: gallery.map((img, i) => ({
        ...img,
        alt: `${coverAlt} — ${i + 1}`,
      })),
    };
  });

  return (
    <div className="page">
      <header className="site-header">
        <p className="site-title">Memo</p>
      </header>
      <main className="site-main">
        <ProjectPortfolio projects={projects} />
      </main>
    </div>
  );
}
