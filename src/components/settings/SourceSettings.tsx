import { FC, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useEcommercePlatforms, EcommercePlatform } from '@/hooks/useEcommercePlatforms';
import { useToast } from '@/hooks/use-toast';
import woocommerceLogo from '@/assets/woocommerce-logo.png';
import { PrestaShopLogo, OpenCartLogo, MagentoLogo, ShopifyLogo } from '@/components/icons/PlatformLogos';

const platformLogos: Record<string, React.ReactNode> = {
  woocommerce: <img src={woocommerceLogo} alt="WooCommerce" className="w-6 h-6" />,
  prestashop: <PrestaShopLogo className="w-6 h-6" />,
  opencart: <OpenCartLogo className="w-6 h-6" />,
  magento: <MagentoLogo className="w-6 h-6" />,
  shopify: <ShopifyLogo className="w-6 h-6" />,
};

export const SourceSettings: FC = () => {
  const { platforms, loading, togglePlatform } = useEcommercePlatforms();
  const [toggling, setToggling] = useState<string | null>(null);
  const { toast } = useToast();

  const handleToggle = async (platform: EcommercePlatform) => {
    setToggling(platform.id);
    const result = await togglePlatform(platform.id, !platform.is_enabled);
    
    if (result.success) {
      toast({
        title: 'Успех',
        description: `${platform.display_name} е ${!platform.is_enabled ? 'активиран' : 'деактивиран'} като източник`,
      });
    } else {
      toast({
        title: 'Грешка',
        description: result.error || 'Неуспешна промяна',
        variant: 'destructive',
      });
    }
    setToggling(null);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Източници на поръчки</CardTitle>
        <CardDescription>
          Активирайте платформите, от които получавате поръчки. Активните платформи ще се показват като възможен източник при добавяне на поръчка.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Static sources - always enabled */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Стандартни източници</h4>
          <div className="grid gap-3">
            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="font-medium">Google</span>
              </div>
              <Badge variant="secondary">Винаги активен</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span className="font-medium">Facebook</span>
              </div>
              <Badge variant="secondary">Винаги активен</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="font-medium">Телефон</span>
              </div>
              <Badge variant="secondary">Винаги активен</Badge>
            </div>
          </div>
        </div>

        {/* E-commerce platforms */}
        <div className="space-y-3 pt-4">
          <h4 className="text-sm font-medium text-muted-foreground">E-commerce платформи</h4>
          <div className="grid gap-3">
            {platforms.map((platform) => (
              <div 
                key={platform.id} 
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {platformLogos[platform.name] || null}
                  <span className="font-medium">{platform.display_name}</span>
                </div>
                <div className="flex items-center gap-3">
                  {platform.is_enabled && (
                    <Badge className="bg-success">Активен</Badge>
                  )}
                  <Switch
                    checked={platform.is_enabled}
                    onCheckedChange={() => handleToggle(platform)}
                    disabled={toggling === platform.id}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground pt-4">
          Активирайте платформа, за да я виждате като опция при добавяне на поръчка и за да получавате поръчки от нея автоматично.
        </p>
      </CardContent>
    </Card>
  );
};
