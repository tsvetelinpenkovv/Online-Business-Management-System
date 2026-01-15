import { useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CourierOffice {
  id: string;
  name: string;
  address: string;
  city: string;
  code?: string;
  type?: 'office' | 'locker' | 'apt';
}

export interface CourierCity {
  id: string;
  name: string;
  postCode?: string;
}

export interface CourierCredentials {
  username?: string;
  password?: string;
  client_id?: string;
  client_secret?: string;
  api_key?: string;
  account_number?: string;
  is_test_mode: boolean;
}

export interface ShipmentData {
  sender: {
    name: string;
    phone: string;
    city?: string;
    address?: string;
    officeCode?: string;
  };
  recipient: {
    name: string;
    phone: string;
    email?: string;
    city: string;
    address?: string;
    officeCode?: string;
    siteId?: string;
    streetId?: string;
    streetNo?: string;
  };
  codAmount: number;
  declaredValue?: number;
  weight: number;
  description: string;
  packCount?: number;
  serviceId?: number;
  payerCourier?: 'SENDER' | 'RECIPIENT';
  notes?: string;
  reference?: string;
  payAfterTest?: boolean;
}

export interface CreateShipmentResult {
  success: boolean;
  waybillNumber?: string;
  labelUrl?: string;
  error?: string;
  rawResponse?: unknown;
}

const COURIER_FUNCTION_MAP: Record<string, string> = {
  'econt': 'courier-econt',
  'speedy': 'courier-speedy',
  'box now': 'courier-boxnow',
  'boxnow': 'courier-boxnow',
  'sameday': 'courier-sameday',
  'dhl': 'courier-dhl',
  'evropat': 'courier-evropat',
  'cvc': 'courier-cvc',
};

export const useCourierApi = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [offices, setOffices] = useState<CourierOffice[]>([]);
  const [cities, setCities] = useState<CourierCity[]>([]);

  const getCourierType = useCallback((courierName: string): string | null => {
    const lowerName = courierName.toLowerCase();
    for (const key of Object.keys(COURIER_FUNCTION_MAP)) {
      if (lowerName.includes(key)) {
        return key;
      }
    }
    return null;
  }, []);

  const getFunctionName = useCallback((courierName: string): string | null => {
    const type = getCourierType(courierName);
    return type ? COURIER_FUNCTION_MAP[type] : null;
  }, [getCourierType]);

  const getCredentials = useCallback(async (courierId: string): Promise<CourierCredentials | null> => {
    try {
      const { data, error } = await supabase
        .from('courier_api_settings')
        .select('*')
        .eq('courier_id', courierId)
        .single();

      if (error || !data) return null;

      return {
        username: data.username || undefined,
        password: data.password || undefined,
        client_id: data.client_id || undefined,
        client_secret: data.client_secret || undefined,
        api_key: data.api_key || undefined,
        account_number: (data.extra_config as Record<string, string>)?.account_number,
        is_test_mode: data.is_test_mode ?? true,
      };
    } catch (err) {
      console.error('Error fetching credentials:', err);
      return null;
    }
  }, []);

  const invokeAction = useCallback(async (
    functionName: string,
    action: string,
    credentials: CourierCredentials,
    data?: Record<string, unknown>
  ) => {
    const { data: result, error } = await supabase.functions.invoke(functionName, {
      body: { action, credentials, data },
    });

    if (error) throw error;
    return result;
  }, []);

  const fetchOffices = useCallback(async (
    courierId: string,
    courierName: string,
    cityName?: string
  ): Promise<CourierOffice[]> => {
    setLoading(true);
    try {
      const credentials = await getCredentials(courierId);
      if (!credentials) {
        toast({
          title: 'Грешка',
          description: 'Няма конфигурирани данни за този куриер',
          variant: 'destructive',
        });
        return [];
      }

      const functionName = getFunctionName(courierName);
      if (!functionName) {
        toast({
          title: 'Грешка',
          description: 'Неподдържан куриер',
          variant: 'destructive',
        });
        return [];
      }

      const courierType = getCourierType(courierName);
      let result: unknown;
      const officesList: CourierOffice[] = [];

      switch (courierType) {
        case 'econt': {
          result = await invokeAction(functionName, 'getOffices', credentials, {
            countryCode: 'BGR',
            cityName: cityName,
          });
          const econtOffices = (result as { offices?: Array<{ code: string; name: string; address?: { fullAddress?: string; city?: { name?: string } } }> })?.offices || [];
          econtOffices.forEach((o) => {
            officesList.push({
              id: o.code,
              code: o.code,
              name: o.name,
              address: o.address?.fullAddress || '',
              city: o.address?.city?.name || '',
              type: 'office',
            });
          });
          break;
        }
        case 'speedy': {
          result = await invokeAction(functionName, 'getOffices', credentials, {
            countryId: 100,
            name: cityName,
          });
          const speedyOffices = (result as { offices?: Array<{ id: number; name: string; address?: { fullAddressString?: string; siteName?: string } }> })?.offices || [];
          speedyOffices.forEach((o) => {
            officesList.push({
              id: String(o.id),
              code: String(o.id),
              name: o.name,
              address: o.address?.fullAddressString || '',
              city: o.address?.siteName || '',
              type: 'office',
            });
          });
          break;
        }
        case 'box now':
        case 'boxnow': {
          result = await invokeAction(functionName, 'getDestinations', credentials);
          const boxNowLockers = (result as { destinations?: Array<{ id: string; name: string; address_line_1?: string; city?: string }> })?.destinations || [];
          boxNowLockers.forEach((l) => {
            officesList.push({
              id: l.id,
              code: l.id,
              name: l.name,
              address: l.address_line_1 || '',
              city: l.city || '',
              type: 'locker',
            });
          });
          break;
        }
        case 'sameday': {
          result = await invokeAction(functionName, 'getLockers', credentials, {
            page: 1,
            perPage: 500,
          });
          const samedayLockers = (result as { data?: Array<{ lockerId: number; name: string; address: string; city: { name: string } }> })?.data || [];
          samedayLockers.forEach((l) => {
            officesList.push({
              id: String(l.lockerId),
              code: String(l.lockerId),
              name: l.name,
              address: l.address,
              city: l.city?.name || '',
              type: 'locker',
            });
          });
          break;
        }
        case 'dhl': {
          result = await invokeAction(functionName, 'getServicePoints', credentials, {
            countryCode: 'BG',
            city: cityName,
          });
          const dhlPoints = (result as { servicePoints?: Array<{ id: string; name: string; address?: { addressLine?: string; city?: string } }> })?.servicePoints || [];
          dhlPoints.forEach((sp) => {
            officesList.push({
              id: sp.id,
              code: sp.id,
              name: sp.name,
              address: sp.address?.addressLine || '',
              city: sp.address?.city || '',
              type: 'office',
            });
          });
          break;
        }
        case 'evropat': {
          result = await invokeAction(functionName, 'getOffices', credentials);
          const evropatOffices = (result as { offices?: Array<{ id: string; name: string; address?: string; city?: string }> })?.offices || [];
          evropatOffices.forEach((o) => {
            officesList.push({
              id: o.id,
              code: o.id,
              name: o.name,
              address: o.address || '',
              city: o.city || '',
              type: 'office',
            });
          });
          break;
        }
      }

      setOffices(officesList);
      return officesList;
    } catch (err) {
      console.error('Error fetching offices:', err);
      toast({
        title: 'Грешка',
        description: 'Неуспешно зареждане на офиси',
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [getCredentials, getFunctionName, getCourierType, invokeAction, toast]);

  const fetchCities = useCallback(async (
    courierId: string,
    courierName: string,
    searchTerm?: string
  ): Promise<CourierCity[]> => {
    setLoading(true);
    try {
      const credentials = await getCredentials(courierId);
      if (!credentials) return [];

      const functionName = getFunctionName(courierName);
      if (!functionName) return [];

      const courierType = getCourierType(courierName);
      let result: unknown;
      const citiesList: CourierCity[] = [];

      switch (courierType) {
        case 'econt': {
          result = await invokeAction(functionName, 'getCities', credentials, {
            countryCode: 'BGR',
            name: searchTerm,
          });
          const econtCities = (result as { cities?: Array<{ id: number; name: string; postCode?: string }> })?.cities || [];
          econtCities.forEach((c) => {
            citiesList.push({
              id: String(c.id),
              name: c.name,
              postCode: c.postCode,
            });
          });
          break;
        }
        case 'speedy': {
          result = await invokeAction(functionName, 'getSites', credentials, {
            countryId: 100,
            name: searchTerm,
          });
          const speedySites = (result as { sites?: Array<{ id: number; name: string; postCode?: string }> })?.sites || [];
          speedySites.forEach((s) => {
            citiesList.push({
              id: String(s.id),
              name: s.name,
              postCode: s.postCode,
            });
          });
          break;
        }
        case 'sameday': {
          result = await invokeAction(functionName, 'getCities', credentials, {
            name: searchTerm,
          });
          const samedayCities = (result as { data?: Array<{ id: number; name: string }> })?.data || [];
          samedayCities.forEach((c) => {
            citiesList.push({
              id: String(c.id),
              name: c.name,
            });
          });
          break;
        }
        case 'evropat': {
          result = await invokeAction(functionName, 'getCities', credentials);
          const evropatCities = (result as { cities?: Array<{ id: string; name: string }> })?.cities || [];
          evropatCities.forEach((c) => {
            citiesList.push({
              id: c.id,
              name: c.name,
            });
          });
          break;
        }
      }

      setCities(citiesList);
      return citiesList;
    } catch (err) {
      console.error('Error fetching cities:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [getCredentials, getFunctionName, getCourierType, invokeAction]);

  const createShipment = useCallback(async (
    courierId: string,
    courierName: string,
    shipmentData: ShipmentData
  ): Promise<CreateShipmentResult> => {
    setLoading(true);
    try {
      const credentials = await getCredentials(courierId);
      if (!credentials) {
        return { success: false, error: 'Няма конфигурирани данни за този куриер' };
      }

      const functionName = getFunctionName(courierName);
      if (!functionName) {
        return { success: false, error: 'Неподдържан куриер' };
      }

      const courierType = getCourierType(courierName);
      let result: unknown;

      switch (courierType) {
        case 'econt': {
          result = await invokeAction(functionName, 'createLabel', credentials, {
            sender: {
              name: shipmentData.sender.name,
              phone: shipmentData.sender.phone,
              city: shipmentData.sender.city,
              street: shipmentData.sender.address,
              officeCode: shipmentData.sender.officeCode,
            },
            recipient: {
              name: shipmentData.recipient.name,
              phone: shipmentData.recipient.phone,
              city: shipmentData.recipient.city,
              street: shipmentData.recipient.address,
              officeCode: shipmentData.recipient.officeCode,
            },
            codAmount: shipmentData.codAmount,
            declaredValue: shipmentData.declaredValue,
            weight: shipmentData.weight,
            description: shipmentData.description,
            packCount: shipmentData.packCount || 1,
            notes: shipmentData.notes,
            payAfterTest: shipmentData.payAfterTest,
          });
          const econtResult = result as { label?: { shipmentNumber?: string }; error?: string };
          if (econtResult?.label?.shipmentNumber) {
            return {
              success: true,
              waybillNumber: econtResult.label.shipmentNumber,
              rawResponse: result,
            };
          }
          return { success: false, error: econtResult?.error || 'Грешка при създаване', rawResponse: result };
        }

        case 'speedy': {
          result = await invokeAction(functionName, 'createShipment', credentials, {
            sender: {
              clientId: shipmentData.sender.officeCode, // Speedy uses client ID
              name: shipmentData.sender.name,
              phone: shipmentData.sender.phone,
            },
            recipient: {
              name: shipmentData.recipient.name,
              phone: shipmentData.recipient.phone,
              email: shipmentData.recipient.email,
              officeId: shipmentData.recipient.officeCode,
              siteId: shipmentData.recipient.siteId,
              streetId: shipmentData.recipient.streetId,
              streetNo: shipmentData.recipient.streetNo,
            },
            codAmount: shipmentData.codAmount,
            declaredValue: shipmentData.declaredValue,
            weight: shipmentData.weight,
            description: shipmentData.description,
            parcelsCount: shipmentData.packCount || 1,
            serviceId: shipmentData.serviceId || 505,
            payerCourier: shipmentData.payerCourier || 'SENDER',
            reference: shipmentData.reference,
            payAfterTest: shipmentData.payAfterTest,
          });
          const speedyResult = result as { id?: number; parcels?: Array<{ id: number }>; error?: { message?: string } };
          if (speedyResult?.id) {
            return {
              success: true,
              waybillNumber: String(speedyResult.id),
              rawResponse: result,
            };
          }
          return { success: false, error: speedyResult?.error?.message || 'Грешка при създаване', rawResponse: result };
        }

        case 'box now':
        case 'boxnow': {
          result = await invokeAction(functionName, 'createDelivery', credentials, {
            sender: {
              name: shipmentData.sender.name,
              phone: shipmentData.sender.phone,
            },
            recipient: {
              name: shipmentData.recipient.name,
              phone: shipmentData.recipient.phone,
              email: shipmentData.recipient.email,
            },
            destinationLockerId: shipmentData.recipient.officeCode,
            codAmount: shipmentData.codAmount,
            items: [{ description: shipmentData.description, quantity: 1, value: shipmentData.declaredValue || 0 }],
          });
          const boxResult = result as { order_id?: string; parcel_id?: string; error?: string };
          if (boxResult?.parcel_id || boxResult?.order_id) {
            return {
              success: true,
              waybillNumber: boxResult.parcel_id || boxResult.order_id,
              rawResponse: result,
            };
          }
          return { success: false, error: boxResult?.error || 'Грешка при създаване', rawResponse: result };
        }

        case 'sameday': {
          result = await invokeAction(functionName, 'createAwb', credentials, {
            sender: {
              name: shipmentData.sender.name,
              phone: shipmentData.sender.phone,
              city: shipmentData.sender.city,
              address: shipmentData.sender.address,
            },
            recipient: {
              name: shipmentData.recipient.name,
              phone: shipmentData.recipient.phone,
              email: shipmentData.recipient.email,
              city: shipmentData.recipient.city,
              address: shipmentData.recipient.address,
              lockerId: shipmentData.recipient.officeCode,
            },
            codAmount: shipmentData.codAmount,
            weight: shipmentData.weight,
            description: shipmentData.description,
            observation: shipmentData.notes,
          });
          const samedayResult = result as { awbNumber?: string; error?: { message?: string } };
          if (samedayResult?.awbNumber) {
            return {
              success: true,
              waybillNumber: samedayResult.awbNumber,
              rawResponse: result,
            };
          }
          return { success: false, error: samedayResult?.error?.message || 'Грешка при създаване', rawResponse: result };
        }

        case 'dhl': {
          result = await invokeAction(functionName, 'createShipment', credentials, {
            sender: {
              name: shipmentData.sender.name,
              phone: shipmentData.sender.phone,
              city: shipmentData.sender.city,
              address: shipmentData.sender.address,
              countryCode: 'BG',
            },
            recipient: {
              name: shipmentData.recipient.name,
              phone: shipmentData.recipient.phone,
              email: shipmentData.recipient.email,
              city: shipmentData.recipient.city,
              address: shipmentData.recipient.address,
              countryCode: 'BG',
            },
            weight: shipmentData.weight,
            description: shipmentData.description,
            declaredValue: shipmentData.declaredValue,
          });
          const dhlResult = result as { shipmentTrackingNumber?: string; packages?: Array<{ trackingNumber: string }>; error?: string };
          if (dhlResult?.shipmentTrackingNumber || dhlResult?.packages?.[0]?.trackingNumber) {
            return {
              success: true,
              waybillNumber: dhlResult.shipmentTrackingNumber || dhlResult.packages?.[0]?.trackingNumber,
              rawResponse: result,
            };
          }
          return { success: false, error: dhlResult?.error || 'Грешка при създаване', rawResponse: result };
        }

        case 'evropat': {
          result = await invokeAction(functionName, 'createShipment', credentials, {
            sender: {
              name: shipmentData.sender.name,
              phone: shipmentData.sender.phone,
              city: shipmentData.sender.city,
              address: shipmentData.sender.address,
            },
            recipient: {
              name: shipmentData.recipient.name,
              phone: shipmentData.recipient.phone,
              city: shipmentData.recipient.city,
              address: shipmentData.recipient.address,
              officeId: shipmentData.recipient.officeCode,
            },
            codAmount: shipmentData.codAmount,
            weight: shipmentData.weight,
            description: shipmentData.description,
          });
          const evropatResult = result as { waybill_number?: string; error?: string };
          if (evropatResult?.waybill_number) {
            return {
              success: true,
              waybillNumber: evropatResult.waybill_number,
              rawResponse: result,
            };
          }
          return { success: false, error: evropatResult?.error || 'Грешка при създаване', rawResponse: result };
        }

        default:
          return { success: false, error: 'Неподдържан куриер' };
      }
    } catch (err) {
      console.error('Error creating shipment:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Неизвестна грешка' };
    } finally {
      setLoading(false);
    }
  }, [getCredentials, getFunctionName, getCourierType, invokeAction]);

  const getLabel = useCallback(async (
    courierId: string,
    courierName: string,
    waybillNumber: string
  ): Promise<{ success: boolean; labelUrl?: string; error?: string }> => {
    setLoading(true);
    try {
      const credentials = await getCredentials(courierId);
      if (!credentials) {
        return { success: false, error: 'Няма конфигурирани данни за този куриер' };
      }

      const functionName = getFunctionName(courierName);
      if (!functionName) {
        return { success: false, error: 'Неподдържан куриер' };
      }

      const courierType = getCourierType(courierName);
      let result: unknown;

      switch (courierType) {
        case 'econt':
          result = await invokeAction(functionName, 'getLabel', credentials, { waybillNumber });
          break;
        case 'speedy':
          result = await invokeAction(functionName, 'print', credentials, { shipmentId: waybillNumber });
          break;
        case 'sameday':
          result = await invokeAction(functionName, 'getAwbPdf', credentials, { awbNumber: waybillNumber });
          break;
        case 'dhl':
          result = await invokeAction(functionName, 'getLabel', credentials, { shipmentId: waybillNumber });
          break;
        case 'box now':
        case 'boxnow':
          result = await invokeAction(functionName, 'getLabel', credentials, { parcelId: waybillNumber });
          break;
        case 'evropat':
          result = await invokeAction(functionName, 'getLabel', credentials, { waybillNumber });
          break;
      }

      const labelResult = result as { pdf?: string; labelUrl?: string; label?: string; error?: string };
      const labelUrl = labelResult?.pdf || labelResult?.labelUrl || labelResult?.label;
      
      if (labelUrl) {
        return { success: true, labelUrl };
      }
      return { success: false, error: labelResult?.error || 'Грешка при генериране на етикет' };
    } catch (err) {
      console.error('Error getting label:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Неизвестна грешка' };
    } finally {
      setLoading(false);
    }
  }, [getCredentials, getFunctionName, getCourierType, invokeAction]);

  return useMemo(() => ({
    loading,
    offices,
    cities,
    fetchOffices,
    fetchCities,
    createShipment,
    getLabel,
    getCourierType,
    getFunctionName,
  }), [loading, offices, cities, fetchOffices, fetchCities, createShipment, getLabel, getCourierType, getFunctionName]);
};
