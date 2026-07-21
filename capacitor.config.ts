import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.beatswipe.app',
  appName: 'BeatSwipe',
  // Points to the live Vercel deployment.
  // The WebView loads this URL — no static export needed, all API routes
  // and Supabase SSR auth continue working exactly as on the web.
  // Update this if you set a custom domain.
  server: {
    url: 'https://beatswipe.vercel.app',
    cleartext: false,
  },
  ios: {
    backgroundColor: '#000000',
    // Hides the white flash on launch before the WebView loads
    contentInset: 'automatic',
    scrollEnabled: false,
    // Required so the WebView sends push token to the app
    limitsNavigationsToAppBoundDomains: true,
  },
  android: {
    backgroundColor: '#000000',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#000000',
      showSpinner: false,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#00ff88',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
}

export default config
