
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Utility function to validate webhook URL
function validateWebhookUrl(url: string): { isValid: boolean; error?: string } {
  try {
    const parsedUrl = new URL(url);
    
    // Check if it's HTTPS (recommended for production)
    if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
      return { isValid: false, error: 'URL must use HTTP or HTTPS protocol' };
    }
    
    // Check if hostname is valid
    if (!parsedUrl.hostname || parsedUrl.hostname.length === 0) {
      return { isValid: false, error: 'Invalid hostname in URL' };
    }
    
    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: `Invalid URL format: ${error.message}` };
  }
}

// Enhanced retry function with exponential backoff
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000,
  operationName: string = 'operation'
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`${operationName} - Attempt ${attempt}/${maxAttempts}`);
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.error(`${operationName} - Attempt ${attempt} failed:`, error);
      
      if (attempt < maxAttempts) {
        const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
        console.log(`${operationName} - Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
}

serve(async (req) => {
  console.log('=== New Get Scorecard Request ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Environment validation
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const webhookUrl = Deno.env.get('N8N_GET_SCORECARD_WEBHOOK_URL');
    const basicAuthUsername = Deno.env.get('N8N_BASIC_AUTH_USERNAME');
    const basicAuthPassword = Deno.env.get('N8N_BASIC_AUTH_PASSWORD');

    console.log('Environment check:');
    console.log('- SUPABASE_URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
    console.log('- SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓ Set' : '✗ Missing');
    console.log('- N8N_GET_SCORECARD_WEBHOOK_URL:', webhookUrl ? '✓ Set' : '✗ Missing');
    console.log('- N8N_BASIC_AUTH_USERNAME:', basicAuthUsername ? '✓ Set' : '✗ Not set');
    console.log('- N8N_BASIC_AUTH_PASSWORD:', basicAuthPassword ? '✓ Set' : '✗ Not set');

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing required Supabase environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error: Missing Supabase credentials' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!webhookUrl) {
      console.error('Missing N8N webhook URL');
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error: N8N webhook URL not configured',
          details: 'Please configure N8N_GET_SCORECARD_WEBHOOK_URL environment variable'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate webhook URL format
    const urlValidation = validateWebhookUrl(webhookUrl);
    if (!urlValidation.isValid) {
      console.error('Invalid webhook URL:', urlValidation.error);
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error: Invalid webhook URL',
          details: urlValidation.error,
          webhook_url: webhookUrl
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Webhook URL validation passed:', webhookUrl);

    // Initialize Supabase client
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    })

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      console.error('Authentication error:', userError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('User authenticated:', user.id);

    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Request body:', JSON.stringify(requestBody, null, 2));
    } catch (error) {
      console.error('Failed to parse request body:', error);
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { company_id, deal_id, external_app_id } = requestBody;

    if (!external_app_id) {
      console.error('Missing external_app_id in request');
      return new Response(
        JSON.stringify({ error: 'Missing required field: external_app_id' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Processing scorecard request for app_id: ${external_app_id}`);

    // Check for existing completed scorecard
    console.log('Checking for existing scorecard...');
    const { data: existingScorecard } = await supabaseClient
      .from('scorecards')
      .select('*')
      .eq('external_app_id', external_app_id)
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingScorecard) {
      console.log('Found existing completed scorecard:', existingScorecard.id);
      return new Response(
        JSON.stringify({ 
          success: true,
          scorecard_id: existingScorecard.id,
          scorecard_url: existingScorecard.scorecard_url,
          source: 'database'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('No existing scorecard found, creating new record...');

    // Create new scorecard record
    const { data: scorecard, error: scorecardError } = await supabaseClient
      .from('scorecards')
      .insert({
        user_id: user.id,
        company_id: company_id || null,
        deal_id: deal_id || null,
        external_app_id,
        status: 'processing',
        webhook_request_data: {
          app_id: external_app_id,
          requested_by: user.id,
          timestamp: new Date().toISOString(),
          attempt: 1
        }
      })
      .select()
      .single()

    if (scorecardError) {
      console.error('Error creating scorecard record:', scorecardError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create scorecard record',
          details: scorecardError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Created scorecard record:', scorecard.id);

    // Prepare webhook payload
    const webhookPayload = {
      app_id: external_app_id,
      scorecard_id: scorecard.id,
      user_id: user.id,
      company_id: company_id || null,
      deal_id: deal_id || null,
      action: 'get_scorecard',
      timestamp: new Date().toISOString()
    };

    console.log('Prepared webhook payload:', JSON.stringify(webhookPayload, null, 2));

    // Prepare webhook headers
    const webhookHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Supabase-Functions/2.0'
    };

    // Add authentication if configured
    const useAuth = basicAuthUsername && basicAuthPassword;
    if (useAuth) {
      console.log('Adding Basic Authentication to webhook request');
      const auth = btoa(`${basicAuthUsername}:${basicAuthPassword}`);
      webhookHeaders['Authorization'] = `Basic ${auth}`;
    } else {
      console.log('No authentication configured for webhook request');
    }

    console.log('Webhook headers (auth hidden):', {
      ...webhookHeaders,
      Authorization: webhookHeaders.Authorization ? '[HIDDEN]' : undefined
    });

    try {
      // Make webhook request with retry logic
      console.log('=== Starting Webhook Request ===');
      
      const webhookResponse = await retryWithBackoff(
        async () => {
          console.log(`Making webhook request to: ${webhookUrl}`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 60000); // Increased to 60 seconds
          
          try {
            const response = await fetch(webhookUrl, {
              method: 'POST',
              headers: webhookHeaders,
              body: JSON.stringify(webhookPayload),
              signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            console.log(`Webhook response status: ${response.status} ${response.statusText}`);
            console.log('Webhook response headers:', Object.fromEntries(response.headers.entries()));
            
            if (!response.ok) {
              const responseText = await response.text();
              console.error(`Webhook failed with status ${response.status}:`, responseText);
              throw new Error(`Webhook request failed: ${response.status} ${response.statusText}. Response: ${responseText}`);
            }
            
            return response;
          } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
              throw new Error('Webhook request timed out after 60 seconds');
            }
            throw error;
          }
        },
        3, // max attempts
        2000, // base delay
        'Webhook Request'
      );

      const webhookData = await webhookResponse.json();
      console.log('Webhook response data:', JSON.stringify(webhookData, null, 2));

      // Validate webhook response
      if (!webhookData || typeof webhookData !== 'object') {
        throw new Error('Invalid webhook response: Expected JSON object');
      }

      // Check if scorecard data exists in the correct structure
      if (!webhookData.scorecardData || !Array.isArray(webhookData.scorecardData) || webhookData.scorecardData.length === 0) {
        console.log('No scorecard data found in webhook response for app_id:', external_app_id);
        
        await supabaseClient
          .from('scorecards')
          .update({
            status: 'error',
            error_message: 'No scorecard data found for this application',
            webhook_response_data: webhookData
          })
          .eq('id', scorecard.id)

        return new Response(
          JSON.stringify({ 
            error: 'No scorecard data found for this application',
            app_id: external_app_id,
            webhook_response: webhookData
          }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      console.log('Processing scorecard data from webhook...');

      // Extract the scorecard data and URL
      const scorecardItem = webhookData.scorecardData[0];
      const scorecardUrl = scorecardItem.url || null;
      const scorecardBodyData = scorecardItem.body || {};

      console.log('Scorecard URL:', scorecardUrl);
      console.log('Scorecard body data keys:', Object.keys(scorecardBodyData));

      // Process and organize the webhook response data
      const sections = []

      // Metrics section
      if (scorecardBodyData.metrics && scorecardBodyData.metrics.metricdata) {
        sections.push({
          section_name: 'metrics',
          section_data: scorecardBodyData.metrics,
          display_order: 1
        })
      }

      // Daily balances section
      if (scorecardBodyData.dailybalance) {
        sections.push({
          section_name: 'daily_balances',
          section_data: scorecardBodyData.dailybalance,
          display_order: 2
        })
      }

      // Credit transactions
      if (scorecardBodyData.credittrans) {
        sections.push({
          section_name: 'credit_transactions',
          section_data: scorecardBodyData.credittrans,
          display_order: 3
        })
      }

      // Debit transactions
      if (scorecardBodyData.debittrans) {
        sections.push({
          section_name: 'debit_transactions',
          section_data: scorecardBodyData.debittrans,
          display_order: 4
        })
      }

      // NSF transactions
      if (scorecardBodyData.nsftrans) {
        sections.push({
          section_name: 'nsf_transactions',
          section_data: scorecardBodyData.nsftrans,
          display_order: 5
        })
      }

      // Large transactions
      if (scorecardBodyData.largetrans) {
        sections.push({
          section_name: 'large_transactions',
          section_data: scorecardBodyData.largetrans,
          display_order: 6
        })
      }

      // Transfer transactions
      if (scorecardBodyData.transfertrans) {
        sections.push({
          section_name: 'transfer_transactions',
          section_data: scorecardBodyData.transfertrans,
          display_order: 7
        })
      }

      // MCA transactions
      if (scorecardBodyData.mcatrans) {
        sections.push({
          section_name: 'mca_transactions',
          section_data: scorecardBodyData.mcatrans,
          display_order: 8
        })
      }

      // Add any other data sections that might exist
      const processedSections = ['metrics', 'dailybalance', 'credittrans', 'debittrans', 'nsftrans', 'largetrans', 'transfertrans', 'mcatrans'];
      let orderCounter = 9;
      
      Object.keys(scorecardBodyData).forEach(key => {
        if (!processedSections.includes(key) && scorecardBodyData[key]) {
          sections.push({
            section_name: key,
            section_data: scorecardBodyData[key],
            display_order: orderCounter++
          })
        }
      });

      console.log(`Processed ${sections.length} scorecard sections`);

      // Update scorecard with completion data
      await supabaseClient
        .from('scorecards')
        .update({
          status: 'completed',
          scorecard_url: scorecardUrl,
          webhook_response_data: webhookData,
          completed_at: new Date().toISOString()
        })
        .eq('id', scorecard.id)

      // Insert organized sections
      if (sections.length > 0) {
        const { error: sectionsError } = await supabaseClient
          .from('scorecard_sections')
          .insert(
            sections.map(section => ({
              scorecard_id: scorecard.id,
              ...section
            }))
          )

        if (sectionsError) {
          console.error('Error inserting scorecard sections:', sectionsError)
        } else {
          console.log(`Successfully inserted ${sections.length} scorecard sections`)
        }
      }

      console.log('=== Scorecard Processing Completed Successfully ===');
      return new Response(
        JSON.stringify({ 
          success: true, 
          scorecard_id: scorecard.id,
          scorecard_url: scorecardUrl,
          sections_created: sections.length,
          source: 'api'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )

    } catch (webhookError) {
      console.error('=== Webhook Request Failed ===');
      console.error('Error details:', webhookError);
      
      // Update scorecard with error status
      await supabaseClient
        .from('scorecards')
        .update({
          status: 'error',
          error_message: webhookError.message,
          webhook_response_data: {
            error: webhookError.message,
            timestamp: new Date().toISOString()
          }
        })
        .eq('id', scorecard.id)

      return new Response(
        JSON.stringify({ 
          error: 'Failed to process scorecard request',
          details: webhookError.message,
          webhook_url: webhookUrl,
          troubleshooting: {
            step: 'webhook_request',
            suggestion: 'Check if N8N workflow is active and URL is correct'
          }
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

  } catch (error) {
    console.error('=== Function Error ===');
    console.error('Error details:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
