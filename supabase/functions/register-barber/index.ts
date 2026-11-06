import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const signupConfirmationUrl =
  "https://mekadoka4.github.io/goldbarber-signups/signup.html";

const json = (body: Record<string, string>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return json({ error: "Método não permitido." }, 405);
  }

  const projectUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!projectUrl || !serviceRoleKey) {
    console.error("Supabase server credentials are not configured.");
    return json({ error: "Serviço de cadastro indisponível." }, 500);
  }

  let photoPath: string | null = null;
  let authUserId: string | null = null;
  let profileCreated = false;
  const supabase = createClient(projectUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const form = await request.formData();
    const fullName = String(form.get("nome") ?? "").trim();
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const phone = String(form.get("telefone") ?? "").replace(/\D/g, "");
    const whatsapp = String(form.get("whatsapp") ?? "").replace(/\D/g, "");
    const passwordEntry = form.get("password");
    const photo = form.get("foto");

    if (fullName.length < 2 || fullName.length > 120) {
      return json({ error: "Informe um nome entre 2 e 120 caracteres." }, 400);
    }
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: "Informe um e-mail válido." }, 400);
    }
    if (
      typeof passwordEntry !== "string" ||
      passwordEntry.length < 8 ||
      passwordEntry.length > 128
    ) {
      return json({ error: "A senha deve ter entre 8 e 128 caracteres." }, 400);
    }
    if (!/^\d{10,15}$/.test(phone) || !/^\d{10,15}$/.test(whatsapp)) {
      return json({ error: "Informe telefone e WhatsApp com DDD." }, 400);
    }
    if (!(photo instanceof File)) {
      return json({ error: "Selecione uma foto de perfil." }, 400);
    }
    const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
    if (!allowedTypes.has(photo.type) || photo.size > 5 * 1024 * 1024) {
      return json({ error: "A foto deve ser JPG, PNG ou WEBP e ter até 5 MB." }, 400);
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: passwordEntry,
      email_confirm: false,
    });
    if (authError) {
      if (authError.code === "email_exists" || authError.code === "user_already_exists") {
        return json({ error: "Este e-mail ou telefone já está cadastrado." }, 409);
      }
      throw new Error("Unable to create authentication user.");
    }
    if (!authData.user) {
      throw new Error("Authentication user was not created.");
    }
    authUserId = authData.user.id;

    const extensionByType: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };
    photoPath = crypto.randomUUID() + "." + extensionByType[photo.type];

    const { error: uploadError } = await supabase.storage
      .from("barber-profile-photos")
      .upload(photoPath, photo, { contentType: photo.type, upsert: false });
    if (uploadError) throw uploadError;

    const { error: insertError } = await supabase.from("barber_signups").insert({
      full_name: fullName,
      email,
      phone,
      whatsapp,
      photo_path: photoPath,
      auth_user_id: authUserId,
    });
    if (insertError) throw insertError;
    profileCreated = true;

    const { error: confirmationError } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: signupConfirmationUrl },
    });
    if (confirmationError) {
      throw new Error("Unable to send signup confirmation email.");
    }

    return json({ message: "Cadastro salvo." }, 201);
  } catch (error) {
    if (profileCreated && authUserId) {
      try {
        const { error: cleanupError } = await supabase
          .from("barber_signups")
          .delete()
          .eq("auth_user_id", authUserId);
        if (cleanupError) {
          console.error("Unable to remove profile after failed signup.");
        }
      } catch {
        console.error("Unable to remove profile after failed signup.");
      }
    }
    if (photoPath) {
      try {
        const { error: cleanupError } = await supabase.storage
          .from("barber-profile-photos")
          .remove([photoPath]);
        if (cleanupError) {
          console.error("Unable to remove profile photo after failed signup.");
        }
      } catch {
        console.error("Unable to remove profile photo after failed signup.");
      }
    }
    if (authUserId) {
      try {
        const { error: cleanupError } = await supabase.auth.admin.deleteUser(authUserId);
        if (cleanupError) {
          console.error("Unable to remove auth user after failed signup.");
        }
      } catch {
        console.error("Unable to remove auth user after failed signup.");
      }
    }
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      return json({ error: "Este e-mail ou telefone já está cadastrado." }, 409);
    }
    console.error("Barber signup failed.");
    return json({ error: "Não foi possível concluir o cadastro. Tente novamente." }, 500);
  }
});
