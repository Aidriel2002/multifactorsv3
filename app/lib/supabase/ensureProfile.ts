import { supabase } from "@/app/lib/supabase/client"

export const ensureProfile = async (user: any) => {
  if (!user) return null

  const { data: existingProfile, error: fetchError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  if (fetchError) {
    console.error("Error fetching profile:", fetchError)
    return null
  }

  if (existingProfile) {
    // Always update email/full_name in case they changed
    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update({
        email: user.email,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || "",
        avatar_url: user.user_metadata?.avatar_url || "",
        last_active: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select()
      .maybeSingle()

    if (updateError) {
      console.error("Error updating profile:", updateError)
      return existingProfile
    }
    return updatedProfile
  }

  // If no profile, insert new
  const { data, error: insertError } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.user_metadata?.name || "",
      avatar_url: user.user_metadata?.avatar_url || "",
      status: false, // pending approval
      created_at: new Date().toISOString(),
      last_active: new Date().toISOString(),
    })
    .select()
    .single()

  if (insertError) {
    console.error("Error inserting profile:", insertError)
    return null
  }

  return data
}
