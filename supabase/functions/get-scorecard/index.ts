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
          status: 'completed',
          source: 'database'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check for existing processing scorecard
    const { data: processingScorecard } = await supabaseClient
      .from('scorecards')
      .select('*')
      .eq('external_app_id', external_app_id)
      .eq('user_id', user.id)
      .eq('status', 'processing')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (processingScorecard) {
      console.log('Found existing processing scorecard:', processingScorecard.id);
      return new Response(
        JSON.stringify({ 
          success: true,
          scorecard_id: processingScorecard.id,
          status: 'processing',
          message: 'Scorecard is currently being processed',
          source: 'database'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('No existing scorecard found, creating new record...');

    // Create new scorecard record with processing status
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

    // Return immediate response with processing status
    const immediateResponse = new Response(
      JSON.stringify({ 
        success: true, 
        scorecard_id: scorecard.id,
        status: 'processing',
        message: 'Scorecard processing has started. Check back for updates.',
        source: 'api'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

    // Start background processing
    const backgroundTask = async () => {
      try {
        console.log('=== Starting Background Processing ===');
        
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
        }

        // Make webhook request with retry logic
        const webhookResponse = await retryWithBackoff(
          async () => {
            console.log(`Making webhook request to: ${webhookUrl}`);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 seconds timeout
            
            try {
              const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: webhookHeaders,
                body: JSON.stringify(webhookPayload),
                signal: controller.signal
              });
              
              clearTimeout(timeoutId);
              console.log(`Webhook response status: ${response.status} ${response.statusText}`);
              
              if (!response.ok) {
                const responseText = await response.text();
                console.error(`Webhook failed with status ${response.status}:`, responseText);
                throw new Error(`Webhook request failed: ${response.status} ${response.statusText}`);
              }
              
              return response;
            } catch (error) {
              clearTimeout(timeoutId);
              if (error.name === 'AbortError') {
                throw new Error('Webhook request timed out after 90 seconds');
              }
              throw error;
            }
          },
          3,
          2000,
          'Webhook Request'
        );

        const webhookData = await webhookResponse.json();
        console.log('Webhook response received, processing data...');

        // Validate webhook response structure
        if (!webhookData || typeof webhookData !== 'object') {
          throw new Error('Invalid webhook response: Expected JSON object');
        }

        // Check for scorecard data in the response
        if (!webhookData.scorecardData || !Array.isArray(webhookData.scorecardData) || webhookData.scorecardData.length === 0) {
          console.log('No scorecard data found in webhook response');
          
          await supabaseClient
            .from('scorecards')
            .update({
              status: 'error',
              error_message: 'No scorecard data found for this application',
              webhook_response_data: webhookData,
              completed_at: new Date().toISOString()
            })
            .eq('id', scorecard.id);

          return;
        }

        console.log('Processing scorecard data from webhook...');

        // Extract the scorecard data and URL with validation
        const scorecardItem = webhookData.scorecardData[0];
        const scorecardUrl = scorecardItem.url || null;
        const scorecardBodyData = scorecardItem.body || {};

        // Validate app_id in the URL if possible
        if (scorecardUrl && scorecardUrl.includes('appid=')) {
          const urlAppId = scorecardUrl.match(/appid=(\d+)/)?.[1];
          if (urlAppId && parseInt(urlAppId) !== external_app_id) {
            console.warn(`URL app_id (${urlAppId}) doesn't match requested app_id (${external_app_id})`);
          }
        }

        console.log('Scorecard URL:', scorecardUrl);
        console.log('Scorecard body data keys:', Object.keys(scorecardBodyData));

        // Process and organize the webhook response data
        const sections = [];

        // Add sections based on available data
        const sectionMappings = [
          { key: 'metrics', name: 'metrics', order: 1 },
          { key: 'dailybalance', name: 'daily_balances', order: 2 },
          { key: 'credittrans', name: 'credit_transactions', order: 3 },
          { key: 'debittrans', name: 'debit_transactions', order: 4 },
          { key: 'nsftrans', name: 'nsf_transactions', order: 5 },
          { key: 'largetrans', name: 'large_transactions', order: 6 },
          { key: 'transfertrans', name: 'transfer_transactions', order: 7 },
          { key: 'mcatrans', name: 'mca_transactions', order: 8 }
        ];

        sectionMappings.forEach(mapping => {
          if (scorecardBodyData[mapping.key]) {
            sections.push({
              section_name: mapping.name,
              section_data: scorecardBodyData[mapping.key],
              display_order: mapping.order
            });
          }
        });

        // Add any additional sections not in the mapping
        const processedKeys = sectionMappings.map(m => m.key);
        let orderCounter = 9;
        
        Object.keys(scorecardBodyData).forEach(key => {
          if (!processedKeys.includes(key) && scorecardBodyData[key]) {
            sections.push({
              section_name: key,
              section_data: scorecardBodyData[key],
              display_order: orderCounter++
            });
          }
        });

        console.log(`Prepared ${sections.length} scorecard sections for insertion`);

        // Use a transaction to update scorecard and insert sections
        const { error: updateError } = await supabaseClient
          .from('scorecards')
          .update({
            status: 'completed',
            scorecard_url: scorecardUrl,
            webhook_response_data: webhookData,
            completed_at: new Date().toISOString()
          })
          .eq('id', scorecard.id);

        if (updateError) {
          console.error('Error updating scorecard:', updateError);
          throw new Error(`Failed to update scorecard: ${updateError.message}`);
        }

        // Insert organized sections
        if (sections.length > 0) {
          const sectionsToInsert = sections.map(section => ({
            scorecard_id: scorecard.id,
            ...section
          }));

          const { error: sectionsError } = await supabaseClient
            .from('scorecard_sections')
            .insert(sectionsToInsert);

          if (sectionsError) {
            console.error('Error inserting scorecard sections:', sectionsError);
            
            // Rollback scorecard status to error
            await supabaseClient
              .from('scorecards')
              .update({
                status: 'error',
                error_message: `Failed to save sections: ${sectionsError.message}`
              })
              .eq('id', scorecard.id);
              
            throw new Error(`Failed to save scorecard sections: ${sectionsError.message}`);
          } else {
            console.log(`Successfully inserted ${sections.length} scorecard sections`);
          }
        }

        console.log('=== Background Processing Completed Successfully ===');
        
      } catch (webhookError) {
        console.error('=== Background Processing Failed ===');
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
            },
            completed_at: new Date().toISOString()
          })
          .eq('id', scorecard.id);
      }
    };

    // Start background task using EdgeRuntime.waitUntil if available
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      EdgeRuntime.waitUntil(backgroundTask());
    } else {
      // Fallback for local development
      backgroundTask().catch(console.error);
    }

    return immediateResponse;

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
