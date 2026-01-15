import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBasePath, buildPath } from '@/components/SecretPathGuard';

export const useSecureNavigation = () => {
  const navigate = useNavigate();

  const secureNavigate = useCallback((path: string) => {
    const fullPath = buildPath(path);
    navigate(fullPath);
  }, [navigate]);

  const getSecurePath = useCallback((path: string) => {
    return buildPath(path);
  }, []);

  return {
    navigate: secureNavigate,
    getPath: getSecurePath,
    basePath: getBasePath(),
  };
};
