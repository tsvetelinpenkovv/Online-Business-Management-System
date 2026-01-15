import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SAMEDAY_PROD_URL = 'https://api.sameday.bg';
const SAMEDAY_TEST_URL = 'https://sameday-api.demo.zitec.com';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, credentials, data } = await req.json();
    
    if (!credentials?.username || !credentials?.password) {
      throw new Error('Missing Sameday credentials');
    }

    const baseUrl = credentials.is_test_mode ? SAMEDAY_TEST_URL : SAMEDAY_PROD_URL;

    // Get access token
    const authResponse = await fetch(`${baseUrl}/api/authenticate?remember_me=true`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        username: credentials.username,
        password: credentials.password,
      }),
    });

    if (!authResponse.ok) {
      const authError = await authResponse.text();
      throw new Error(`Authentication failed: ${authError}`);
    }

    const authData = await authResponse.json();
    const accessToken = authData.token;

    let result;

    switch (action) {
      case 'getPickupPoints': {
        // Get pickup points
        const response = await fetch(`${baseUrl}/api/client/pickup-points`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });
        result = await response.json();
        break;
      }

      case 'getServices': {
        // Get available services
        const response = await fetch(`${baseUrl}/api/client/services`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });
        result = await response.json();
        break;
      }

      case 'getLockers': {
        // Get lockers
        const response = await fetch(`${baseUrl}/api/client/lockers?${new URLSearchParams({
          page: String(data?.page || 1),
          countPerPage: String(data?.perPage || 50),
          ...(data?.countyId ? { countyId: String(data.countyId) } : {}),
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

      case 'getCounties': {
        // Get counties
        const response = await fetch(`${baseUrl}/api/geolocation/county`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });
        result = await response.json();
        break;
      }

      case 'getCities': {
        // Get cities
        const response = await fetch(`${baseUrl}/api/geolocation/city?${new URLSearchParams({
          ...(data?.countyId ? { county: String(data.countyId) } : {}),
          ...(data?.name ? { name: data.name } : {}),
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

      case 'createAwb': {
        // Create AWB (shipment)
        const awbData = {
          pickupPoint: data.pickupPointId,
          contactPerson: data.contactPerson || '',
          packageType: data.packageType || 0, // 0 = parcel, 1 = envelope
          packageWeight: data.weight || 1,
          packageNumber: data.packagesCount || 1,
          service: data.serviceId || 7, // Standard service
          cashOnDelivery: data.codAmount || 0,
          cashOnDeliveryReturns: data.codAmount > 0 ? 1 : 0,
          insuredValue: data.declaredValue || 0,
          thirdPartyPickup: 0,
          awbRecipient: {
            name: data.recipient.name,
            phoneNumber: data.recipient.phone,
            email: data.recipient.email || '',
            personType: 0, // individual
            postalCode: data.recipient.postalCode || '',
            county: data.recipient.countyId,
            city: data.recipient.cityId,
            address: data.recipient.address,
          },
          lockerId: data.recipient.lockerId || null,
          parcels: Array.from({ length: data.packagesCount || 1 }, (_, i) => ({
            weight: (data.weight || 1) / (data.packagesCount || 1),
          })),
          observation: data.notes || '',
          clientInternalReference: data.reference || '',
        };

        const response = await fetch(`${baseUrl}/api/awb`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(awbData),
        });
        result = await response.json();
        break;
      }

      case 'getAwbPdf': {
        // Get AWB PDF
        const response = await fetch(`${baseUrl}/api/awb/download/${data.awbNumber}/${data.type || 'A4'}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        const pdfBuffer = await response.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));
        result = { pdf: base64, contentType: 'application/pdf' };
        break;
      }

      case 'trackAwb': {
        // Track AWB
        const response = await fetch(`${baseUrl}/api/client/awb/${data.awbNumber}/status`, {
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
        // Already validated by getting token
        result = { success: true };
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    console.log(`Sameday ${action} completed:`, result?.error || 'success');

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Sameday API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
