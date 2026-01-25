import "client-only";
import { createBrowserClient } from "@supabase/ssr";
// If you have generated types, import them here:
// import type { Database } from "@/lib/database.types";

export function createClientComponentClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // use whatever env you already have; “PUBLISHABLE_KEY” is just the anon key
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! 
    // or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY if you’ve renamed it
  );
}

