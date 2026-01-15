import { useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface SecretPathGuardProps {
  children: ReactNode;
}

export const SecretPathGuard = ({ children }: SecretPathGuardProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isValidPath, setIsValidPath] = useState(true);
  const [secretPath, setSecretPath] = useState<string | null>(null);

  useEffect(() => {
    const checkSecretPath = async () => {
      try {
        const { data, error } = await supabase
          .from('company_settings')
          .select('secret_path')
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Error fetching secret path:', error);
          setIsLoading(false);
          return;
        }

        const storedPath = data?.secret_path;
        setSecretPath(storedPath);

        if (storedPath) {
          const currentPath = window.location.pathname;
          const normalizedSecretPath = storedPath.startsWith('/') ? storedPath : `/${storedPath}`;
          
          // Check if current path starts with the secret path
          if (!currentPath.startsWith(normalizedSecretPath)) {
            setIsValidPath(false);
          } else {
            setIsValidPath(true);
            // Store the secret path in session storage for navigation
            sessionStorage.setItem('secret_path', normalizedSecretPath);
          }
        } else {
          // No secret path configured, allow access
          setIsValidPath(true);
          sessionStorage.removeItem('secret_path');
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkSecretPath();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isValidPath) {
    // Show 404-like page for invalid paths (don't reveal that secret path exists)
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
          <p className="text-xl text-muted-foreground">Страницата не е намерена</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Helper function to get the base path for navigation
export const getBasePath = (): string => {
  return sessionStorage.getItem('secret_path') || '';
};

// Helper function to build full path with secret prefix
export const buildPath = (path: string): string => {
  const basePath = getBasePath();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return basePath ? `${basePath}${normalizedPath}` : normalizedPath;
};
