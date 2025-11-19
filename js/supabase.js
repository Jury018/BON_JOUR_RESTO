// supabase.js - Supabase client initialization
(function() {
  'use strict';

  // Wait for Supabase library to be loaded
  function initializeSupabase() {
    if (typeof supabase === 'undefined') {
      console.error('Supabase JS library not loaded. Please include the CDN script.');
      return false;
    }

    if (!window.supabase) {
      try {
        window.supabase = supabase.createClient(
          'https://ybpfjtlygmrvhwtbfzxm.supabase.co',
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlicGZqdGx5Z21ydmh3dGJmenhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0NzU4NzcsImV4cCI6MjA3OTA1MTg3N30.Yp9VcLN4XgBLUBw_bBWpEEaP851wCPVCjhIQ-Id1WN0'
        );
        console.log('Supabase client initialized successfully');
        return true;
      } catch (error) {
        console.error('Failed to initialize Supabase client:', error);
        return false;
      }
    }
    return true;
  }

  // Try to initialize immediately
  if (!initializeSupabase()) {
    // If initialization failed, wait for the library to load
    window.addEventListener('load', function() {
      initializeSupabase();
    });
  }
})();