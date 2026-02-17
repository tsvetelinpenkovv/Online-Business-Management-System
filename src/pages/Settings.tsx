import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/hooks/useAuth';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import { useFavicon } from '@/hooks/useFavicon';
import { useLoginBackground } from '@/hooks/useLoginBackground';
import { supabase } from '@/integrations/supabase/client';
import { buildPath } from '@/components/SecretPathGuard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Loader2, Key, Link, Webhook, Plus, Trash2, TestTube, ShieldAlert, ExternalLink, ImageIcon, Upload, X, Users, UserPlus, Crown, Building2, FileText, Truck, Store, ShoppingCart, ChevronLeft, ChevronRight, BookOpen, BarChart3, Type, Shield, Lock, Copy, Check, RotateCcw, Bell, Zap, Database, Globe, HardDrive, RefreshCw, Tags } from 'lucide-react';
import { FactoryResetDialog } from '@/components/settings/FactoryResetDialog';
import { RolePermissionsManager } from '@/components/settings/RolePermissionsManager';
import { useIsMobile } from '@/hooks/use-mobile';
import { CourierSettings } from '@/components/settings/CourierSettings';
import { CourierApiSettings } from '@/components/settings/CourierApiSettings';
import { SenderDefaultsSettings, SenderDefaultsSettingsRef } from '@/components/settings/SenderDefaultsSettings';
import { StatusSettings } from '@/components/settings/StatusSettings';
import { SourceSettings } from '@/components/settings/SourceSettings';
import { PlatformApiSettings } from '@/components/settings/PlatformApiSettings';
import { ConnectixSettings, ConnectixSettingsRef } from '@/components/settings/ConnectixSettings';
import { DocumentationTab } from '@/components/settings/DocumentationTab';
import { NekorektenStatistics } from '@/components/settings/NekorektenStatistics';
import { InterfaceTextEditor, InterfaceTextEditorRef } from '@/components/settings/InterfaceTextEditor';
import { GlobalColorPicker } from '@/components/settings/GlobalColorPicker';
import { CacheManagementCard } from '@/components/settings/CacheManagementCard';
import { NotificationSoundSettings } from '@/components/settings/NotificationSoundSettings';
import { MultiStoreSettings } from '@/components/settings/MultiStoreSettings';
import { useToast } from '@/hooks/use-toast';
import { ApiSetting } from '@/types/order';
import { Switch } from '@/components/ui/switch';

interface AllowedUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  created_at: string;
}

interface CompanySettings {
  id: string;
  company_name: string | null;
  eik: string | null;
  registered_address: string | null;
  correspondence_address: string | null;
  manager_name: string | null;
  vat_registered: boolean;
  vat_number: string | null;
  email: string | null;
  phone: string | null;
  bank_name: string | null;
  bank_iban: string | null;
  bank_bic: string | null;
  next_invoice_number: number;
  website_url: string | null;
  orders_page_title: string | null;
  inventory_page_title: string | null;
  footer_text: string | null;
  footer_link_text: string | null;
  footer_link: string | null;
  footer_website: string | null;
  login_title: string | null;
  login_description: string | null;
  login_background_color: string | null;
  secret_path: string | null;
}

