import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const cloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME');
    const apiKey = Deno.env.get('CLOUDINARY_API_KEY');
    const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET');

    if (!cloudName || !apiKey || !apiSecret) {
      console.error('Missing Cloudinary credentials');
      throw new Error('Missing Cloudinary credentials');
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const resourceType = formData.get('resource_type') as string || 'auto';
    const folder = formData.get('folder') as string || 'ar-content';

    if (!file) {
      throw new Error('No file provided');
    }

    console.log(`Uploading file: ${file.name}, type: ${file.type}, size: ${file.size}`);

    // Create upload form data for Cloudinary
    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append('file', file);
    cloudinaryFormData.append('upload_preset', 'ml_default');
    cloudinaryFormData.append('folder', folder);

    // Generate signature for authenticated upload
    const timestamp = Math.floor(Date.now() / 1000);
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
    
    const encoder = new TextEncoder();
    const data = encoder.encode(paramsToSign + apiSecret);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    cloudinaryFormData.append('timestamp', timestamp.toString());
    cloudinaryFormData.append('api_key', apiKey);
    cloudinaryFormData.append('signature', signature);

    // Upload to Cloudinary
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
    console.log(`Uploading to: ${uploadUrl}`);

    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: cloudinaryFormData,
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Cloudinary error:', result);
      throw new Error(result.error?.message || 'Upload failed');
    }

    console.log('Upload successful:', result.secure_url);

    return new Response(
      JSON.stringify({
        success: true,
        url: result.secure_url,
        public_id: result.public_id,
        resource_type: result.resource_type,
        format: result.format,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    console.error('Upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
