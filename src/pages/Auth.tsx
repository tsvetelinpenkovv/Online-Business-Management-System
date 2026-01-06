import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const { logoUrl, loading: logoLoading } = useCompanyLogo();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (password.length < 6) {
      toast({
        title: 'Грешка',
        description: 'Паролата трябва да е поне 6 символа',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    const { error } = await signUp(email, password);
    
    if (error) {
      toast({
        title: 'Грешка при регистрация',
        description: error.message.includes('already registered') 
          ? 'Потребител с този имейл вече съществува' 
          : error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Успешна регистрация',
        description: 'Вече можете да влезете в системата',
      });
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
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
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Вход</TabsTrigger>
              <TabsTrigger value="register">Регистрация</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
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
            </TabsContent>
            
            <TabsContent value="register">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-email">Имейл</Label>
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Парола</Label>
                  <Input
                    id="reg-password"
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
                      Регистрация...
                    </>
                  ) : (
                    'Регистрация'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
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
