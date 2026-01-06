import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const { signIn, signOut, user } = useAuth();
  const { logoUrl, loading: logoLoading } = useCompanyLogo();
  const navigate = useNavigate();
  const { toast } = useToast();

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
          navigate('/');
        }
      }
    };

    checkUserAccess();
  }, [user, navigate, signOut, toast]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // First check if email is in allowed_users
    const { data: allowedUser, error: checkError } = await supabase
      .from('allowed_users')
      .select('email')
      .eq('email', email)
      .single();

    if (checkError || !allowedUser) {
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
      toast({
        title: 'Грешка при вход',
        description: error.message === 'Invalid login credentials' 
          ? 'Невалиден имейл или парола' 
          : error.message,
        variant: 'destructive',
      });
    }
    
    setIsLoading(false);
  };

  const handleSetupAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSettingUp(true);

    try {
      const response = await supabase.functions.invoke('setup-admin', {
        body: { email, password },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast({
        title: 'Успех',
        description: 'Акаунтът е създаден успешно. Сега можете да влезете.',
      });
      
      setShowSetup(false);
    } catch (error: any) {
      toast({
        title: 'Грешка',
        description: error.message || 'Неуспешно създаване на акаунт',
        variant: 'destructive',
      });
    } finally {
      setIsSettingUp(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
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
          <CardTitle className="text-2xl">Управление на поръчки</CardTitle>
          <CardDescription>Влезте в системата за управление на поръчки</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Имейл</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Парола</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Влизане...
                </>
              ) : (
                'Вход'
              )}
            </Button>
          </form>

          {showSetup ? (
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-muted-foreground mb-4 text-center">
                Първоначална настройка - създайте администраторски акаунт
              </p>
              <form onSubmit={handleSetupAdmin} className="space-y-4">
                <Button type="submit" className="w-full" variant="outline" disabled={isSettingUp}>
                  {isSettingUp ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Създаване...
                    </>
                  ) : (
                    'Създай акаунт с тези данни'
                  )}
                </Button>
              </form>
              <Button 
                variant="ghost" 
                className="w-full mt-2 text-xs" 
                onClick={() => setShowSetup(false)}
              >
                Отказ
              </Button>
            </div>
          ) : (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setShowSetup(true)}
                className="text-xs text-muted-foreground hover:text-primary underline"
              >
                Първоначална настройка
              </button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="mt-6 text-center text-xs text-muted-foreground">
        Разработен от{' '}
        <a 
          href="https://www.linkedin.com/in/tsvetelinpenkov/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Цветелин Пенков
        </a>
      </div>
    </div>
  );
};

export default Auth;
