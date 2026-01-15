import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DHL_PROD_URL = 'https://express.api.dhl.com/mydhlapi';
const DHL_TEST_URL = 'https://express.api.dhl.com/mydhlapi/test';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, credentials, data } = await req.json();
    
    if (!credentials?.username || !credentials?.password) {
      throw new Error('Missing DHL credentials');
    }

    const baseUrl = credentials.is_test_mode ? DHL_TEST_URL : DHL_PROD_URL;
    const authHeader = 'Basic ' + btoa(`${credentials.username}:${credentials.password}`);

    let result;

    switch (action) {
      case 'getServicePoints': {
        // Get service points (offices)
        const params = new URLSearchParams({
          countryCode: data?.countryCode || 'BG',
          ...(data?.city ? { city: data.city } : {}),
          ...(data?.postalCode ? { postalCode: data.postalCode } : {}),
          radius: String(data?.radius || 25000),
          maxResults: String(data?.maxResults || 50),
        });

        const response = await fetch(`${baseUrl}/servicepoints?${params}`, {
          method: 'GET',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
        });
        result = await response.json();
        break;
      }

      case 'getRates': {
        // Get shipping rates
        const rateData = {
          customerDetails: {
            shipperDetails: {
              postalCode: data.sender.postalCode || '1000',
              cityName: data.sender.city || 'Sofia',
              countryCode: data.sender.countryCode || 'BG',
            },
            receiverDetails: {
              postalCode: data.recipient.postalCode || '1000',
              cityName: data.recipient.city,
              countryCode: data.recipient.countryCode || 'BG',
            },
          },
          accounts: [{
            typeCode: 'shipper',
            number: credentials.account_number || '',
          }],
          plannedShippingDateAndTime: new Date().toISOString(),
          unitOfMeasurement: 'metric',
          isCustomsDeclarable: false,
          packages: [{
            weight: data.weight || 1,
            dimensions: {
              length: data.length || 20,
              width: data.width || 15,
              height: data.height || 10,
            },
          }],
        };

        const response = await fetch(`${baseUrl}/rates`, {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(rateData),
        });
        result = await response.json();
        break;
      }

      case 'createShipment': {
        // Create shipment
        const shipmentData = {
          plannedShippingDateAndTime: data.plannedDate || new Date().toISOString(),
          pickup: {
            isRequested: data.requestPickup || false,
          },
          productCode: data.productCode || 'P', // DHL Express Worldwide
          accounts: [{
            typeCode: 'shipper',
            number: credentials.account_number || '',
          }],
          customerDetails: {
            shipperDetails: {
              postalAddress: {
                postalCode: data.sender.postalCode,
                cityName: data.sender.city,
                countryCode: data.sender.countryCode || 'BG',
                addressLine1: data.sender.address,
              },
              contactInformation: {
                phone: data.sender.phone,
                companyName: data.sender.companyName || data.sender.name,
                fullName: data.sender.name,
                email: data.sender.email || '',
              },
            },
            receiverDetails: {
              postalAddress: {
                postalCode: data.recipient.postalCode,
                cityName: data.recipient.city,
                countryCode: data.recipient.countryCode || 'BG',
                addressLine1: data.recipient.address,
              },
              contactInformation: {
                phone: data.recipient.phone,
                companyName: data.recipient.companyName || data.recipient.name,
                fullName: data.recipient.name,
                email: data.recipient.email || '',
              },
            },
          },
          content: {
            packages: [{
              weight: data.weight || 1,
              dimensions: {
                length: data.length || 20,
                width: data.width || 15,
                height: data.height || 10,
              },
              description: data.description || 'Goods',
            }],
            isCustomsDeclarable: data.customsDeclarable || false,
            declaredValue: data.declaredValue || 0,
            declaredValueCurrency: 'BGN',
            description: data.description || 'Goods',
            incoterm: 'DAP',
            unitOfMeasurement: 'metric',
          },
          outputImageProperties: {
            printerDPI: 300,
            encodingFormat: 'pdf',
            imageOptions: [{
              typeCode: 'waybillDoc',
              templateName: 'ARCH_8X4_A4_002',
            }],
          },
        };

        const response = await fetch(`${baseUrl}/shipments`, {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(shipmentData),
        });
        result = await response.json();
        break;
      }

      case 'track': {
        // Track shipment
        const response = await fetch(`${baseUrl}/tracking?shipmentTrackingNumber=${data.waybillNumber}`, {
          method: 'GET',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
        });
        result = await response.json();
        break;
      }

      case 'getLabel': {
        // Get label - included in shipment creation response
        // DHL returns label as part of shipment creation
        if (data.imageData) {
          result = { pdf: data.imageData, contentType: 'application/pdf' };
        } else {
          result = { error: 'Label is returned in shipment creation response' };
        }
        break;
      }

      case 'validateCredentials': {
        // Validate by checking account
        const response = await fetch(`${baseUrl}/rates`, {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customerDetails: {
              shipperDetails: {
                postalCode: '1000',
                cityName: 'Sofia',
                countryCode: 'BG',
              },
              receiverDetails: {
                postalCode: '4000',
                cityName: 'Plovdiv',
                countryCode: 'BG',
              },
            },
            plannedShippingDateAndTime: new Date().toISOString(),
            unitOfMeasurement: 'metric',
            isCustomsDeclarable: false,
            packages: [{
              weight: 1,
              dimensions: { length: 20, width: 15, height: 10 },
            }],
          }),
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

    console.log(`DHL ${action} completed:`, result?.error || 'success');

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('DHL API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
