import { supabase } from "./client";

export const ensureProfile = async (user: any) => {
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (existingProfile) return existingProfile;

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.user_metadata?.name || "",
      avatar_url: user.user_metadata?.avatar_url || "",
      status: false, // admin still needs to approve
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating profile:", error);
    return null;
  }

  return data;
};
