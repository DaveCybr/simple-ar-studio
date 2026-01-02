// supabase/functions/generate-viewer-token/index.ts
// ✅ FIXED VERSION

import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId } = await req.json();

    if (!projectId) {
      return new Response(
        JSON.stringify({ error: "Project ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("❌ Missing Supabase credentials");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify project exists and is public
    const { data: project, error: projectError } = await supabase
      .from("ar_projects")
      .select("id, name")
      .eq("id", projectId)
      .maybeSingle();

    if (projectError || !project) {
      console.error("❌ Project not found:", projectError);
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Generate a simple time-based token for viewer access
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    const token = btoa(
      JSON.stringify({
        projectId,
        exp: expiresAt.getTime(),
        iat: Date.now(),
      })
    );

    console.log(`✅ Generated viewer token for project: ${projectId}`);

    return new Response(
      JSON.stringify({
        token,
        expiresAt: expiresAt.toISOString(),
        projectId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ Error generating token:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to generate token",
        message: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
