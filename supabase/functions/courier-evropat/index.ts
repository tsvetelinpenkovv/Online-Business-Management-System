import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Evropat uses a different API structure
const EVROPAT_API_URL = 'https://api.evropat.bg';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, credentials, data } = await req.json();
    
    if (!credentials?.api_key) {
      throw new Error('Missing Evropat API key');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${credentials.api_key}`,
    };

    let result;

    switch (action) {
      case 'getOffices': {
        // Get list of offices
        const response = await fetch(`${EVROPAT_API_URL}/offices`, {
          method: 'GET',
          headers,
        });
        result = await response.json();
        break;
      }

      case 'getCities': {
        // Get cities
        const response = await fetch(`${EVROPAT_API_URL}/cities`, {
          method: 'GET',
          headers,
        });
        result = await response.json();
        break;
      }

      case 'calculatePrice': {
        // Calculate shipping price
        const response = await fetch(`${EVROPAT_API_URL}/calculate`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            sender_city: data.sender.city,
            recipient_city: data.recipient.city,
            weight: data.weight || 1,
            cod_amount: data.codAmount || 0,
            declared_value: data.declaredValue || 0,
            delivery_type: data.deliveryType || 'office',
          }),
        });
        result = await response.json();
        break;
      }

      case 'createShipment': {
        // Create shipment
        const shipmentData = {
          sender: {
            name: data.sender.name,
            phone: data.sender.phone,
            city: data.sender.city,
            address: data.sender.address,
            office_code: data.sender.officeCode,
          },
          recipient: {
            name: data.recipient.name,
            phone: data.recipient.phone,
            city: data.recipient.city,
            address: data.recipient.address,
            office_code: data.recipient.officeCode,
          },
          delivery_type: data.deliveryType || 'office', // 'office' or 'address'
          weight: data.weight || 1,
          packages_count: data.packagesCount || 1,
          cod_amount: data.codAmount || 0,
          declared_value: data.declaredValue || 0,
          description: data.description || 'Стоки',
          notes: data.notes || '',
          reference: data.reference || '',
        };

        const response = await fetch(`${EVROPAT_API_URL}/shipments`, {
          method: 'POST',
          headers,
          body: JSON.stringify(shipmentData),
        });
        result = await response.json();
        break;
      }

      case 'getLabel': {
        // Get shipping label PDF
        const response = await fetch(`${EVROPAT_API_URL}/shipments/${data.waybillNumber}/label`, {
          method: 'GET',
          headers,
        });

        if (response.headers.get('content-type')?.includes('application/pdf')) {
          const pdfBuffer = await response.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));
          result = { pdf: base64, contentType: 'application/pdf' };
        } else {
          result = await response.json();
        }
        break;
      }

      case 'track': {
        // Track shipment
        const response = await fetch(`${EVROPAT_API_URL}/shipments/${data.waybillNumber}/track`, {
          method: 'GET',
          headers,
        });
        result = await response.json();
        break;
      }

      case 'cancelShipment': {
        // Cancel shipment
        const response = await fetch(`${EVROPAT_API_URL}/shipments/${data.waybillNumber}/cancel`, {
          method: 'POST',
          headers,
        });
        result = await response.json();
        break;
      }

      case 'validateCredentials': {
        // Validate API key by listing offices
        const response = await fetch(`${EVROPAT_API_URL}/offices`, {
          method: 'GET',
          headers,
        });
        
        if (response.ok) {
          result = { success: true };
        } else {
          result = await response.json();
        }
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    console.log(`Evropat ${action} completed:`, result?.error || 'success');

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Evropat API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
