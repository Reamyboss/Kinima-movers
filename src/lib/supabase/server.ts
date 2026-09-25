import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// Acts as the signed-in user, so row level security applies.
export async function userClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const store = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Called from a server component; the middleware refreshes the session instead.
        }
      },
    },
  });
}
