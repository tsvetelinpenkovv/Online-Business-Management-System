import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import { useLoginBackground } from '@/hooks/useLoginBackground';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Loader2, Mail, Lock, LogIn, KeyRound, ArrowLeft, Send, Eye, EyeOff, UserPlus, Sparkles, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { buildPath } from '@/components/SecretPathGuard';

interface CompanySettings {
  login_title?: string;
  login_description?: string;
  login_background_color?: string;
  footer_text?: string;
  footer_link?: string;
  footer_link_text?: string;
  footer_website?: string;
}

interface RecaptchaSettings {
  enabled: boolean;
  siteKey: string;
  threshold: number;
}

// Extend window for reCAPTCHA
declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [isSetupMode, setIsSetupMode] = useState<boolean | null>(null);
  const [checkingSystem, setCheckingSystem] = useState(true);
  const [recaptchaSettings, setRecaptchaSettings] = useState<RecaptchaSettings>({
    enabled: false,
    siteKey: '',
    threshold: 0.5
  });
  const [recaptchaLoaded, setRecaptchaLoaded] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockRemainingMinutes, setBlockRemainingMinutes] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState(5);
  const { signIn, signOut, user } = useAuth();
  const { logoUrl, loading: logoLoading } = useCompanyLogo();
  const { backgroundUrl } = useLoginBackground();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if IP is blocked on mount
  const checkRateLimit = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-login-rate', {
        body: { action: 'check' }
      });
      
      if (error) {
        console.error('Error checking rate limit:', error);
        return;
      }
      
      if (data.blocked) {
        setIsBlocked(true);
        setBlockRemainingMinutes(data.remainingMinutes);
      } else {
        setIsBlocked(false);
        setRemainingAttempts(data.maxAttempts - data.attempts);
      }
    } catch (err) {
      console.error('Error checking rate limit:', err);
    }
  }, []);

  // Check if system has users
  useEffect(() => {
    const checkSystemStatus = async () => {
      try {
        // Check rate limit first
        await checkRateLimit();
        
        const { data, error } = await supabase.functions.invoke('setup-first-admin', {
          method: 'GET',
        });

        if (error) {
          console.error('Error checking system status:', error);
          setIsSetupMode(false);
        } else {
          setIsSetupMode(!data.hasUsers);
        }
      } catch (err) {
        console.error('Error:', err);
        setIsSetupMode(false);
      } finally {
        setCheckingSystem(false);
      }
    };

    checkSystemStatus();
  }, [checkRateLimit]);

  // Load reCAPTCHA settings
  useEffect(() => {
    const loadRecaptchaSettings = async () => {
      try {
        const keys = ['recaptcha_enabled', 'recaptcha_site_key', 'recaptcha_threshold'];
        const { data } = await supabase
          .from('api_settings')
          .select('setting_key, setting_value')
          .in('setting_key', keys);
        
        if (data) {
          const settings: RecaptchaSettings = {
            enabled: false,
            siteKey: '',
            threshold: 0.5
          };
          
          data.forEach(item => {
            if (item.setting_key === 'recaptcha_enabled') {
              settings.enabled = item.setting_value === 'true';
            } else if (item.setting_key === 'recaptcha_site_key') {
              settings.siteKey = item.setting_value || '';
            } else if (item.setting_key === 'recaptcha_threshold') {
              settings.threshold = parseFloat(item.setting_value || '0.5');
            }
          });
          
          setRecaptchaSettings(settings);
          
          // Load reCAPTCHA script if enabled and has site key
          if (settings.enabled && settings.siteKey) {
            loadRecaptchaScript(settings.siteKey);
          }
        }
      } catch (error) {
        console.error('Error loading reCAPTCHA settings:', error);
      }
    };
    
    loadRecaptchaSettings();
  }, []);

  // Load reCAPTCHA script dynamically
  const loadRecaptchaScript = useCallback((siteKey: string) => {
    if (document.querySelector('script[src*="recaptcha"]')) {
      setRecaptchaLoaded(true);
      return;
    }
    
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setRecaptchaLoaded(true);
    };
    document.head.appendChild(script);
  }, []);

  // Verify reCAPTCHA token
  const verifyRecaptcha = useCallback(async (action: string): Promise<boolean> => {
    if (!recaptchaSettings.enabled || !recaptchaSettings.siteKey) {
      return true; // Skip if not enabled
    }
    
    if (!recaptchaLoaded || !window.grecaptcha) {
      console.warn('reCAPTCHA not loaded yet');
      return true; // Allow if script hasn't loaded
    }
    
    try {
      const token = await new Promise<string>((resolve, reject) => {
        window.grecaptcha.ready(() => {
          window.grecaptcha
            .execute(recaptchaSettings.siteKey, { action })
            .then(resolve)
            .catch(reject);
        });
      });
      
      // Verify token with edge function
      const { data, error } = await supabase.functions.invoke('verify-recaptcha', {
        body: { token, expectedAction: action }
      });
      
      if (error) {
        console.error('reCAPTCHA verification error:', error);
        return false;
      }
      
      if (!data.success) {
        console.error('reCAPTCHA verification failed:', data.error);
        return false;
      }
      
      // Check score against threshold
      if (data.score < recaptchaSettings.threshold) {
        console.warn(`reCAPTCHA score ${data.score} below threshold ${recaptchaSettings.threshold}`);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('reCAPTCHA error:', error);
      return false;
    }
  }, [recaptchaSettings, recaptchaLoaded]);

  useEffect(() => {
    const fetchCompanySettings = async () => {
      const { data } = await supabase
        .from('company_settings')
        .select('login_title, login_description, login_background_color, footer_text, footer_link, footer_link_text, footer_website')
        .limit(1)
        .maybeSingle();
      if (data) {
        setCompanySettings(data);
      }
    };
    fetchCompanySettings();
  }, []);

  useEffect(() => {
    const checkUserAccess = async () => {
      if (user) {
        // Check if user is in allowed_users
        const { data, error } = await supabase
          .from('allowed_users')
          .select('email')
          .eq('email', user.email)
          .single();

        if (error || !data) {
          // User is not allowed, sign them out
          await signOut();
          toast({
            title: 'Достъп отказан',
            description: 'Нямате право на достъп до системата',
            variant: 'destructive',
          });
        } else {
          navigate(buildPath('/'));
        }
      }
    };

    checkUserAccess();
  }, [user, navigate, signOut, toast]);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (password.length < 6) {
        toast({
          title: 'Грешка',
          description: 'Паролата трябва да бъде поне 6 символа',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('setup-first-admin', {
        body: { email, password, name },
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      toast({
        title: 'Успех!',
        description: 'Администраторският акаунт е създаден. Моля влезте.',
      });

      // Switch to login mode
      setIsSetupMode(false);
      setPassword('');
      setName('');
    } catch (error: any) {
      console.error('Setup error:', error);
      toast({
        title: 'Грешка',
        description: error.message || 'Неуспешно създаване на акаунт',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Check if IP is blocked first
    try {
      const { data: rateData, error: rateError } = await supabase.functions.invoke('check-login-rate', {
        body: { action: 'check' }
      });
      
      if (!rateError && rateData?.blocked) {
        setIsBlocked(true);
        setBlockRemainingMinutes(rateData.remainingMinutes);
        toast({
          title: 'Временно блокиран',
          description: `Твърде много неуспешни опити. Опитайте отново след ${rateData.remainingMinutes} минути.`,
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }
    } catch (err) {
      console.error('Rate limit check error:', err);
    }
    
    // Verify reCAPTCHA first
    const recaptchaValid = await verifyRecaptcha('login');
    if (!recaptchaValid) {
      toast({
        title: 'Проверка неуспешна',
        description: 'reCAPTCHA верификацията не премина. Моля опитайте отново.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }
    
    // First check if email is in allowed_users using security definer function
    const { data: isAllowed, error: checkError } = await supabase.rpc('is_allowed_user', { _email: email });

    if (checkError || !isAllowed) {
      // Record failed attempt for non-allowed user
      await supabase.functions.invoke('check-login-rate', {
        body: { action: 'record_failure', email }
      });
      await checkRateLimit();
      
      toast({
        title: 'Достъп отказан',
        description: 'Нямате право на достъп до системата',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }
    
    const { error } = await signIn(email, password);
    
    if (error) {
      // Record failed login attempt
      const { data: failData } = await supabase.functions.invoke('check-login-rate', {
        body: { action: 'record_failure', email }
      });
      
      if (failData?.blocked) {
        setIsBlocked(true);
        toast({
          title: 'Временно блокиран',
          description: 'Твърде много неуспешни опити. Опитайте отново след 15 минути.',
          variant: 'destructive',
        });
      } else {
        setRemainingAttempts(failData?.remainingAttempts || 0);
        const attemptsMsg = failData?.remainingAttempts > 0 
          ? ` Оставащи опити: ${failData.remainingAttempts}`
          : '';
        toast({
          title: 'Грешка при вход',
          description: (error.message === 'Invalid login credentials' 
            ? 'Невалиден имейл или парола' 
            : error.message) + attemptsMsg,
          variant: 'destructive',
        });
      }
    } else {
      // Record successful login (clears failed attempts)
      await supabase.functions.invoke('check-login-rate', {
        body: { action: 'record_success', email }
      });
    }
    
    setIsLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: 'Грешка',
        description: 'Моля въведете имейл адрес',
        variant: 'destructive',
      });
      return;
    }

    setIsResetting(true);

    try {
      // First check if email is in allowed_users using security definer function
      const { data: isAllowed, error: checkError } = await supabase.rpc('is_allowed_user', { _email: email });

      if (checkError || !isAllowed) {
        toast({
          title: 'Грешка',
          description: 'Няма потребител с този имейл адрес в системата',
          variant: 'destructive',
        });
        setIsResetting(false);
        return;
      }

      // Send password reset email
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) {
        throw error;
      }

      toast({
        title: 'Успех',
        description: 'Изпратихме ви имейл с инструкции за възстановяване на паролата',
      });
      
      setShowForgotPassword(false);
    } catch (error: any) {
      toast({
        title: 'Грешка',
        description: error.message || 'Неуспешно изпращане на имейл',
        variant: 'destructive',
      });
    } finally {
      setIsResetting(false);
    }
  };

  const backgroundStyle: React.CSSProperties = backgroundUrl 
    ? {
        backgroundImage: `url(${backgroundUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }
    : {
        backgroundColor: companySettings?.login_background_color || 'hsl(var(--background))',
      };

  if (checkingSystem) {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center p-4"
        style={backgroundStyle}
      >
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Зареждане...</p>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={backgroundStyle}
    >
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {logoLoading ? (
              <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : logoUrl ? (
              <img 
                src={logoUrl} 
                alt="Фирмено лого" 
                className="max-w-[120px] max-h-[80px] object-contain"
              />
            ) : (
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
                <Package className="w-8 h-8 text-primary-foreground" />
              </div>
            )}
          </div>
          {isSetupMode ? (
            <>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <CardTitle className="text-2xl">Първоначална настройка</CardTitle>
              </div>
              <CardDescription>
                Създайте първия администраторски акаунт за системата
              </CardDescription>
            </>
          ) : (
            <>
              <CardTitle className="text-2xl">{companySettings?.login_title || 'Управление на поръчки и складови наличности'}</CardTitle>
              <CardDescription>{companySettings?.login_description || 'Влезте в системата за управление на поръчки и склад'}</CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent>
          {isSetupMode ? (
            <form onSubmit={handleSetup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Име</Label>
                <div className="relative">
                  <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Вашето име"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Имейл</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Парола</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">Минимум 6 символа</p>
              </div>
              <div className="pt-4">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Създаване...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Създай администратор
                    </>
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <>
              {isBlocked ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
                    <ShieldCheck className="w-8 h-8 text-destructive" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-destructive">Временно блокиран</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Твърде много неуспешни опити за вход.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Опитайте отново след <strong>{blockRemainingMinutes}</strong> минути.
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={async () => {
                      await checkRateLimit();
                    }}
                    className="mt-4"
                  >
                    Провери отново
                  </Button>
                </div>
              ) : (
                <>
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Имейл</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="email@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Парола</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="pl-10 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="pt-4 space-y-2">
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Влизане...
                          </>
                        ) : (
                          <>
                            <LogIn className="w-4 h-4 mr-2" />
                            Вход
                          </>
                        )}
                      </Button>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        {recaptchaSettings.enabled && recaptchaSettings.siteKey && (
                          <p className="flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            reCAPTCHA v3
                          </p>
                        )}
                        {remainingAttempts < 5 && remainingAttempts > 0 && (
                          <p className="text-amber-600">
                            Оставащи опити: {remainingAttempts}
                          </p>
                        )}
                      </div>
                    </div>
                  </form>

                  {showForgotPassword ? (
                    <div className="mt-6 pt-6 border-t">
                      <p className="text-sm text-muted-foreground mb-4 text-center">
                        Въведете имейл адреса си и ще ви изпратим линк за възстановяване на паролата
                      </p>
                      <form onSubmit={handleForgotPassword} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="reset-email">Имейл</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="reset-email"
                              type="email"
                              placeholder="email@example.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                              className="pl-10"
                            />
                          </div>
                        </div>
                        <Button type="submit" className="w-full" variant="outline" disabled={isResetting}>
                          {isResetting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Изпращане...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Изпрати линк за възстановяване
                            </>
                          )}
                        </Button>
                      </form>
                      <Button 
                        variant="ghost" 
                        className="w-full mt-2 text-xs" 
                        onClick={() => setShowForgotPassword(false)}
                      >
                        <ArrowLeft className="w-3 h-3 mr-1" />
                        Обратно към вход
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-4 text-center">
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-xs text-muted-foreground hover:text-primary underline inline-flex items-center gap-1"
                      >
                        <KeyRound className="w-3 h-3" />
                        Забравена парола?
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
      
      <div className="mt-6 text-center text-xs text-muted-foreground">
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
            <a 
              href="https://www.linkedin.com/in/tsvetelinpenkov/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              {companySettings?.footer_link_text || 'Цветелин Пенков'}
            </a>
          )}
        </span>
        <div className="mt-1">
          <a 
            href={companySettings?.footer_website ? (companySettings.footer_website.startsWith('http') ? companySettings.footer_website : `https://${companySettings.footer_website}`) : 'https://www.penkovstudio.eu'} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {companySettings?.footer_website || 'www.penkovstudio.eu'}
          </a>
        </div>
      </div>
    </div>
  );
};

export default Auth;
