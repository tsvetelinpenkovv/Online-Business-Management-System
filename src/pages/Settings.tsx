import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Loader2, Key, Link, Webhook, Plus, Trash2, TestTube, ShieldAlert, ExternalLink, ImageIcon, Upload, X, Users, UserPlus, Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ApiSetting } from '@/types/order';

interface AllowedUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  created_at: string;
}

const Settings = () => {
  const { user, loading: authLoading } = useAuth();
  const { logoUrl, uploadLogo, deleteLogo, loading: logoLoading } = useCompanyLogo();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [customApis, setCustomApis] = useState<{ key: string; value: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

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
    }
  }, [user, toast]);

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

      toast({
        title: 'Успех',
        description: 'Настройките бяха запазени',
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
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold">Настройки</h1>
          </div>
          <Button onClick={handleSave} disabled={saving}>
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
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        <Tabs defaultValue="api" className="w-full">
          <TabsList className={`grid w-full mb-6 ${isAdmin ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <TabsTrigger value="api">API Настройки</TabsTrigger>
            <TabsTrigger value="branding">Лого на фирмата</TabsTrigger>
            {isAdmin && <TabsTrigger value="users">Потребители</TabsTrigger>}
          </TabsList>

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
          </TabsContent>

          <TabsContent value="api" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="w-5 h-5" />
              WooCommerce API
            </CardTitle>
            <CardDescription>
              Свържете системата с вашия WooCommerce магазин за автоматично синхронизиране на поръчки
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="woo_url">WooCommerce URL</Label>
              <Input
                id="woo_url"
                placeholder="https://yourstore.com"
                value={settings.woocommerce_url || ''}
                onChange={(e) => setSettings({ ...settings, woocommerce_url: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="consumer_key">Consumer Key</Label>
              <Input
                id="consumer_key"
                placeholder="ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={settings.woocommerce_consumer_key || ''}
                onChange={(e) => setSettings({ ...settings, woocommerce_consumer_key: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="consumer_secret">Consumer Secret</Label>
              <Input
                id="consumer_secret"
                type="password"
                placeholder="cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={settings.woocommerce_consumer_secret || ''}
                onChange={(e) => setSettings({ ...settings, woocommerce_consumer_secret: e.target.value })}
              />
            </div>
            <Button variant="outline" onClick={testConnection}>
              <TestTube className="w-4 h-4 mr-2" />
              Тествай връзката
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="w-5 h-5" />
              Webhook
            </CardTitle>
            <CardDescription>
              Използвайте този URL за автоматични известия от WooCommerce
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhook_url">Webhook URL</Label>
              <Input
                id="webhook_url"
                placeholder="https://..."
                value={settings.webhook_url || ''}
                onChange={(e) => setSettings({ ...settings, webhook_url: e.target.value })}
                readOnly
              />
              <p className="text-sm text-muted-foreground">
                Добавете този URL в WooCommerce → Settings → Advanced → Webhooks
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" />
              Nekorekten.com API
            </CardTitle>
            <CardDescription>
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
              />
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
            <Button variant="outline" onClick={addCustomApi} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Добави API ключ
            </Button>
          </CardContent>
        </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Settings;
