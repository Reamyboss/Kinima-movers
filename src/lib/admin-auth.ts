import "server-only";
import { redirect } from "next/navigation";
import { userClient } from "@/lib/supabase/server";

// Every admin write runs as the signed-in admin, so the database's own
// admin-only rules decide what is allowed.
export async function requireAdmin() {
  const db = await userClient();
  if (!db) redirect("/login");
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/login");
  const { data: me } = await db.from("profiles").select("role, full_name").eq("id", user.id).single();
  if (me?.role !== "admin") redirect("/driver");
  return { db, user, me };
}
