import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const TIMEOUT_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
const WARNING_DURATION = 2 * 60 * 1000; // Show warning 2 minutes before timeout

export const useSessionTimeout = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const clearAllTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
      warningRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const handleLogout = useCallback(async () => {
    clearAllTimers();
    setShowWarning(false);
    
    toast({
      title: 'Сесията изтече',
      description: 'Бяхте изведени от системата поради неактивност.',
      variant: 'destructive',
    });
    
    await signOut();
  }, [signOut, toast, clearAllTimers]);

  const startWarningCountdown = useCallback(() => {
    const warningSeconds = WARNING_DURATION / 1000;
    setRemainingSeconds(warningSeconds);
    setShowWarning(true);

    toast({
      title: 'Внимание',
      description: `Сесията ви ще изтече след ${Math.floor(warningSeconds / 60)} минути поради неактивност.`,
      duration: 10000,
    });

    countdownRef.current = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [toast]);

  const resetTimer = useCallback(() => {
    if (!user) return;

    clearAllTimers();
    setShowWarning(false);

    // Set warning timer (fires 2 minutes before logout)
    warningRef.current = setTimeout(() => {
      startWarningCountdown();
    }, TIMEOUT_DURATION - WARNING_DURATION);

    // Set logout timer
    timeoutRef.current = setTimeout(() => {
      handleLogout();
    }, TIMEOUT_DURATION);
  }, [user, clearAllTimers, startWarningCountdown, handleLogout]);

  const extendSession = useCallback(() => {
    resetTimer();
    setShowWarning(false);
    
    toast({
      title: 'Сесията е удължена',
      description: 'Ще бъдете изведени след 30 минути неактивност.',
    });
  }, [resetTimer, toast]);

  useEffect(() => {
    if (!user) {
      clearAllTimers();
      setShowWarning(false);
      return;
    }

    // Activity events to track
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

    // Debounce activity handler to prevent too many resets
    let activityTimeout: NodeJS.Timeout | null = null;
    
    const handleActivity = () => {
      // Don't reset if warning is showing - user must explicitly extend
      if (showWarning) return;

      if (activityTimeout) {
        clearTimeout(activityTimeout);
      }
      
      activityTimeout = setTimeout(() => {
        resetTimer();
      }, 1000); // Debounce for 1 second
    };

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Start initial timer
    resetTimer();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      if (activityTimeout) {
        clearTimeout(activityTimeout);
      }
      clearAllTimers();
    };
  }, [user, resetTimer, clearAllTimers, showWarning]);

  return {
    showWarning,
    remainingSeconds,
    extendSession,
    logout: handleLogout,
  };
};
