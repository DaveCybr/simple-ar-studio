import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const { projectId } = await req.json();

  // Generate short-lived JWT for viewer
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Create time-limited token (1 hour)
  const token = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email: "viewer@temp.com",
    options: {
      data: { projectId, role: "viewer" },
      redirectTo: window.location.origin,
    },
  });

  return new Response(
    JSON.stringify({ token: token.properties.hashed_token }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
});
