
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
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
    )

    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

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

    const { company_id, deal_id, external_app_id } = await req.json()

    if (!external_app_id) {
      console.error('Missing external_app_id in request')
      return new Response(
        JSON.stringify({ error: 'Missing required field: external_app_id' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Processing scorecard request for app_id: ${external_app_id}`)

    // Get webhook configuration
    const webhookUrl = Deno.env.get('N8N_GET_SCORECARD_WEBHOOK_URL')

    if (!webhookUrl) {
      console.error('Missing N8N_GET_SCORECARD_WEBHOOK_URL environment variable')
      return new Response(
        JSON.stringify({ error: 'Webhook configuration not found' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate webhook URL format
    let validatedUrl;
    try {
      validatedUrl = new URL(webhookUrl);
      console.log(`Validated webhook URL: ${validatedUrl.toString()}`);
    } catch (error) {
      console.error('Invalid webhook URL format:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid webhook URL configuration',
          details: error.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Using webhook URL: ${webhookUrl}`)

    // Check if we already have this scorecard in our database
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
      console.log('Found existing scorecard in database')
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

    // Create initial scorecard record
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
          timestamp: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (scorecardError) {
      console.error('Error creating scorecard record:', scorecardError)
      return new Response(
        JSON.stringify({ error: 'Failed to create scorecard record' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    try {
      // Prepare webhook payload
      const webhookPayload = {
        app_id: external_app_id,
        scorecard_id: scorecard.id,
        user_id: user.id,
        company_id: company_id || null,
        deal_id: deal_id || null,
        action: 'get_scorecard'
      };

      console.log('Webhook payload:', JSON.stringify(webhookPayload, null, 2));

      // Call N8N webhook without authentication (as requested)
      console.log(`Making webhook request to: ${webhookUrl}`);
      
      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Supabase-Functions/1.0'
        },
        body: JSON.stringify(webhookPayload)
      })

      console.log(`Webhook response status: ${webhookResponse.status} ${webhookResponse.statusText}`);
      console.log(`Webhook response headers:`, Object.fromEntries(webhookResponse.headers.entries()));

      if (!webhookResponse.ok) {
        const responseText = await webhookResponse.text();
        console.error(`Webhook request failed with status ${webhookResponse.status}:`, responseText);
        
        throw new Error(`Webhook request failed: ${webhookResponse.status} ${webhookResponse.statusText}. Response: ${responseText}`);
      }

      const webhookData = await webhookResponse.json()
      console.log('Webhook response received:', JSON.stringify(webhookData, null, 2));

      // Check if scorecard exists in API response
      if (!webhookData.scorecard) {
        console.log('No scorecard found in webhook response for app_id:', external_app_id);
        
        await supabaseClient
          .from('scorecards')
          .update({
            status: 'error',
            error_message: 'No scorecard found for this application'
          })
          .eq('id', scorecard.id)

        return new Response(
          JSON.stringify({ 
            error: 'No scorecard found for this application',
            app_id: external_app_id 
          }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Process and organize the webhook response data
      const sections = []
      
      if (webhookData.scorecard) {
        const scorecard_data = webhookData.scorecard

        // Revenue Statistics
        if (scorecard_data.revenue_statistics) {
          sections.push({
            section_name: 'revenue_statistics',
            section_data: scorecard_data.revenue_statistics,
            display_order: 1
          })
        }

        // Statements Summary
        if (scorecard_data.statements_summary) {
          sections.push({
            section_name: 'statements_summary',
            section_data: scorecard_data.statements_summary,
            display_order: 2
          })
        }

        // Transaction Categories
        const transactionSections = [
          'debit_transactions', 'credit_transactions', 'true_credit_transactions',
          'nontrue_credit_transactions', 'mca_transactions', 'nsf_transactions',
          'overdraft_transactions', 'large_transactions', 'transfers',
          'mobile_payments', 'payment_processor_transactions'
        ]

        transactionSections.forEach((sectionName, index) => {
          if (scorecard_data[sectionName]) {
            sections.push({
              section_name: sectionName,
              section_data: scorecard_data[sectionName],
              display_order: index + 10
            })
          }
        })

        // Analysis Sections
        if (scorecard_data.average_true_revenue_6_month) {
          sections.push({
            section_name: 'average_true_revenue_6_month',
            section_data: scorecard_data.average_true_revenue_6_month,
            display_order: 50
          })
        }

        if (scorecard_data.average_true_revenue_12_month) {
          sections.push({
            section_name: 'average_true_revenue_12_month',
            section_data: scorecard_data.average_true_revenue_12_month,
            display_order: 51
          })
        }

        // Daily/Monthly Data
        if (scorecard_data.daily_balances) {
          sections.push({
            section_name: 'daily_balances',
            section_data: scorecard_data.daily_balances,
            display_order: 60
          })
        }

        if (scorecard_data.monthly_cash_flows) {
          sections.push({
            section_name: 'monthly_cash_flows',
            section_data: scorecard_data.monthly_cash_flows,
            display_order: 61
          })
        }

        // MCA Companies
        if (scorecard_data.mca_companies) {
          sections.push({
            section_name: 'mca_companies',
            section_data: scorecard_data.mca_companies,
            display_order: 70
          })
        }
      }

      // Update scorecard with response data and URL
      await supabaseClient
        .from('scorecards')
        .update({
          status: 'completed',
          scorecard_url: webhookData.scorecard_url || null,
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

      console.log('Scorecard processing completed successfully')
      return new Response(
        JSON.stringify({ 
          success: true, 
          scorecard_id: scorecard.id,
          scorecard_url: webhookData.scorecard_url || null,
          sections_created: sections.length,
          source: 'api'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )

    } catch (webhookError) {
      console.error('Webhook request failed:', webhookError)
      
      await supabaseClient
        .from('scorecards')
        .update({
          status: 'error',
          error_message: webhookError.message
        })
        .eq('id', scorecard.id)

      return new Response(
        JSON.stringify({ 
          error: 'Failed to process scorecard request',
          details: webhookError.message,
          webhook_url: webhookUrl
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

  } catch (error) {
    console.error('Function error:', error)
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
