"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function signOut() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Error signing out:", error);
    // Optionally, handle the error more gracefully, e.g., redirect to an error page
    // or return an error object that the client component can display.
    // For now, we'll just log it and proceed with redirection.
  }

  // As per Supabase docs, redirecting after sign-out is crucial.
  // Redirect to the home page or sign-in page.
  // We need to ensure the path is revalidated if it's a cached page.
  revalidatePath("/", "layout"); // Revalidate all paths starting from root with the layout
  redirect("/"); // Redirect to the root, which should then redirect to /en or /ja
} 