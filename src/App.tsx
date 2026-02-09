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
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Settings from "./pages/Settings";
import Inventory from "./pages/Inventory";
import Messages from "./pages/Messages";
import Nekorekten from "./pages/Nekorekten";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

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
                <Routes>
                  {/* Routes without secret path prefix */}
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/inventory" element={<Inventory />} />
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/nekorekten" element={<Nekorekten />} />
                  
                  {/* Routes with secret path prefix - using wildcard to capture any prefix */}
                  <Route path="/:secretPath/" element={<Index />} />
                  <Route path="/:secretPath/auth" element={<Auth />} />
                  <Route path="/:secretPath/settings" element={<Settings />} />
                  <Route path="/:secretPath/inventory" element={<Inventory />} />
                  <Route path="/:secretPath/messages" element={<Messages />} />
                  <Route path="/:secretPath/nekorekten" element={<Nekorekten />} />
                  
                  {/* Catch-all for 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </SecretPathGuard>
            </BrowserRouter>
          </TooltipProvider>
        </InterfaceTextsProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
