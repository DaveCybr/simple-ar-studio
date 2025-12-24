import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  console.log("Request method:", req.method);

  try {
    const cloudName = Deno.env.get("CLOUDINARY_CLOUD_NAME");
    const apiKey = Deno.env.get("CLOUDINARY_API_KEY");
    const apiSecret = Deno.env.get("CLOUDINARY_API_SECRET");

    console.log("Cloudinary config:", {
      cloudName: cloudName ? "SET" : "MISSING",
      apiKey: apiKey ? "SET" : "MISSING",
      apiSecret: apiSecret ? "SET" : "MISSING",
    });

    if (!cloudName || !apiKey || !apiSecret) {
      console.error("Missing Cloudinary credentials");
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "Missing Cloudinary credentials. Please set environment variables.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const resourceType = (formData.get("resource_type") as string) || "auto";
    const folder = (formData.get("folder") as string) || "ar-content";

    if (!file) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No file provided",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(
      `Uploading file: ${file.name}, type: ${file.type}, size: ${file.size}`
    );

    // Generate timestamp
    const timestamp = Math.floor(Date.now() / 1000);

    // Build transformation string for optimization
    let transformation = "";

    if (resourceType === "video") {
      transformation =
        "q_auto:good,w_1920,h_1080,c_limit,vc_h264:main:4.0,ac_aac,br_4000k";
    } else if (resourceType === "image" && folder === "ar-content") {
      transformation = "q_auto:good,w_1024,h_1024,c_limit,f_auto";
    } else if (resourceType === "image" && folder === "ar-markers") {
      transformation = "q_auto:best,f_auto";
    }

    // Build params to sign (MUST be in alphabetical order)
    // Only include parameters that will be sent to Cloudinary
    const paramsToSign: Record<string, string> = {
      folder: folder,
      timestamp: timestamp.toString(),
    };

    // Add transformation params if needed
    if (transformation && resourceType !== "raw") {
      paramsToSign.eager = transformation;
      paramsToSign.eager_async = "false"; // ← FIXED: Added to signature
    }

    // Sort params alphabetically and build string to sign
    const sortedKeys = Object.keys(paramsToSign).sort();
    const stringToSign = sortedKeys
      .map((key) => `${key}=${paramsToSign[key]}`)
      .join("&");

    console.log("String to sign:", stringToSign);

    // Generate SHA-1 signature
    const encoder = new TextEncoder();
    const data = encoder.encode(stringToSign + apiSecret);
    const hashBuffer = await crypto.subtle.digest("SHA-1", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    console.log("Generated signature:", signature);

    // Create upload form data for Cloudinary
    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append("file", file);
    cloudinaryFormData.append("folder", folder);
    cloudinaryFormData.append("timestamp", timestamp.toString());
    cloudinaryFormData.append("api_key", apiKey);
    cloudinaryFormData.append("signature", signature);

    // Add transformation params (must match paramsToSign)
    if (transformation && resourceType !== "raw") {
      cloudinaryFormData.append("eager", transformation);
      cloudinaryFormData.append("eager_async", "false"); // ← Now consistent with signature
    }

    // Upload to Cloudinary
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
    console.log(`Uploading to: ${uploadUrl}`);

    const response = await fetch(uploadUrl, {
      method: "POST",
      body: cloudinaryFormData,
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Cloudinary error:", result);
      return new Response(
        JSON.stringify({
          success: false,
          error: result.error?.message || "Upload failed",
          details: result,
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Upload successful:", result.secure_url);

    // Return the optimized URL if available
    let optimizedUrl = result.secure_url;
    if (result.eager && result.eager.length > 0) {
      optimizedUrl = result.eager[0].secure_url;
    }

    return new Response(
      JSON.stringify({
        success: true,
        url: optimizedUrl,
        original_url: result.secure_url,
        public_id: result.public_id,
        resource_type: result.resource_type,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Upload error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
