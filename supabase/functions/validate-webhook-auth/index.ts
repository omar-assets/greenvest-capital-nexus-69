
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
  status: 'valid' | 'invalid_url' | 'auth_failed' | 'not_found' | 'server_error' | 'timeout';
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

    // Get user from JWT token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('Authentication error:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Starting webhook validation for user:', user.id);

    // Get webhook credentials from environment
    const webhookUrl = Deno.env.get('N8N_WEBHOOK_URL');
    const username = Deno.env.get('N8N_BASIC_AUTH_USERNAME');
    const password = Deno.env.get('N8N_BASIC_AUTH_PASSWORD');

    if (!webhookUrl || !username || !password) {
      console.error('Missing webhook configuration');
      return new Response(JSON.stringify({ 
        success: false,
        status: 'invalid_url',
        error: 'Webhook configuration missing. Please check your environment variables.',
        webhookUrl: webhookUrl || 'NOT_SET'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate URL format
    try {
      new URL(webhookUrl);
    } catch (error) {
      console.error('Invalid webhook URL format:', error);
      return new Response(JSON.stringify({
        success: false,
        status: 'invalid_url',
        error: 'Invalid webhook URL format',
        webhookUrl
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const basicAuth = btoa(`${username}:${password}`);
    const startTime = Date.now();

    // Test webhook with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      console.log('Testing webhook connectivity:', webhookUrl);
      
      // Try GET first (most common for n8n webhooks)
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

      console.log(`Webhook response: ${response.status} ${response.statusText} (${responseTime}ms)`);

      const result: ValidationResult = {
        success: response.ok,
        webhookUrl,
        statusCode: response.status,
        responseTime,
        method: 'GET'
      };

      if (response.ok) {
        result.status = 'valid';
        console.log('Webhook validation successful');
      } else if (response.status === 401 || response.status === 403) {
        result.status = 'auth_failed';
        result.error = 'Authentication failed. Please check your Basic Auth credentials.';
      } else if (response.status === 404) {
        result.status = 'not_found';
        result.error = 'Webhook URL not found. Please check the URL and ensure your n8n workflow is active.';
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
        console.error('Webhook request timed out');
        return new Response(JSON.stringify({
          success: false,
          status: 'timeout',
          error: 'Webhook request timed out after 10 seconds',
          webhookUrl,
          responseTime: Date.now() - startTime
        }), {
          status: 408,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.error('Webhook validation error:', error);
      return new Response(JSON.stringify({
        success: false,
        status: 'server_error',
        error: `Network error: ${error.message}`,
        webhookUrl
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
