import { createClient } from "./supabase/server";

const HUBS_BUCKET = "hubs";

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

function toPublicUrl(client: ServerSupabaseClient, path?: string | null): string | null {
  if (!path) return null;
  // if the DB already has a full https URL, just return it
  if (/^https?:\/\//i.test(path)) return path;
  // otherwise treat it as a Storage path inside the "hubs" bucket
  return client.storage.from(HUBS_BUCKET).getPublicUrl(path).data.publicUrl ?? null;
}

// Optional: thumbnail helper using Supabase image transforms (smaller cards)
// Example usage: thumbUrl(supabase, hub.hero_image_url, 640)
function thumbUrl(
  client: ServerSupabaseClient,
  urlOrPath?: string | null,
  width = 640,
  quality = 80
): string | null {
  const url = toPublicUrl(client, urlOrPath);
  if (!url) return null;
  // appends transform params supported by Supabase Storage
  const joiner = url.includes("?") ? "&" : "?";
  return `${url}${joiner}width=${width}&quality=${quality}`;
}

export type PublicHub = {
  id: string;
  slug: string;
  name: string;
  short_desc?: string | null;
  long_desc?: string | null;
  category?: string | null;
  tags?: string[] | null;
  hero_image_url?: string | null;
  gallery_urls?: string[] | null;
  price_from_cents?: number | null;
  currency?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  location_full_name?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  available_from?: string | null;
  available_to?: string | null;
  max_children?: number | null;
  min_age?: number | null;
  max_age?: number | null;
  verified?: boolean;
  website_url?: string | null;
};

export async function listPublicHubs(): Promise<PublicHub[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("public_hubs")
    .select(`
      id, slug, name, short_desc, long_desc, category, tags,
      hero_image_url, gallery_urls,
      price_from_cents, currency,
      city, region, country, location_full_name,
      location_lat, location_lng,
      available_from, available_to, max_children, min_age, max_age, verified,
      website_url
    `)
    .order("price_from_cents", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true });

  if (error) {
    console.error("listPublicHubs error:", error);
    return [];
  }

  return (data ?? []).map((row) => {
    const hero = toPublicUrl(supabase, row.hero_image_url);
    const gallery = Array.isArray(row.gallery_urls)
      ? (row.gallery_urls
          .map((item) => toPublicUrl(supabase, item))
          .filter(Boolean) as string[])
      : null;

    // If you want smaller images on cards, swap `hero` for `thumbUrl(supabase, row.hero_image_url)`
    return {
      ...row,
      hero_image_url: hero,
      gallery_urls: gallery,
    };
  });
}