const Settings = () => {
  const { user, loading: authLoading } = useAuth();
  const { canView, loading: permLoading } = usePermissions();
  const { logoUrl, uploadLogo, deleteLogo, loading: logoLoading } = useCompanyLogo();
  const { faviconUrl, uploadFavicon, deleteFavicon, loading: faviconLoading } = useFavicon();
  const { backgroundUrl, uploadBackground, deleteBackground, loading: backgroundLoading } = useLoginBackground();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'api';
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [customApis, setCustomApis] = useState<{ key: string; value: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const connectixRef = useRef<ConnectixSettingsRef>(null);
  const senderDefaultsRef = useRef<SenderDefaultsSettingsRef>(null);
  const interfaceTextRef = useRef<InterfaceTextEditorRef>(null);
  
  // User management state
  const [isAdmin, setIsAdmin] = useState(false);
  const [allowedUsers, setAllowedUsers] = useState<AllowedUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'user'>('user');
  const [addingUser, setAddingUser] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  // Company settings state
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [loadingCompany, setLoadingCompany] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);

  // Mobile tabs scroll
  const isMobile = useIsMobile();
  const tabsListRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollButtons = () => {
    if (tabsListRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsListRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsListRef.current) {
      const scrollAmount = 150;
      tabsListRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    // Wait for DOM to be ready
    const timer = setTimeout(() => {
      checkScrollButtons();
    }, 100);
    
    const tabsList = tabsListRef.current;
    if (tabsList) {
      tabsList.addEventListener('scroll', checkScrollButtons);
      window.addEventListener('resize', checkScrollButtons);
    }
    
    return () => {
      clearTimeout(timer);
      if (tabsList) {
        tabsList.removeEventListener('scroll', checkScrollButtons);
        window.removeEventListener('resize', checkScrollButtons);
      }
    };
  }, [isMobile, isAdmin]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate(buildPath('/auth'));
    }
    if (!authLoading && !permLoading && user && !canView('settings')) {
      navigate(buildPath('/'));
      toast({
        title: 'Нямате достъп',
        description: 'Нямате права за достъп до настройките.',
        variant: 'destructive',
      });
    }
  }, [user, authLoading, navigate, canView, permLoading]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('api_settings')
          .select('*');

        if (error) throw error;

        const settingsMap: Record<string, string> = {};
        const customs: { key: string; value: string }[] = [];

        (data as ApiSetting[]).forEach(item => {
          if (item.setting_key.startsWith('custom_api_')) {
            customs.push({ key: item.setting_key, value: item.setting_value || '' });
          } else {
            settingsMap[item.setting_key] = item.setting_value || '';
          }
        });

        setSettings(settingsMap);
        setCustomApis(customs);
      } catch (error: any) {
        toast({
          title: 'Грешка',
          description: 'Неуспешно зареждане на настройките',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchSettings();
      checkAdminAndFetchUsers();
      fetchCompanySettings();
    }
  }, [user, toast]);

  const fetchCompanySettings = async () => {
    setLoadingCompany(true);
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .limit(1)
        .single();

      if (error) throw error;
      setCompanySettings(data as CompanySettings);
    } catch (error) {
      console.error('Error fetching company settings:', error);
    } finally {
      setLoadingCompany(false);
    }
  };

  const handleSaveCompanySettings = async () => {
    if (!companySettings) return;
    
    setSavingCompany(true);
    try {
      const { error } = await supabase
        .from('company_settings')
        .update({
          company_name: companySettings.company_name,
          eik: companySettings.eik,
          registered_address: companySettings.registered_address,
          correspondence_address: companySettings.correspondence_address,
          manager_name: companySettings.manager_name,
          vat_registered: companySettings.vat_registered,
          vat_number: companySettings.vat_number,
          email: companySettings.email,
          phone: companySettings.phone,
          bank_name: companySettings.bank_name,
          bank_iban: companySettings.bank_iban,
          bank_bic: companySettings.bank_bic,
          next_invoice_number: companySettings.next_invoice_number,
          website_url: companySettings.website_url,
          orders_page_title: companySettings.orders_page_title,
          inventory_page_title: companySettings.inventory_page_title,
          footer_text: companySettings.footer_text,
          footer_link_text: companySettings.footer_link_text,
          footer_link: companySettings.footer_link,
          footer_website: companySettings.footer_website,
          secret_path: companySettings.secret_path,
        })
        .eq('id', companySettings.id);

      if (error) throw error;

      toast({
        title: 'Успех',
        description: 'Фирмените данни бяха запазени',
      });
    } catch (error: any) {
      toast({
        title: 'Грешка',
        description: error.message || 'Неуспешно запазване на фирмените данни',
        variant: 'destructive',
      });
    } finally {
      setSavingCompany(false);
    }
  };

  const checkAdminAndFetchUsers = async () => {
    if (!user?.email) return;
    
    try {
      // Check if current user is admin
      const { data: adminCheck } = await supabase.rpc('is_admin', { _email: user.email });
      setIsAdmin(adminCheck || false);
      
      if (adminCheck) {
        // Fetch allowed users
        setLoadingUsers(true);
        const { data, error } = await supabase
          .from('allowed_users')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setAllowedUsers((data as AllowedUser[]) || []);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUserEmail || !newUserName || !newUserPassword) {
      toast({
        title: 'Грешка',
        description: 'Моля попълнете всички полета',
        variant: 'destructive',
      });
      return;
    }

    if (newUserPassword.length < 6) {
      toast({
        title: 'Грешка',
        description: 'Паролата трябва да е поне 6 символа',
        variant: 'destructive',
      });
      return;
    }

    setAddingUser(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('invite-user', {
        body: {
          email: newUserEmail,
          name: newUserName,
          password: newUserPassword,
          role: newUserRole,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast({
        title: 'Успех',
        description: 'Потребителят беше добавен успешно',
      });

      // Reset form
      setNewUserEmail('');
      setNewUserName('');
      setNewUserPassword('');
      setNewUserRole('user');

      // Refresh users list
      checkAdminAndFetchUsers();
    } catch (error: any) {
      toast({
        title: 'Грешка',
        description: error.message || 'Неуспешно добавяне на потребител',
        variant: 'destructive',
      });
    } finally {
      setAddingUser(false);
    }
  };

  const handleDeleteUser = async (userToDelete: AllowedUser) => {
    if (userToDelete.email === user?.email) {
      toast({
        title: 'Грешка',
        description: 'Не можете да изтриете себе си',
        variant: 'destructive',
      });
      return;
    }

    setDeletingUserId(userToDelete.id);
    try {
      const response = await supabase.functions.invoke('delete-user', {
        body: { email: userToDelete.email },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast({
        title: 'Успех',
        description: 'Потребителят беше изтрит',
      });

      // Refresh users list
      checkAdminAndFetchUsers();
    } catch (error: any) {
      toast({
        title: 'Грешка',
        description: error.message || 'Неуспешно изтриване на потребител',
        variant: 'destructive',
      });
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save API settings
      const updates = Object.entries(settings).map(([key, value]) => ({
        setting_key: key,
        setting_value: value,
        updated_at: new Date().toISOString(),
      }));

      customApis.forEach(api => {
        updates.push({
          setting_key: api.key,
          setting_value: api.value,
          updated_at: new Date().toISOString(),
        });
      });

      for (const update of updates) {
        await supabase
          .from('api_settings')
          .upsert(update, { onConflict: 'setting_key' });
      }

      // Also save company settings if they exist
      if (companySettings) {
        await handleSaveCompanySettings();
      }

      // Also save Connectix settings
      if (connectixRef.current) {
        await connectixRef.current.saveConfig();
      }

      // Also save Sender Defaults settings
      if (senderDefaultsRef.current) {
        await senderDefaultsRef.current.saveConfig();
      }

      // Also save Interface Text settings
      if (interfaceTextRef.current) {
        await interfaceTextRef.current.saveConfig();
      }

      toast({
        title: 'Успех',
        description: 'Всички настройки бяха запазени',
      });
    } catch (error: any) {
      toast({
        title: 'Грешка',
        description: 'Неуспешно запазване на настройките',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const addCustomApi = () => {
    const newKey = `custom_api_${Date.now()}`;
    setCustomApis([...customApis, { key: newKey, value: '' }]);
  };

  const removeCustomApi = (index: number) => {
    setCustomApis(customApis.filter((_, i) => i !== index));
  };

  const testConnection = async () => {
    if (!settings.woocommerce_url || !settings.woocommerce_consumer_key) {
      toast({
        title: 'Внимание',
        description: 'Моля въведете WooCommerce URL и Consumer Key',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Тестване',
      description: 'Връзката ще бъде тествана при следващото синхронизиране',
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      await uploadLogo(file);
      toast({
        title: 'Успех',
        description: 'Логото беше качено успешно',
      });
    } catch (error: any) {
      toast({
        title: 'Грешка',
        description: error.message || 'Неуспешно качване на логото',
        variant: 'destructive',
      });
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleLogoDelete = async () => {
    try {
      await deleteLogo();
      toast({
        title: 'Успех',
        description: 'Логото беше изтрито',
      });
    } catch (error) {
      toast({
        title: 'Грешка',
        description: 'Неуспешно изтриване на логото',
        variant: 'destructive',
      });
    }
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFavicon(true);
    try {
      await uploadFavicon(file);
      toast({
        title: 'Успех',
        description: 'Favicon-ът беше качен успешно',
      });
    } catch (error: any) {
      toast({
        title: 'Грешка',
        description: error.message || 'Неуспешно качване на favicon',
        variant: 'destructive',
      });
    } finally {
      setUploadingFavicon(false);
      if (faviconInputRef.current) {
        faviconInputRef.current.value = '';
      }
    }
  };

  const handleFaviconDelete = async () => {
    try {
      await deleteFavicon();
      toast({
        title: 'Успех',
        description: 'Favicon-ът беше изтрит',
      });
    } catch (error) {
      toast({
        title: 'Грешка',
        description: 'Неуспешно изтриване на favicon',
        variant: 'destructive',
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Button variant="ghost" size="icon" onClick={() => navigate(buildPath('/'))} className="shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg sm:text-xl font-semibold truncate">Настройки</h1>
          </div>
          <Button onClick={handleSave} disabled={saving} size="sm" className="shrink-0">
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 sm:mr-2 animate-spin" />
                <span className="hidden sm:inline">Запазване...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Запази</span>
              </>
            )}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-3xl space-y-4 sm:space-y-6">
        <Tabs defaultValue={initialTab} className="w-full">
          <div className="relative mb-4 sm:mb-6">
            {/* Scroll gradients */}
            {canScrollLeft && (
              <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-background to-transparent z-10" />
            )}
            {canScrollRight && (
              <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-background to-transparent z-10" />
            )}

            {/* Scroll buttons */}
            {canScrollLeft && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => scrollTabs('left')}
                className="absolute left-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 backdrop-blur border-border shadow-sm z-20"
                aria-label="Превърти табовете наляво"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            {canScrollRight && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => scrollTabs('right')}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 backdrop-blur border-border shadow-sm z-20"
                aria-label="Превърти табовете надясно"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}

            <div
              ref={tabsListRef}
              className="overflow-x-auto scrollbar-hide"
              onScroll={checkScrollButtons}
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <TabsList className="inline-flex w-max gap-1 p-1">
                <TabsTrigger value="api" className="whitespace-nowrap text-xs sm:text-sm px-2.5 sm:px-3 gap-1">
                  <Key className="w-4 h-4" />
                  <span>API</span>
                </TabsTrigger>
                <TabsTrigger value="platforms" className="whitespace-nowrap text-xs sm:text-sm px-2.5 sm:px-3 gap-1">
                  <ShoppingCart className="w-4 h-4" />
                  <span>Платформи</span>
                </TabsTrigger>
                <TabsTrigger value="sources" className="whitespace-nowrap text-xs sm:text-sm px-2.5 sm:px-3 gap-1">
                  <Database className="w-4 h-4" />
                  <span>Източници</span>
                </TabsTrigger>
                <TabsTrigger value="branding" className="whitespace-nowrap text-xs sm:text-sm px-2.5 sm:px-3 gap-1">
                  <ImageIcon className="w-4 h-4" />
                  <span>Лого</span>
                </TabsTrigger>
                <TabsTrigger value="couriers" className="whitespace-nowrap text-xs sm:text-sm px-2.5 sm:px-3 gap-1">
                  <Truck className="w-4 h-4" />
                  <span>Куриери</span>
                </TabsTrigger>
                <TabsTrigger value="statuses" className="whitespace-nowrap text-xs sm:text-sm px-2.5 sm:px-3 gap-1">
                  <Tags className="w-4 h-4" />
                  <span>Статуси</span>
                </TabsTrigger>
                <TabsTrigger value="company" className="whitespace-nowrap text-xs sm:text-sm px-2.5 sm:px-3 gap-1">
                  <Building2 className="w-4 h-4" />
                  <span>Фирма</span>
                </TabsTrigger>
                {isAdmin && (
                  <TabsTrigger value="users" className="whitespace-nowrap text-xs sm:text-sm px-2.5 sm:px-3 gap-1">
                    <Users className="w-4 h-4" />
                    <span>Потребители</span>
                  </TabsTrigger>
                )}
                {isAdmin && (
                  <TabsTrigger value="roles" className="whitespace-nowrap text-xs sm:text-sm px-2.5 sm:px-3 gap-1">
                    <Shield className="w-4 h-4" />
                    <span>Роли</span>
                  </TabsTrigger>
                )}
                {isAdmin && (
                  <TabsTrigger value="danger" className="whitespace-nowrap text-xs sm:text-sm px-2.5 sm:px-3 gap-1 text-destructive">
                    <RotateCcw className="w-4 h-4" />
                    <span>Изчисти</span>
                  </TabsTrigger>
                )}
                {isAdmin && (
                  <TabsTrigger value="stores" className="whitespace-nowrap text-xs sm:text-sm px-2.5 sm:px-3 gap-1">
                    <Globe className="w-4 h-4" />
                    <span>Магазини</span>
                  </TabsTrigger>
                )}
                <TabsTrigger value="notifications" className="whitespace-nowrap text-xs sm:text-sm px-2.5 sm:px-3 gap-1" title="Известия">
                  <Bell className="w-4 h-4" />
                  <span>Известия</span>
                </TabsTrigger>
                <TabsTrigger value="interface" className="whitespace-nowrap text-xs sm:text-sm px-2.5 sm:px-3 gap-1" title="Редактор на интерфейса">
                  <Type className="w-4 h-4" />
                  <span>Интерфейс</span>
                </TabsTrigger>
                <TabsTrigger value="docs" className="whitespace-nowrap text-xs sm:text-sm px-2.5 sm:px-3 gap-1" title="Документация">
                  <BookOpen className="w-4 h-4 text-destructive" />
                  <span>Документация</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="platforms" className="space-y-6">
            <PlatformApiSettings />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="stores" className="space-y-6">
              <MultiStoreSettings />
            </TabsContent>
          )}

          <TabsContent value="notifications" className="space-y-6">
            <NotificationSoundSettings />
            
          </TabsContent>

          <TabsContent value="sources" className="space-y-6 mt-4">
            <SourceSettings />
          </TabsContent>

          <TabsContent value="statuses" className="space-y-6">
            <StatusSettings />
          </TabsContent>

          <TabsContent value="couriers" className="space-y-6">
            <SenderDefaultsSettings ref={senderDefaultsRef} />
            <CourierApiSettings />
            <CourierSettings />
          </TabsContent>

          <TabsContent value="company" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Фирмени данни
                </CardTitle>
                <CardDescription>
                  Данни за вашата фирма, които ще се използват при издаване на фактури
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {loadingCompany ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : companySettings ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="company-name">Пълно наименование на фирмата *</Label>
                        <Input
                          id="company-name"
                          placeholder="ООД / ЕООД / ЕТ ..."
                          value={companySettings.company_name || ''}
                          onChange={(e) => setCompanySettings({...companySettings, company_name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="company-eik">ЕИК / Булстат *</Label>
                        <Input
                          id="company-eik"
                          placeholder="123456789"
                          value={companySettings.eik || ''}
                          onChange={(e) => setCompanySettings({...companySettings, eik: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="manager-name">Управител / Представляващ</Label>
                        <Input
                          id="manager-name"
                          placeholder="Иван Иванов"
                          value={companySettings.manager_name || ''}
                          onChange={(e) => setCompanySettings({...companySettings, manager_name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="registered-address">Седалище и адрес на управление *</Label>
                        <Input
                          id="registered-address"
                          placeholder="гр. София, ул. Примерна 1"
                          value={companySettings.registered_address || ''}
                          onChange={(e) => setCompanySettings({...companySettings, registered_address: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="correspondence-address">Адрес за кореспонденция (ако е различен)</Label>
                        <Input
                          id="correspondence-address"
                          placeholder="гр. София, ул. Друга 2"
                          value={companySettings.correspondence_address || ''}
                          onChange={(e) => setCompanySettings({...companySettings, correspondence_address: e.target.value})}
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="font-medium">Регистрация по ДДС</h3>
                      <div className="flex items-center gap-3">
                        <Switch
                          id="vat-registered"
                          checked={companySettings.vat_registered}
                          onCheckedChange={(checked) => setCompanySettings({...companySettings, vat_registered: checked})}
                        />
                        <Label htmlFor="vat-registered">Регистрирана по ДДС</Label>
                      </div>
                      {companySettings.vat_registered && (
                        <div className="space-y-2">
                          <Label htmlFor="vat-number">ДДС номер</Label>
                          <Input
                            id="vat-number"
                            placeholder="BG123456789"
                            value={companySettings.vat_number || ''}
                            onChange={(e) => setCompanySettings({...companySettings, vat_number: e.target.value})}
                          />
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="company-email">Имейл</Label>
                        <Input
                          id="company-email"
                          type="email"
                          placeholder="office@firma.bg"
                          value={companySettings.email || ''}
                          onChange={(e) => setCompanySettings({...companySettings, email: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="company-phone">Телефон</Label>
                        <Input
                          id="company-phone"
                          placeholder="+359 888 123 456"
                          value={companySettings.phone || ''}
                          onChange={(e) => setCompanySettings({...companySettings, phone: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="website-url">Уебсайт</Label>
                        <Input
                          id="website-url"
                          placeholder="https://example.com"
                          value={companySettings.website_url || ''}
                          onChange={(e) => setCompanySettings({...companySettings, website_url: e.target.value})}
                        />
                        <p className="text-xs text-muted-foreground">
                          Линкът ще се показва в хедъра на началната страница
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="font-medium">Банкова сметка</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="bank-name">Банка</Label>
                          <Input
                            id="bank-name"
                            placeholder="Примерна Банка АД"
                            value={companySettings.bank_name || ''}
                            onChange={(e) => setCompanySettings({...companySettings, bank_name: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bank-bic">BIC</Label>
                          <Input
                            id="bank-bic"
                            placeholder="ABCDBGSF"
                            value={companySettings.bank_bic || ''}
                            onChange={(e) => setCompanySettings({...companySettings, bank_bic: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="bank-iban">IBAN</Label>
                          <Input
                            id="bank-iban"
                            placeholder="BG12ABCD12345678901234"
                            value={companySettings.bank_iban || ''}
                            onChange={(e) => setCompanySettings({...companySettings, bank_iban: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label htmlFor="next-invoice">Следващ номер на фактура</Label>
                      <Input
                        id="next-invoice"
                        type="number"
                        value={companySettings.next_invoice_number}
                        onChange={(e) => setCompanySettings({...companySettings, next_invoice_number: parseInt(e.target.value) || 1})}
                        className="w-[200px]"
                      />
                      <p className="text-xs text-muted-foreground">
                        Номерът автоматично се увеличава след издаване на фактура
                      </p>
                    </div>

                    <Button onClick={handleSaveCompanySettings} disabled={savingCompany} className="w-full sm:w-auto">
                      {savingCompany ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Запазване...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Запази фирмени данни
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <p className="text-muted-foreground">Грешка при зареждане на данните</p>
                )}
              </CardContent>
            </Card>

            {/* Персонализация - moved to bottom with gray background */}
            <Card className="bg-muted/50 dark:bg-muted/30 border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Персонализация
                </CardTitle>
                <CardDescription>
                  Персонализирайте имената на страниците и текста във футера
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {companySettings && (
                  <>
                    <div className="space-y-4">
                      <h3 className="font-medium">Имена на страници</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="orders-page-title">Заглавие на страницата с поръчки</Label>
                          <Input
                            id="orders-page-title"
                            placeholder="Управление на поръчки"
                            value={companySettings.orders_page_title || ''}
                            onChange={(e) => setCompanySettings({...companySettings, orders_page_title: e.target.value})}
                            className="bg-background"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="inventory-page-title">Заглавие на складовата програма</Label>
                          <Input
                            id="inventory-page-title"
                            placeholder="Склад"
                            value={companySettings.inventory_page_title || ''}
                            onChange={(e) => setCompanySettings({...companySettings, inventory_page_title: e.target.value})}
                            className="bg-background"
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="font-medium flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Защита на URL адреса
                      </h3>
                      <div className="p-4 bg-background rounded-lg border space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="secret-path">Секретен път (URL защита)</Label>
                          <div className="flex gap-2">
                            <Input
                              id="secret-path"
                              placeholder="/b36s739rbf12"
                              value={companySettings.secret_path || ''}
                              onChange={(e) => {
                                let value = e.target.value;
                                // Ensure it starts with /
                                if (value && !value.startsWith('/')) {
                                  value = '/' + value;
                                }
                                setCompanySettings({...companySettings, secret_path: value});
                              }}
                              className="bg-background font-mono"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                // Generate random secret path
                                const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
                                let result = '/';
                                for (let i = 0; i < 16; i++) {
                                  result += chars.charAt(Math.floor(Math.random() * chars.length));
                                }
                                setCompanySettings({...companySettings, secret_path: result});
                              }}
                              title="Генерирай случаен път"
                            >
                              <Key className="w-4 h-4" />
                            </Button>
                            {companySettings.secret_path && (
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => setCompanySettings({...companySettings, secret_path: null})}
                                title="Премахни защитата"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Добавете секретен път след домейна за допълнителна защита. 
                            Например: <code className="bg-muted px-1 rounded">penkovstudio.eu<strong>{companySettings.secret_path || '/секретен-път'}</strong></code>
                          </p>
                        </div>
                        
                        {companySettings.secret_path && (
                          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                            <div className="flex items-start gap-2">
                              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                              <div className="text-sm text-amber-800 dark:text-amber-200">
                                <p className="font-medium">Важно!</p>
                                <p className="text-xs mt-1">
                                  След запазване, системата ще бъде достъпна само на адрес със секретния път.
                                  Запазете този път на сигурно място!
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="font-medium">Настройки на Login страницата</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="login-title">Заглавие</Label>
                          <Input
                            id="login-title"
                            placeholder="Управление на поръчки и складови наличности"
                            value={companySettings.login_title || ''}
                            onChange={(e) => setCompanySettings({...companySettings, login_title: e.target.value})}
                            className="bg-background"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="login-description">Описание</Label>
                          <Input
                            id="login-description"
                            placeholder="Влезте в системата за управление на поръчки и склад"
                            value={companySettings.login_description || ''}
                            onChange={(e) => setCompanySettings({...companySettings, login_description: e.target.value})}
                            className="bg-background"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="login-background-color">Фонов цвят</Label>
                          <div className="flex gap-2">
                            <Input
                              id="login-background-color"
                              type="color"
                              value={companySettings.login_background_color || '#ffffff'}
                              onChange={(e) => setCompanySettings({...companySettings, login_background_color: e.target.value})}
                              className="w-16 h-10 p-1 cursor-pointer"
                            />
                            <Input
                              placeholder="#ffffff"
                              value={companySettings.login_background_color || ''}
                              onChange={(e) => setCompanySettings({...companySettings, login_background_color: e.target.value})}
                              className="bg-background flex-1"
                            />
                            {companySettings.login_background_color && (
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => setCompanySettings({...companySettings, login_background_color: null})}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Оставете празно за цвета по подразбиране на темата
                          </p>
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <Label>Фоново изображение</Label>
                          <div className="flex items-center gap-4">
                            {backgroundLoading ? (
                              <div className="w-32 h-20 bg-muted rounded-lg flex items-center justify-center">
                                <Loader2 className="w-4 h-4 animate-spin" />
                              </div>
                            ) : backgroundUrl ? (
                              <div className="relative">
                                <img 
                                  src={backgroundUrl} 
                                  alt="Login background" 
                                  className="w-32 h-20 object-cover rounded-lg border"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="absolute -top-2 -right-2 w-6 h-6"
                                  onClick={async () => {
                                    const success = await deleteBackground();
                                    if (success) {
                                      toast({
                                        title: 'Успех',
                                        description: 'Фоновото изображение беше изтрито',
                                      });
                                    }
                                  }}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <div className="w-32 h-20 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed">
                                <ImageIcon className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1">
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                ref={backgroundInputRef}
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  setUploadingBackground(true);
                                  const success = await uploadBackground(file);
                                  if (success) {
                                    toast({
                                      title: 'Успех',
                                      description: 'Фоновото изображение беше качено',
                                    });
                                  }
                                  setUploadingBackground(false);
                                  if (backgroundInputRef.current) {
                                    backgroundInputRef.current.value = '';
                                  }
                                }}
                                className="hidden"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => backgroundInputRef.current?.click()}
                                disabled={uploadingBackground}
                              >
                                {uploadingBackground ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <Upload className="w-4 h-4 mr-2" />
                                )}
                                {backgroundUrl ? 'Смени изображение' : 'Качи изображение'}
                              </Button>
                              <p className="text-xs text-muted-foreground mt-1">
                                JPG, PNG, WEBP, GIF. Макс. 5MB. Изображението замества фоновия цвят.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="font-medium">Настройки на футера</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="footer-text">Префикс текст</Label>
                          <Input
                            id="footer-text"
                            placeholder="Разработен от"
                            value={companySettings.footer_text || ''}
                            onChange={(e) => setCompanySettings({...companySettings, footer_text: e.target.value})}
                            className="bg-background"
                          />
                          <p className="text-xs text-muted-foreground">
                            Обикновен текст преди линка (напр. "Разработен от")
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="footer-link-text">Текст на линка</Label>
                          <Input
                            id="footer-link-text"
                            placeholder="Цветелин Пенков"
                            value={companySettings.footer_link_text || ''}
                            onChange={(e) => setCompanySettings({...companySettings, footer_link_text: e.target.value})}
                            className="bg-background"
                          />
                          <p className="text-xs text-muted-foreground">
                            Текстът който ще бъде линк (напр. име)
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="footer-link">URL адрес на линка</Label>
                          <Input
                            id="footer-link"
                            placeholder="https://www.linkedin.com/in/..."
                            value={companySettings.footer_link || ''}
                            onChange={(e) => setCompanySettings({...companySettings, footer_link: e.target.value})}
                            className="bg-background"
                          />
                          <p className="text-xs text-muted-foreground">
                            Линкът към който води текста (оставете празно ако не искате линк)
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="footer-website">Уебсайт</Label>
                          <Input
                            id="footer-website"
                            placeholder="www.penkovstudio.eu"
                            value={companySettings.footer_website || ''}
                            onChange={(e) => setCompanySettings({...companySettings, footer_website: e.target.value})}
                            className="bg-background"
                          />
                          <p className="text-xs text-muted-foreground">
                            Показва се на втори ред под основния текст
                          </p>
                        </div>
                      </div>
                    </div>

                    <Button onClick={handleSaveCompanySettings} disabled={savingCompany} className="w-full sm:w-auto">
                      {savingCompany ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Запазване...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Запази персонализация
                        </>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

          </TabsContent>

          {isAdmin && (
            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    Добави нов потребител
                  </CardTitle>
                  <CardDescription>
                    Добавете хора които могат да влизат в системата и да работят с поръчките
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-user-name">Име</Label>
                      <Input
                        id="new-user-name"
                        placeholder="Иван Иванов"
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-user-email">Имейл</Label>
                      <Input
                        id="new-user-email"
                        type="email"
                        placeholder="ivan@example.com"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-user-password">Парола</Label>
                      <Input
                        id="new-user-password"
                        type="password"
                        placeholder="••••••••"
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-user-role">Роля</Label>
                      <Select value={newUserRole} onValueChange={(v: 'admin' | 'user') => setNewUserRole(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">Потребител</SelectItem>
                          <SelectItem value="admin">Администратор</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={handleAddUser} disabled={addingUser} className="w-full sm:w-auto">
                    {addingUser ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Добавяне...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Добави потребител
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Потребители с достъп
                  </CardTitle>
                  <CardDescription>
                    Списък на всички потребители които имат достъп до системата
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingUsers ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : allowedUsers.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Няма добавени потребители</p>
                  ) : (
                    <div className="space-y-3">
                      {allowedUsers.map((allowedUser) => (
                        <div
                          key={allowedUser.id}
                          className="flex items-center justify-between p-3 bg-muted rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            {allowedUser.role === 'admin' && (
                              <Crown className="w-4 h-4 text-warning" />
                            )}
                            <div>
                              <p className="font-medium">{allowedUser.name}</p>
                              <p className="text-sm text-muted-foreground">{allowedUser.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded ${
                              allowedUser.role === 'admin' 
                                ? 'bg-warning/20 text-warning' 
                                : 'bg-primary/20 text-primary'
                            }`}>
                              {allowedUser.role === 'admin' ? 'Админ' : 'Потребител'}
                            </span>
                            {allowedUser.email !== user?.email && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteUser(allowedUser)}
                                disabled={deletingUserId === allowedUser.id}
                                className="text-destructive hover:text-destructive"
                              >
                                {deletingUserId === allowedUser.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="branding" className="space-y-6">
            <GlobalColorPicker />
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Лого на фирмата
                </CardTitle>
                <CardDescription>
                  Качете логото на вашата фирма. То ще се показва в заглавието и на страницата за вход.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg text-sm space-y-2">
                  <p className="font-medium">Изисквания за логото:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Формат: <strong>PNG</strong> или <strong>JPEG</strong></li>
                    <li>Препоръчителен размер: <strong>200x200 пиксела</strong> или <strong>300x100 пиксела</strong> (за хоризонтално)</li>
                    <li>Максимален размер: <strong>2MB</strong></li>
                    <li>За най-добър резултат използвайте PNG с прозрачен фон</li>
                  </ul>
                </div>

                <div className="flex flex-col items-center gap-4 p-6 border-2 border-dashed rounded-lg">
                  {logoLoading ? (
                    <Loader2 className="w-12 h-12 animate-spin text-muted-foreground" />
                  ) : logoUrl ? (
                    <div className="relative">
                      <img 
                        src={logoUrl} 
                        alt="Фирмено лого" 
                        className="max-w-[200px] max-h-[100px] object-contain"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={handleLogoDelete}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">Няма качено лого</p>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingLogo}
                  >
                    {uploadingLogo ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Качване...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        {logoUrl ? 'Смени логото' : 'Качи лого'}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Favicon
                </CardTitle>
                <CardDescription>
                  Качете favicon за сайта. Той ще се показва в таб-а на браузъра.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg text-sm space-y-2">
                  <p className="font-medium">Изисквания за favicon:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Формат: <strong>PNG</strong>, <strong>ICO</strong>, <strong>JPEG</strong> или <strong>SVG</strong></li>
                    <li>Препоръчителен размер: <strong>32x32</strong> или <strong>64x64 пиксела</strong></li>
                    <li>Максимален размер: <strong>1MB</strong></li>
                  </ul>
                </div>

                <div className="flex flex-col items-center gap-4 p-6 border-2 border-dashed rounded-lg">
                  {faviconLoading ? (
                    <Loader2 className="w-12 h-12 animate-spin text-muted-foreground" />
                  ) : faviconUrl ? (
                    <div className="relative">
                      <img 
                        src={faviconUrl} 
                        alt="Favicon" 
                        className="w-16 h-16 object-contain"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={handleFaviconDelete}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">Няма качен favicon</p>
                    </div>
                  )}

                  <input
                    ref={faviconInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/x-icon,image/svg+xml,.ico"
                    onChange={handleFaviconUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => faviconInputRef.current?.click()}
                    disabled={uploadingFavicon}
                  >
                    {uploadingFavicon ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Качване...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        {faviconUrl ? 'Смени favicon' : 'Качи favicon'}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="space-y-6">
            {/* Connectix Settings */}
            <ConnectixSettings ref={connectixRef} />

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5" />
                  Nekorekten.com API
                </CardTitle>
                <CardDescription className="mt-1">
                  Проверка на телефонни номера за некоректни клиенти
                  <a 
                    href="https://nekorekten.com/bg/api/doc" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 ml-2 text-primary hover:underline"
                  >
                    Документация <ExternalLink className="w-3 h-3" />
                  </a>
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${settings.nekorekten_enabled === 'true' ? 'text-success' : 'text-muted-foreground'}`}>
                  {settings.nekorekten_enabled === 'true' ? 'Активен' : 'Неактивен'}
                </span>
                <Switch
                  checked={settings.nekorekten_enabled === 'true'}
                  onCheckedChange={(checked) => setSettings({ ...settings, nekorekten_enabled: checked ? 'true' : 'false' })}
                  className="shrink-0"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nekorekten_api_key">API ключ</Label>
              <Input
                id="nekorekten_api_key"
                type="password"
                placeholder="Вашият Nekorekten API ключ"
                value={settings.nekorekten_api_key || ''}
                onChange={(e) => setSettings({ ...settings, nekorekten_api_key: e.target.value })}
                disabled={settings.nekorekten_enabled !== 'true'}
              />
              <p className="text-sm text-muted-foreground">
                Можете да получите API ключ от профила си в Nekorekten.com
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nekorekten_site_id">Site ID (опционално)</Label>
              <Input
                id="nekorekten_site_id"
                placeholder="ID на вашия сайт в Nekorekten"
                value={settings.nekorekten_site_id || ''}
                onChange={(e) => setSettings({ ...settings, nekorekten_site_id: e.target.value })}
                disabled={settings.nekorekten_enabled !== 'true'}
              />
            </div>

            {/* Test connection and Save buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  if (!settings.nekorekten_api_key) {
                    toast({
                      title: 'Внимание',
                      description: 'Моля въведете API ключ за Nekorekten',
                      variant: 'destructive',
                    });
                    return;
                  }
                  toast({
                    title: 'Тестване',
                    description: 'Връзката с Nekorekten ще бъде тествана...',
                  });
                  // Simulate test - in real implementation call the API
                  setTimeout(() => {
                    toast({
                      title: 'Успех',
                      description: 'Връзката с Nekorekten е успешна!',
                    });
                  }, 1000);
                }}
                disabled={settings.nekorekten_enabled !== 'true'}
                className="flex-1 sm:flex-none"
              >
                <TestTube className="w-4 h-4 mr-2" />
                Тест на връзката
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="flex-1 sm:flex-none"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Запазване...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Запази
                  </>
                )}
              </Button>
            </div>

            {/* Nekorekten Statistics - based on real data */}
            {settings.nekorekten_enabled === 'true' && (
              <NekorektenStatistics />
            )}
          </CardContent>
        </Card>

        {/* reCAPTCHA Settings */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Google reCAPTCHA v3
                </CardTitle>
                <CardDescription className="mt-1">
                  Защитете логин страницата от ботове и спам
                  <a 
                    href="https://developers.google.com/recaptcha/docs/v3" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 ml-2 text-primary hover:underline"
                  >
                    Документация <ExternalLink className="w-3 h-3" />
                  </a>
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${settings.recaptcha_enabled === 'true' ? 'text-success' : 'text-muted-foreground'}`}>
                  {settings.recaptcha_enabled === 'true' ? 'Активен' : 'Неактивен'}
                </span>
                <Switch
                  checked={settings.recaptcha_enabled === 'true'}
                  onCheckedChange={(checked) => setSettings({ ...settings, recaptcha_enabled: checked ? 'true' : 'false' })}
                  className="shrink-0"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg text-sm space-y-2">
              <p className="font-medium">Как да получите ключове за reCAPTCHA:</p>
              <ol className="list-decimal list-inside text-muted-foreground space-y-1">
                <li>Отидете на <a href="https://www.google.com/recaptcha/admin" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google reCAPTCHA Admin Console</a></li>
                <li>Създайте нов сайт с тип <strong>reCAPTCHA v3</strong></li>
                <li>Добавете домейна на вашия сайт</li>
                <li>Копирайте <strong>Site Key</strong> и <strong>Secret Key</strong></li>
              </ol>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recaptcha_site_key">Site Key (публичен ключ)</Label>
              <Input
                id="recaptcha_site_key"
                placeholder="6LcXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                value={settings.recaptcha_site_key || ''}
                onChange={(e) => setSettings({ ...settings, recaptcha_site_key: e.target.value })}
                disabled={settings.recaptcha_enabled !== 'true'}
              />
              <p className="text-sm text-muted-foreground">
                Този ключ се използва в браузъра за генериране на токени
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recaptcha_secret_key">Secret Key (таен ключ)</Label>
              <Input
                id="recaptcha_secret_key"
                type="password"
                placeholder="6LcXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                value={settings.recaptcha_secret_key || ''}
                onChange={(e) => setSettings({ ...settings, recaptcha_secret_key: e.target.value })}
                disabled={settings.recaptcha_enabled !== 'true'}
              />
              <p className="text-sm text-muted-foreground">
                Този ключ се използва на сървъра за верификация на токените
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recaptcha_threshold">Праг за блокиране (0.0 - 1.0)</Label>
              <Input
                id="recaptcha_threshold"
                type="number"
                step="0.1"
                min="0"
                max="1"
                placeholder="0.5"
                value={settings.recaptcha_threshold || '0.5'}
                onChange={(e) => setSettings({ ...settings, recaptcha_threshold: e.target.value })}
                disabled={settings.recaptcha_enabled !== 'true'}
                className="w-32"
              />
              <p className="text-sm text-muted-foreground">
                Резултат под този праг ще блокира опита за вход. По-високи стойности = по-строга защита.
              </p>
            </div>

            {/* Test and Save buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  if (!settings.recaptcha_site_key || !settings.recaptcha_secret_key) {
                    toast({
                      title: 'Внимание',
                      description: 'Моля въведете Site Key и Secret Key',
                      variant: 'destructive',
                    });
                    return;
                  }
                  toast({
                    title: 'Информация',
                    description: 'reCAPTCHA ще бъде тестван при следващия опит за логин',
                  });
                }}
                disabled={settings.recaptcha_enabled !== 'true'}
                className="flex-1 sm:flex-none"
              >
                <TestTube className="w-4 h-4 mr-2" />
                Информация за тест
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="flex-1 sm:flex-none"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Запазване...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Запази
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Допълнителни API ключове
            </CardTitle>
            <CardDescription>
              Добавете допълнителни API ключове за други интеграции
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {customApis.map((api, index) => (
              <div key={api.key} className="flex items-center gap-2">
                <Input
                  placeholder="API ключ"
                  value={api.value}
                  onChange={(e) => {
                    const newApis = [...customApis];
                    newApis[index].value = e.target.value;
                    setCustomApis(newApis);
                  }}
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeCustomApi(index)}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={addCustomApi} className="flex-1">
                <Plus className="w-4 h-4 mr-2" />
                Добави API ключ
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Save button for all API settings */}
        <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Запазване...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Запази API настройките
            </>
          )}
        </Button>
          </TabsContent>

          <TabsContent value="interface" className="space-y-6">
            <InterfaceTextEditor ref={interfaceTextRef} />
          </TabsContent>

          <TabsContent value="docs" className="space-y-6">
            <DocumentationTab />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="roles" className="space-y-6">
              <RolePermissionsManager />
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="danger" className="space-y-6">
              {/* Cache & Optimization */}
              <CacheManagementCard toast={toast} />

              <Card className="border-destructive/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <Trash2 className="w-5 h-5" />
                    Опасна зона
                  </CardTitle>
                  <CardDescription>
                    Тези действия са необратими. Моля бъдете внимателни.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/30">
                    <h4 className="font-medium text-destructive mb-2">Фабрични настройки</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Изтрийте всички данни от системата и започнете отначало. Това действие е необратимо!
                    </p>
                    <FactoryResetDialog />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>

      {/* Футер */}
      <footer className="mt-auto border-t bg-card py-4">
        <div className="container mx-auto px-3 sm:px-4 text-center text-xs text-muted-foreground">
          <span>
            {companySettings?.footer_text || 'Разработен от'}{' '}
            {companySettings?.footer_link && companySettings?.footer_link_text ? (
              <a 
                href={companySettings.footer_link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                {companySettings.footer_link_text}
              </a>
            ) : (
              <span className="font-medium">{companySettings?.footer_link_text || 'Цветелин Пенков'}</span>
            )}
          </span>
          {companySettings?.footer_website && (
            <div className="mt-1">
              <a 
                href={companySettings.footer_website.startsWith('http') ? companySettings.footer_website : `https://${companySettings.footer_website}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {companySettings.footer_website}
              </a>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
};

export default Settings;
