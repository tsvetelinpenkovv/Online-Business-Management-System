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
import { lazy, Suspense } from "react";
import { Loader2, Package } from "lucide-react";

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
const NotFound = lazy(() => import("./pages/NotFound"));

const PageLoader = () => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
    <Package className="w-12 h-12 text-primary animate-pulse" />
    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
  </div>
);

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
                    
                    {/* Routes with secret path prefix - using wildcard to capture any prefix */}
                    <Route path="/:secretPath/" element={<Index />} />
                    <Route path="/:secretPath/auth" element={<Auth />} />
                    <Route path="/:secretPath/settings" element={<Settings />} />
                    <Route path="/:secretPath/inventory" element={<Inventory />} />
                    <Route path="/:secretPath/messages" element={<Messages />} />
                    <Route path="/:secretPath/nekorekten" element={<Nekorekten />} />
                    <Route path="/:secretPath/crm" element={<CRM />} />
                    <Route path="/:secretPath/finance" element={<Finance />} />
                    <Route path="/:secretPath/analytics" element={<Analytics />} />
                    <Route path="/:secretPath/returns" element={<Returns />} />
                    
                    {/* Catch-all for 404 */}
                    <Route path="*" element={<NotFound />} />
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
