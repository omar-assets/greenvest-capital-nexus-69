
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookApplication {
  success: boolean;
  appnumber: string;
  appid: number;
  owner: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  totalStatements: number;
  reconciledStatements: number;
  accountCount: number;
  accountList: string[];
  lastUpdated: string;
  [key: string]: any;
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

    console.log('Starting webhook sync for user:', user.id);

    // Use the correct webhook URL for syncing applications (not scorecard)
    const webhookUrl = Deno.env.get('N8N_WEBHOOK_URL');
    const username = Deno.env.get('N8N_BASIC_AUTH_USERNAME');
    const password = Deno.env.get('N8N_BASIC_AUTH_PASSWORD');

    if (!webhookUrl || !username || !password) {
      console.error('Missing required environment variables for app sync');
      return new Response(JSON.stringify({ 
        error: 'Configuration error: Missing webhook credentials for app sync',
        details: {
          webhookUrl: webhookUrl ? 'SET' : 'MISSING (N8N_WEBHOOK_URL)',
          username: username ? 'SET' : 'MISSING',
          password: password ? 'SET' : 'MISSING'
        },
        configurationError: true
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Simple connectivity test for the apps webhook
    console.log('Testing apps webhook connectivity:', webhookUrl);
    const basicAuth = btoa(`${username}:${password}`);
    
    try {
      const testResponse = await fetch(webhookUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/json',
        },
      });

      if (!testResponse.ok) {
        console.error('Apps webhook connectivity test failed:', testResponse.status, testResponse.statusText);
        return new Response(JSON.stringify({ 
          error: 'Apps webhook connectivity failed',
          status: testResponse.status,
          statusText: testResponse.statusText,
          webhookUrl,
          validationError: true
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Apps webhook connectivity test successful');
    } catch (connectivityError) {
      console.error('Error testing apps webhook connectivity:', connectivityError);
      return new Response(JSON.stringify({ 
        error: 'Failed to connect to apps webhook',
        details: connectivityError.message,
        webhookUrl,
        validationError: true
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Make authenticated request to n8n webhook for apps
    console.log('Calling apps webhook for data:', webhookUrl);

    let webhookResponse;
    try {
      webhookResponse = await fetch(webhookUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (fetchError) {
      console.error('Network error calling apps webhook:', fetchError);
      return new Response(JSON.stringify({ 
        error: 'Network error calling apps webhook',
        details: fetchError.message,
        webhookUrl
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!webhookResponse.ok) {
      console.error('Apps webhook request failed:', webhookResponse.status, webhookResponse.statusText);
      const errorText = await webhookResponse.text();
      console.error('Error response:', errorText);
      
      return new Response(JSON.stringify({ 
        error: 'Failed to fetch applications from apps webhook',
        status: webhookResponse.status,
        statusText: webhookResponse.statusText,
        details: errorText,
        webhookUrl
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const responseText = await webhookResponse.text();
    console.log('Raw apps webhook response length:', responseText.length);

    let applications: WebhookApplication[];
    try {
      applications = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse apps webhook response as JSON:', parseError);
      return new Response(JSON.stringify({ 
        error: 'Invalid JSON response from apps webhook',
        details: parseError.message,
        rawResponse: responseText.substring(0, 500) // First 500 chars for debugging
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!Array.isArray(applications)) {
      console.error('Apps webhook response is not an array:', typeof applications);
      return new Response(JSON.stringify({ 
        error: 'Apps webhook response is not an array',
        responseType: typeof applications,
        response: applications
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Received ${applications.length} applications from apps webhook`);

    let companiesCreated = 0;
    let companiesUpdated = 0;
    let dealsCreated = 0;
    const errors: string[] = [];

    // Process each application with better error handling
    for (const app of applications) {
      try {
        console.log(`Processing application: ${app.appnumber} (ID: ${app.appid})`);

        // Check if company already exists
        const { data: existingCompany, error: findError } = await supabaseClient
          .from('companies')
          .select('*')
          .eq('user_id', user.id)
          .eq('external_app_id', app.appid)
          .single();

        if (findError && findError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          console.error('Error finding existing company:', findError);
          errors.push(`Failed to check existing company for ${app.appnumber}: ${findError.message}`);
          continue;
        }

        let companyId: string;

        if (existingCompany) {
          // Update existing company
          const { data: updatedCompany, error: updateError } = await supabaseClient
            .from('companies')
            .update({
              company_name: app.appnumber,
              dba_name: app.owner,
              address_line1: app.address,
              city: app.city,
              state: app.state,
              zip_code: app.zip,
              external_app_number: app.appnumber,
              webhook_metadata: app,
              last_synced_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingCompany.id)
            .eq('user_id', user.id)
            .select()
            .single();

          if (updateError) {
            console.error('Error updating company:', updateError);
            errors.push(`Failed to update company ${app.appnumber}: ${updateError.message}`);
            continue;
          }

          companyId = updatedCompany.id;
          companiesUpdated++;
          console.log(`Updated company: ${app.appnumber}`);
        } else {
          // Create new company
          const { data: newCompany, error: createError } = await supabaseClient
            .from('companies')
            .insert({
              user_id: user.id,
              company_name: app.appnumber,
              dba_name: app.owner,
              address_line1: app.address,
              city: app.city,
              state: app.state,
              zip_code: app.zip,
              external_app_id: app.appid,
              external_app_number: app.appnumber,
              webhook_metadata: app,
              last_synced_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (createError) {
            console.error('Error creating company:', createError);
            errors.push(`Failed to create company ${app.appnumber}: ${createError.message}`);
            continue;
          }

          companyId = newCompany.id;
          companiesCreated++;
          console.log(`Created company: ${app.appnumber}`);
        }

        // Check if deal already exists for this application
        const { data: existingDeal, error: dealFindError } = await supabaseClient
          .from('deals')
          .select('*')
          .eq('user_id', user.id)
          .eq('company_id', companyId)
          .single();

        if (dealFindError && dealFindError.code !== 'PGRST116') {
          console.error('Error finding existing deal:', dealFindError);
          errors.push(`Failed to check existing deal for ${app.appnumber}: ${dealFindError.message}`);
          continue;
        }

        if (!existingDeal) {
          // Create deal for this application
          const { error: dealError } = await supabaseClient
            .from('deals')
            .insert({
              user_id: user.id,
              company_id: companyId,
              company_name: app.appnumber,
              amount_requested: 50000, // Default amount - can be updated later
              stage: 'New',
              monthly_revenue: null,
              average_daily_balance: null,
            });

          if (dealError) {
            console.error('Error creating deal:', dealError);
            errors.push(`Failed to create deal for ${app.appnumber}: ${dealError.message}`);
          } else {
            dealsCreated++;
            console.log(`Created deal for: ${app.appnumber}`);
          }
        }

      } catch (error) {
        console.error(`Unexpected error processing application ${app.appnumber}:`, error);
        errors.push(`Unexpected error processing ${app.appnumber}: ${error.message}`);
      }
    }

    const result = {
      success: true,
      totalApplications: applications.length,
      companiesCreated,
      companiesUpdated,
      dealsCreated,
      errors,
      syncedAt: new Date().toISOString(),
      webhookType: 'apps',
      webhookUrl: webhookUrl,
    };

    console.log('Apps sync completed:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in sync-applications function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
