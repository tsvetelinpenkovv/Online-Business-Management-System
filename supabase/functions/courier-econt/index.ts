import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EcontCredentials {
  username: string;
  password: string;
  is_test_mode: boolean;
}

const getBaseUrl = (isTestMode: boolean) => 
  isTestMode ? 'https://demo.econt.com/ee/services' : 'https://ee.econt.com/ee/services';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, credentials, data } = await req.json();
    
    if (!credentials?.username || !credentials?.password) {
      throw new Error('Missing Econt credentials');
    }

    const baseUrl = getBaseUrl(credentials.is_test_mode);
    const authHeader = 'Basic ' + btoa(`${credentials.username}:${credentials.password}`);

    let result;

    switch (action) {
      case 'getOffices': {
        // Get list of offices
        const response = await fetch(`${baseUrl}/Nomenclatures/NomenclaturesService.getOffices.json`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
          },
          body: JSON.stringify({
            countryCode: data?.countryCode || 'BGR',
            cityID: data?.cityId || null,
          }),
        });
        result = await response.json();
        break;
      }

      case 'getCities': {
        // Get list of cities
        const response = await fetch(`${baseUrl}/Nomenclatures/NomenclaturesService.getCities.json`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
          },
          body: JSON.stringify({
            countryCode: data?.countryCode || 'BGR',
          }),
        });
        result = await response.json();
        break;
      }

      case 'getStreets': {
        // Get streets for a city
        const response = await fetch(`${baseUrl}/Nomenclatures/NomenclaturesService.getStreets.json`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
          },
          body: JSON.stringify({
            cityID: data?.cityId,
          }),
        });
        result = await response.json();
        break;
      }

      case 'createLabel': {
        // Create shipment label/waybill
        const labelData = {
          label: {
            senderClient: {
              name: data.sender.name,
              phones: [data.sender.phone],
            },
            senderAddress: data.sender.officeCode ? {
              city: { name: data.sender.city },
            } : {
              city: { name: data.sender.city },
              street: data.sender.street,
              num: data.sender.streetNum,
            },
            senderOfficeCode: data.sender.officeCode || null,
            
            receiverClient: {
              name: data.recipient.name,
              phones: [data.recipient.phone],
            },
            receiverAddress: data.recipient.officeCode ? null : {
              city: { name: data.recipient.city },
              street: data.recipient.street,
              num: data.recipient.streetNum,
              other: data.recipient.other,
            },
            receiverOfficeCode: data.recipient.officeCode || null,
            
            packCount: data.packCount || 1,
            shipmentType: data.shipmentType || 'PACK',
            weight: data.weight || 1,
            shipmentDescription: data.description || 'Стоки',
            
            services: {
              cdAmount: data.codAmount || 0,
              cdType: data.codAmount > 0 ? 'GET' : null,
              cdCurrency: 'BGN',
              declaredValueAmount: data.declaredValue || 0,
              declaredValueCurrency: 'BGN',
            },
            
            payAfterAccept: data.payAfterAccept || false,
            payAfterTest: data.payAfterTest || false,
            
            instructions: data.notes || '',
          },
          mode: 'create',
        };

        const response = await fetch(`${baseUrl}/Shipments/LabelService.createLabel.json`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
          },
          body: JSON.stringify(labelData),
        });
        result = await response.json();
        break;
      }

      case 'getLabel': {
        // Get PDF label
        const response = await fetch(`${baseUrl}/Shipments/LabelService.createLabel.json`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
          },
          body: JSON.stringify({
            shipmentNumber: data.waybillNumber,
            mode: 'get',
          }),
        });
        result = await response.json();
        break;
      }

      case 'track': {
        // Track shipment
        const response = await fetch(`${baseUrl}/Shipments/ShipmentService.getShipmentStatuses.json`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
          },
          body: JSON.stringify({
            shipmentNumbers: [data.waybillNumber],
          }),
        });
        result = await response.json();
        break;
      }

      case 'validateCredentials': {
        // Simple validation by getting client profile
        const response = await fetch(`${baseUrl}/Profile/ProfileService.getClientProfiles.json`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
          },
          body: JSON.stringify({}),
        });
        result = await response.json();
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    console.log(`Econt ${action} completed:`, result?.error || 'success');

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Econt API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
