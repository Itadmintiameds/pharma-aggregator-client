import { useEffect, useRef, useCallback } from 'react';
import { sellerAuthService } from '@/src/services/seller/authService';

export const useSessionManager = () => {
  const inactivityTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const isLoggingOutRef = useRef<boolean>(false);

  // Configuration - 30 minute inactivity
  const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minute

  // Handle logout
  const handleInactivityLogout = useCallback(async () => {
    if (isLoggingOutRef.current) {
      console.log('Already logging out, skipping...');
      return;
    }
    
    isLoggingOutRef.current = true;
    console.log('🚪 Logging out due to inactivity...');
    
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      await sellerAuthService.logout(refreshToken);
    } else {
      sellerAuthService.clearAuth();
    }
    
    if (typeof window !== 'undefined') {
      window.location.href = '/?showLogin=true&session=expired';
    }
  }, []);

  // Reset inactivity timer
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    
    inactivityTimerRef.current = setTimeout(() => {
      console.log(`⏰ No activity for ${INACTIVITY_LIMIT / 1000} seconds, logging out...`);
      handleInactivityLogout();
    }, INACTIVITY_LIMIT);
  }, [handleInactivityLogout, INACTIVITY_LIMIT]);

  // Handle user activity
  const handleUserActivity = useCallback(() => {
    resetInactivityTimer();
    console.log('🖱️ Activity detected - timer reset');
  }, [resetInactivityTimer]);

  // Set up event listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    console.log('🎯 Session Manager Initialized');
    console.log(`📊 Auto-logout after ${INACTIVITY_LIMIT / 1000} seconds of inactivity`);
    
    const activityEvents = [
      'mousedown', 'mousemove', 'keydown', 'keypress',
      'scroll', 'touchstart', 'touchmove', 'click',
      'wheel', 'focus', 'input', 'pointerdown', 'pointermove'
    ];

    activityEvents.forEach(event => {
      window.addEventListener(event, handleUserActivity);
      document.addEventListener(event, handleUserActivity);
    });

    // Start the inactivity timer
    resetInactivityTimer();

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up Session Manager');
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
        document.removeEventListener(event, handleUserActivity);
      });
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [handleUserActivity, resetInactivityTimer]);
};