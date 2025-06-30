
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidationResult {
  success: boolean;
  webhookUrl: string;
  webhookType: string;
  status: 'valid' | 'invalid_url' | 'auth_failed' | 'not_found' | 'server_error' | 'timeout' | 'config_error';
  statusCode?: number;
  error?: string;
  responseTime?: number;
  method?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get user from JWT token with better error handling
    let user;
    try {
      const { data: { user: authUser }, error: userError } = await supabaseClient.auth.getUser();
      if (userError || !authUser) {
        console.error('Authentication error:', userError);
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      user = authUser;
    } catch (authError) {
      console.error('Authentication exception:', authError);
      return new Response(JSON.stringify({ error: 'Authentication failed' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Starting webhook validation for user:', user.id);

    // Parse request body to determine which webhook to validate
    let webhookType = 'apps'; // default to apps
    try {
      const body = await req.text();
      if (body) {
        const parsed = JSON.parse(body);
        webhookType = parsed.type || 'apps';
      }
    } catch (e) {
      // If no body or invalid JSON, use default
      console.log('No request body or invalid JSON, defaulting to apps webhook validation');
    }

    // Select the appropriate webhook URL based on type
    let webhookUrl: string;
    let webhookName: string;
    
    if (webhookType === 'scorecard') {
      webhookUrl = Deno.env.get('N8N_GET_SCORECARD_WEBHOOK_URL') || '';
      webhookName = 'N8N_GET_SCORECARD_WEBHOOK_URL';
    } else {
      webhookUrl = Deno.env.get('N8N_WEBHOOK_URL') || '';
      webhookName = 'N8N_WEBHOOK_URL';
    }

    const username = Deno.env.get('N8N_BASIC_AUTH_USERNAME');
    const password = Deno.env.get('N8N_BASIC_AUTH_PASSWORD');

    // Better environment variable validation
    if (!webhookUrl || !username || !password) {
      console.error(`Missing webhook configuration for ${webhookType}`);
      const missingVars = [];
      if (!webhookUrl) missingVars.push(webhookName);
      if (!username) missingVars.push('N8N_BASIC_AUTH_USERNAME');
      if (!password) missingVars.push('N8N_BASIC_AUTH_PASSWORD');
      
      return new Response(JSON.stringify({ 
        success: false,
        status: 'config_error',
        error: `Missing required environment variables: ${missingVars.join(', ')}`,
        webhookUrl: webhookUrl || 'NOT_SET',
        webhookType,
        missingVariables: missingVars
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate URL format
    let validUrl;
    try {
      validUrl = new URL(webhookUrl);
    } catch (urlError) {
      console.error('Invalid webhook URL format:', urlError);
      return new Response(JSON.stringify({
        success: false,
        status: 'invalid_url',
        error: 'Invalid webhook URL format',
        webhookUrl,
        webhookType,
        details: urlError.message
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const basicAuth = btoa(`${username}:${password}`);
    const startTime = Date.now();

    // Test webhook with timeout and better error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      console.log(`Testing ${webhookType} webhook connectivity:`, webhookUrl);
      
      const response = await fetch(webhookUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      console.log(`${webhookType} webhook response: ${response.status} ${response.statusText} (${responseTime}ms)`);

      const result: ValidationResult = {
        success: response.ok,
        webhookUrl,
        webhookType,
        statusCode: response.status,
        responseTime,
        method: 'GET'
      };

      if (response.ok) {
        result.status = 'valid';
        console.log(`${webhookType} webhook validation successful`);
      } else if (response.status === 401 || response.status === 403) {
        result.status = 'auth_failed';
        result.error = 'Authentication failed. Please check your Basic Auth credentials.';
      } else if (response.status === 404) {
        result.status = 'not_found';
        result.error = `Webhook URL not found. Please check the ${webhookType} webhook URL and ensure your n8n workflow is active.`;
      } else if (response.status >= 500) {
        result.status = 'server_error';
        result.error = `Server error: ${response.status} ${response.statusText}`;
      } else {
        result.status = 'invalid_url';
        result.error = `Unexpected response: ${response.status} ${response.statusText}`;
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        console.error(`${webhookType} webhook request timed out`);
        return new Response(JSON.stringify({
          success: false,
          status: 'timeout',
          error: `${webhookType} webhook request timed out after 10 seconds`,
          webhookUrl,
          webhookType,
          responseTime: Date.now() - startTime
        }), {
          status: 408,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.error(`${webhookType} webhook validation error:`, error);
      return new Response(JSON.stringify({
        success: false,
        status: 'server_error',
        error: `Network error: ${error.message}`,
        webhookUrl,
        webhookType,
        details: error.name
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in validate-webhook-auth function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      status: 'server_error',
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
