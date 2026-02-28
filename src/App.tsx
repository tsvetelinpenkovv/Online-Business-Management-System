import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/components/ThemeProvider";
import { InterfaceTextsProvider } from "@/hooks/useInterfaceTexts";
import { SecretPathGuard } from "@/components/SecretPathGuard";
import { SessionTimeoutWarning } from "@/components/SessionTimeoutWarning";
import { lazy, Suspense, ReactNode } from "react";
import { Loader2, Package } from "lucide-react";
import { useParams, Navigate } from "react-router-dom";
import { SWUpdateToast } from "@/components/SWUpdateToast";

// Lazy load pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Settings = lazy(() => import("./pages/Settings"));
const Inventory = lazy(() => import("./pages/Inventory"));
const Messages = lazy(() => import("./pages/Messages"));
const Nekorekten = lazy(() => import("./pages/Nekorekten"));
const CRM = lazy(() => import("./pages/CRM"));
const Finance = lazy(() => import("./pages/Finance"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Returns = lazy(() => import("./pages/Returns"));


const PageLoader = () => (
  <div className="min-h-screen min-w-full flex flex-col items-center justify-center gap-4 bg-background" style={{ containIntrinsicSize: '100vw 100vh', contentVisibility: 'auto' }}>
    <Package className="w-12 h-12 text-primary animate-pulse" />
    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
  </div>
);

/**
 * Validates that the :secretPath param in the URL matches the configured secret path.
 * If no secret path is configured, these routes should NOT match — redirect to 404.
 */
const SecretPathValidator = ({ children }: { children: ReactNode }) => {
  const { secretPath } = useParams<{ secretPath: string }>();
  const storedPath = sessionStorage.getItem('secret_path');

  // No secret path configured → these routes are invalid
  if (!storedPath) return <NotFoundPage />;

  // Normalize: stored path has leading slash, param does not
  const normalizedStored = storedPath.startsWith('/') ? storedPath.slice(1) : storedPath;
  if (secretPath !== normalizedStored) return <NotFoundPage />;

  return <>{children}</>;
};

const NotFoundPage = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="app-theme">
      <AuthProvider>
        <InterfaceTextsProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <SWUpdateToast />
            <SessionTimeoutWarning />
            <BrowserRouter>
              <SecretPathGuard>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* Routes without secret path prefix */}
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/inventory" element={<Inventory />} />
                    <Route path="/messages" element={<Messages />} />
                    <Route path="/nekorekten" element={<Nekorekten />} />
                    <Route path="/crm" element={<CRM />} />
                    <Route path="/finance" element={<Finance />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/returns" element={<Returns />} />
                    
                    {/* Routes with secret path prefix - validated against configured secret */}
                    <Route path="/:secretPath/" element={<SecretPathValidator><Index /></SecretPathValidator>} />
                    <Route path="/:secretPath/auth" element={<SecretPathValidator><Auth /></SecretPathValidator>} />
                    <Route path="/:secretPath/settings" element={<SecretPathValidator><Settings /></SecretPathValidator>} />
                    <Route path="/:secretPath/inventory" element={<SecretPathValidator><Inventory /></SecretPathValidator>} />
                    <Route path="/:secretPath/messages" element={<SecretPathValidator><Messages /></SecretPathValidator>} />
                    <Route path="/:secretPath/nekorekten" element={<SecretPathValidator><Nekorekten /></SecretPathValidator>} />
                    <Route path="/:secretPath/crm" element={<SecretPathValidator><CRM /></SecretPathValidator>} />
                    <Route path="/:secretPath/finance" element={<SecretPathValidator><Finance /></SecretPathValidator>} />
                    <Route path="/:secretPath/analytics" element={<SecretPathValidator><Analytics /></SecretPathValidator>} />
                    <Route path="/:secretPath/returns" element={<SecretPathValidator><Returns /></SecretPathValidator>} />
                    <Route path="/:secretPath/returns" element={<Returns />} />
                    
                    {/* Catch-all for 404 */}
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </Suspense>
              </SecretPathGuard>
            </BrowserRouter>
          </TooltipProvider>
        </InterfaceTextsProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
