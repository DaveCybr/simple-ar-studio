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

    // Generate timestamp
    const timestamp = Math.floor(Date.now() / 1000);

    // Build transformation string for optimization
    let transformation = '';
    
    if (resourceType === 'video') {
      // Video optimization: compress and resize for AR
      // Target: ~2-3MB files, 640x360 resolution, good quality
      transformation = 'q_auto:good,w_640,h_360,c_limit,vc_h264:baseline:3.0,ac_aac,br_1500k';
    } else if (resourceType === 'image' && folder === 'ar-content') {
      // Image optimization for AR content: compress and resize
      transformation = 'q_auto:good,w_1024,h_1024,c_limit,f_auto';
    } else if (resourceType === 'image' && folder === 'ar-markers') {
      // Marker images: keep quality but optimize format
      transformation = 'q_auto:best,f_auto';
    }

    // Build params to sign (alphabetical order, excluding file, api_key, signature, resource_type)
    let paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
    if (transformation && resourceType !== 'raw') {
      paramsToSign = `eager=${transformation}&folder=${folder}&timestamp=${timestamp}`;
    }
    
    // Generate SHA-1 signature
    const encoder = new TextEncoder();
    const data = encoder.encode(paramsToSign + apiSecret);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    console.log('Params to sign:', paramsToSign);
    console.log('Generated signature:', signature);

    // Create upload form data for Cloudinary
    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append('file', file);
    cloudinaryFormData.append('folder', folder);
    cloudinaryFormData.append('timestamp', timestamp.toString());
    cloudinaryFormData.append('api_key', apiKey);
    cloudinaryFormData.append('signature', signature);
    
    // Add eager transformation for videos and images (not raw files)
    if (transformation && resourceType !== 'raw') {
      cloudinaryFormData.append('eager', transformation);
      cloudinaryFormData.append('eager_async', 'false');
    }

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

    // Return the optimized URL if available, otherwise the original
    let optimizedUrl = result.secure_url;
    
    if (result.eager && result.eager.length > 0) {
      optimizedUrl = result.eager[0].secure_url;
      console.log('Optimized URL:', optimizedUrl);
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
        optimized_bytes: result.eager?.[0]?.bytes,
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
