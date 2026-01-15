import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CVC_API_URL = 'https://api.cvc.bg/v1';
const CVC_TEST_API_URL = 'https://api-test.cvc.bg/v1';

interface CVCCredentials {
  username: string;
  password: string;
  client_id?: string;
  is_test_mode: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, credentials, data } = await req.json();
    const creds = credentials as CVCCredentials;

    if (!creds.username || !creds.password) {
      return new Response(
        JSON.stringify({ error: 'CVC username and password are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const baseUrl = creds.is_test_mode ? CVC_TEST_API_URL : CVC_API_URL;
    const authHeader = 'Basic ' + btoa(`${creds.username}:${creds.password}`);

    let result: unknown;

    switch (action) {
      case 'getOffices': {
        // Get CVC offices/pick-up points
        const response = await fetch(`${baseUrl}/offices`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
          },
        });
        result = await response.json();
        break;
      }

      case 'getCities': {
        // Get cities
        const response = await fetch(`${baseUrl}/cities${data?.name ? `?name=${encodeURIComponent(data.name)}` : ''}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
          },
        });
        result = await response.json();
        break;
      }

      case 'getStreets': {
        // Get streets for a city
        const response = await fetch(`${baseUrl}/cities/${data.cityId}/streets${data.name ? `?name=${encodeURIComponent(data.name)}` : ''}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
          },
        });
        result = await response.json();
        break;
      }

      case 'calculatePrice': {
        // Calculate shipping price
        const calcData = {
          senderCityId: data.senderCityId,
          receiverCityId: data.receiverCityId,
          weight: data.weight || 1,
          service: data.service || 'standard',
          cod: data.codAmount || 0,
          declaredValue: data.declaredValue || 0,
          packCount: data.packCount || 1,
        };

        const response = await fetch(`${baseUrl}/calculate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
          },
          body: JSON.stringify(calcData),
        });
        result = await response.json();
        break;
      }

      case 'createShipment': {
        // Create shipment/waybill
        const shipmentData = {
          sender: {
            name: data.sender.name,
            phone: data.sender.phone,
            cityId: data.sender.cityId,
            address: data.sender.address,
            officeId: data.sender.officeId,
          },
          receiver: {
            name: data.recipient.name,
            phone: data.recipient.phone,
            cityId: data.recipient.cityId,
            address: data.recipient.address,
            officeId: data.recipient.officeId,
          },
          service: data.service || 'standard',
          weight: data.weight || 1,
          packCount: data.packCount || 1,
          cod: data.codAmount || 0,
          declaredValue: data.declaredValue || 0,
          contents: data.description || 'Стоки',
          notes: data.notes || '',
          payerType: data.payerCourier || 'sender',
          payAfterTest: data.payAfterTest || false,
        };

        const response = await fetch(`${baseUrl}/shipments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
          },
          body: JSON.stringify(shipmentData),
        });
        result = await response.json();
        break;
      }

      case 'getLabel': {
        // Get shipping label PDF
        const response = await fetch(`${baseUrl}/shipments/${data.waybillNumber}/label`, {
          method: 'GET',
          headers: {
            'Authorization': authHeader,
            'Accept': 'application/pdf',
          },
        });
        
        if (response.headers.get('content-type')?.includes('application/pdf')) {
          const pdfBuffer = await response.arrayBuffer();
          const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));
          result = { pdf: `data:application/pdf;base64,${pdfBase64}` };
        } else {
          result = await response.json();
        }
        break;
      }

      case 'track': {
        // Track shipment
        const response = await fetch(`${baseUrl}/shipments/${data.waybillNumber}/tracking`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
          },
        });
        result = await response.json();
        break;
      }

      case 'cancelShipment': {
        // Cancel shipment
        const response = await fetch(`${baseUrl}/shipments/${data.waybillNumber}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
          },
        });
        result = response.ok ? { success: true } : await response.json();
        break;
      }

      case 'validateCredentials': {
        // Validate credentials by fetching offices
        try {
          const response = await fetch(`${baseUrl}/offices`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': authHeader,
            },
          });
          
          if (response.ok) {
            result = { success: true, message: 'Credentials validated successfully' };
          } else {
            const error = await response.json();
            result = { success: false, error: error.message || 'Invalid credentials' };
          }
        } catch (err) {
          result = { success: false, error: err instanceof Error ? err.message : 'Connection failed' };
        }
        break;
      }

      case 'getServices': {
        // Get available services
        const response = await fetch(`${baseUrl}/services`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
          },
        });
        result = await response.json();
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('CVC API error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
