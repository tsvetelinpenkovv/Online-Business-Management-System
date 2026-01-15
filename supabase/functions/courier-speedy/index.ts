import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SPEEDY_API_URL = 'https://api.speedy.bg/v1';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, credentials, data } = await req.json();
    
    if (!credentials?.username || !credentials?.password) {
      throw new Error('Missing Speedy credentials');
    }

    const authBody = {
      userName: credentials.username,
      password: credentials.password,
      language: 'BG',
    };

    let result;

    switch (action) {
      case 'getOffices': {
        // Get list of offices
        const response = await fetch(`${SPEEDY_API_URL}/location/office`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...authBody,
            countryId: data?.countryId || 100, // Bulgaria
            siteId: data?.siteId || null,
          }),
        });
        result = await response.json();
        break;
      }

      case 'getSites': {
        // Get list of cities/sites
        const response = await fetch(`${SPEEDY_API_URL}/location/site`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...authBody,
            countryId: data?.countryId || 100,
            name: data?.name || '',
          }),
        });
        result = await response.json();
        break;
      }

      case 'getStreets': {
        // Get streets for a site
        const response = await fetch(`${SPEEDY_API_URL}/location/street`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...authBody,
            siteId: data?.siteId,
            name: data?.name || '',
          }),
        });
        result = await response.json();
        break;
      }

      case 'getComplexes': {
        // Get complexes (квартали)
        const response = await fetch(`${SPEEDY_API_URL}/location/complex`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...authBody,
            siteId: data?.siteId,
            name: data?.name || '',
          }),
        });
        result = await response.json();
        break;
      }

      case 'calculate': {
        // Calculate shipping price
        const response = await fetch(`${SPEEDY_API_URL}/calculate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...authBody,
            sender: {
              clientId: data.sender.clientId,
              privatePerson: true,
              phone1: { number: data.sender.phone },
            },
            recipient: {
              privatePerson: true,
              phone1: { number: data.recipient.phone },
              clientName: data.recipient.name,
              pickupOfficeId: data.recipient.officeId || null,
              address: data.recipient.officeId ? null : {
                siteId: data.recipient.siteId,
                streetId: data.recipient.streetId,
                streetNo: data.recipient.streetNo,
              },
            },
            service: {
              serviceId: data.serviceId || 505, // Standard
              autoAdjustPickupDate: true,
            },
            content: {
              parcelsCount: data.parcelsCount || 1,
              totalWeight: data.weight || 1,
              contents: data.description || 'Стоки',
              package: 'BOX',
            },
            payment: {
              courierServicePayer: data.payerCourier || 'SENDER',
              declaredValuePayer: 'SENDER',
              packagePayer: 'SENDER',
            },
            ref1: data.reference || '',
          }),
        });
        result = await response.json();
        break;
      }

      case 'createShipment': {
        // Create shipment
        const shipmentData = {
          ...authBody,
          sender: {
            clientId: data.sender.clientId,
            privatePerson: false,
            phone1: { number: data.sender.phone },
            contactName: data.sender.name,
          },
          recipient: {
            privatePerson: true,
            phone1: { number: data.recipient.phone },
            clientName: data.recipient.name,
            email: data.recipient.email || '',
            pickupOfficeId: data.recipient.officeId || null,
            address: data.recipient.officeId ? null : {
              siteId: data.recipient.siteId,
              streetId: data.recipient.streetId,
              streetNo: data.recipient.streetNo,
              blockNo: data.recipient.blockNo || '',
              entranceNo: data.recipient.entranceNo || '',
              floorNo: data.recipient.floorNo || '',
              apartmentNo: data.recipient.apartmentNo || '',
              addressNote: data.recipient.addressNote || '',
            },
          },
          service: {
            serviceId: data.serviceId || 505,
            autoAdjustPickupDate: true,
            additionalServices: {
              cod: data.codAmount > 0 ? {
                amount: data.codAmount,
                currencyCode: 'BGN',
                payoutToThirdParty: false,
                includeShippingPrice: false,
              } : null,
              declaredValue: data.declaredValue > 0 ? {
                amount: data.declaredValue,
                fragile: data.fragile || false,
                ignoreIfNotApplicable: true,
              } : null,
              obpd: data.payAfterTest ? {
                option: 'OPEN',
                returnShipmentServiceId: 505,
              } : null,
            },
          },
          content: {
            parcelsCount: data.parcelsCount || 1,
            totalWeight: data.weight || 1,
            contents: data.description || 'Стоки',
            package: 'BOX',
          },
          payment: {
            courierServicePayer: data.payerCourier || 'SENDER',
            declaredValuePayer: 'SENDER',
            packagePayer: 'SENDER',
          },
          ref1: data.reference || '',
        };

        const response = await fetch(`${SPEEDY_API_URL}/shipment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(shipmentData),
        });
        result = await response.json();
        break;
      }

      case 'track': {
        // Track shipment
        const response = await fetch(`${SPEEDY_API_URL}/track`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...authBody,
            parcels: [data.waybillNumber],
          }),
        });
        result = await response.json();
        break;
      }

      case 'print': {
        // Get label PDF
        const response = await fetch(`${SPEEDY_API_URL}/print`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...authBody,
            paperSize: 'A6',
            parcels: [{ parcel: { id: data.parcelId } }],
          }),
        });
        
        if (response.headers.get('content-type')?.includes('application/pdf')) {
          const pdfBuffer = await response.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));
          result = { pdf: base64 };
        } else {
          result = await response.json();
        }
        break;
      }

      case 'validateCredentials': {
        // Validate by getting client info
        const response = await fetch(`${SPEEDY_API_URL}/client`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...authBody,
          }),
        });
        result = await response.json();
        break;
      }

      case 'getServices': {
        // Get available services
        const response = await fetch(`${SPEEDY_API_URL}/services`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...authBody,
          }),
        });
        result = await response.json();
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    console.log(`Speedy ${action} completed:`, result?.error || 'success');

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Speedy API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
