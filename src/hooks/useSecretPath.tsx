import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useSecretPath = () => {
  const [secretPath, setSecretPath] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidPath, setIsValidPath] = useState(true);

  useEffect(() => {
    const fetchSecretPath = async () => {
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

        // Check if the current path matches the secret path
        if (storedPath) {
          const currentPath = window.location.pathname;
          // The secret path should be at the beginning of the URL
          // e.g., /b36s739rbf/auth or /b36s739rbf/
          const normalizedSecretPath = storedPath.startsWith('/') ? storedPath : `/${storedPath}`;
          
          // Check if current path starts with the secret path
          if (!currentPath.startsWith(normalizedSecretPath)) {
            setIsValidPath(false);
          } else {
            setIsValidPath(true);
          }
        } else {
          // No secret path configured, allow access
          setIsValidPath(true);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSecretPath();
  }, []);

  // Function to get the base path (secret path if configured)
  const getBasePath = () => {
    if (!secretPath) return '';
    return secretPath.startsWith('/') ? secretPath : `/${secretPath}`;
  };

  // Function to build a full path with the secret prefix
  const buildPath = (path: string) => {
    const base = getBasePath();
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return base ? `${base}${normalizedPath}` : normalizedPath;
  };

  return {
    secretPath,
    isLoading,
    isValidPath,
    getBasePath,
    buildPath,
  };
};
