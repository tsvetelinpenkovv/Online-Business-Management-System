import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BOXNOW_PROD_URL = 'https://api-production.boxnow.bg/api/v1';
const BOXNOW_TEST_URL = 'https://api-stage.boxnow.bg/api/v1';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, credentials, data } = await req.json();
    
    if (!credentials?.client_id || !credentials?.client_secret) {
      throw new Error('Missing Box Now credentials');
    }

    const baseUrl = credentials.is_test_mode ? BOXNOW_TEST_URL : BOXNOW_PROD_URL;

    // Get access token
    const authResponse = await fetch(`${baseUrl}/auth-sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: credentials.client_id,
        client_secret: credentials.client_secret,
      }),
    });

    if (!authResponse.ok) {
      const authError = await authResponse.text();
      throw new Error(`Authentication failed: ${authError}`);
    }

    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    let result;

    switch (action) {
      case 'getDestinations': {
        // Get list of lockers/destinations
        const response = await fetch(`${baseUrl}/destinations?${new URLSearchParams({
          page: String(data?.page || 1),
          perPage: String(data?.perPage || 100),
          ...(data?.city ? { city: data.city } : {}),
        })}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });
        result = await response.json();
        break;
      }

      case 'getOrigins': {
        // Get list of pickup origins
        const response = await fetch(`${baseUrl}/origins`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });
        result = await response.json();
        break;
      }

      case 'createDelivery': {
        // Create delivery request
        const deliveryData = {
          orderNumber: data.orderNumber || `ORD-${Date.now()}`,
          invoiceValue: String(data.invoiceValue || data.codAmount || 0),
          paymentMode: data.codAmount > 0 ? 1 : 0, // 0 = prepaid, 1 = COD
          amountToBeCollected: String(data.codAmount || 0),
          allowReturn: true,
          origin: {
            contactEmail: data.sender.email || '',
            contactPhone: data.sender.phone,
            contactName: data.sender.name,
            originId: data.sender.originId,
          },
          destination: {
            contactEmail: data.recipient.email || '',
            contactPhone: data.recipient.phone,
            contactName: data.recipient.name,
            destinationId: data.recipient.destinationId,
          },
          items: data.items || [{
            name: data.description || 'Пратка',
            value: String(data.invoiceValue || 0),
            quantity: 1,
          }],
        };

        const response = await fetch(`${baseUrl}/delivery-requests`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(deliveryData),
        });
        result = await response.json();
        break;
      }

      case 'getLabel': {
        // Get shipping label
        const format = data.format || 'pdf';
        const response = await fetch(`${baseUrl}/parcels/${data.parcelId}/label.${format}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (format === 'pdf') {
          const pdfBuffer = await response.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));
          result = { pdf: base64, contentType: 'application/pdf' };
        } else {
          result = await response.json();
        }
        break;
      }

      case 'getParcels': {
        // Get parcels list
        const response = await fetch(`${baseUrl}/parcels?${new URLSearchParams({
          page: String(data?.page || 1),
          perPage: String(data?.perPage || 50),
        })}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });
        result = await response.json();
        break;
      }

      case 'getParcelStatus': {
        // Get parcel status
        const response = await fetch(`${baseUrl}/parcels/${data.parcelId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });
        result = await response.json();
        break;
      }

      case 'validateCredentials': {
        // Already validated by getting token, just return success
        result = { success: true, clientId: credentials.client_id };
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    console.log(`Box Now ${action} completed:`, result?.error || 'success');

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Box Now API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
