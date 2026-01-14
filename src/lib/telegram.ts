declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
          };
          start_param?: string;
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          setText: (text: string) => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
        };
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        openLink: (url: string) => void;
        openTelegramLink: (url: string) => void;
      };
    };
  }
}

export const getTelegramWebApp = () => {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    return window.Telegram.WebApp;
  }
  return null;
};

export const getTelegramUser = () => {
  const webApp = getTelegramWebApp();
  return webApp?.initDataUnsafe?.user || null;
};

export const getReferralCode = () => {
  const webApp = getTelegramWebApp();
  return webApp?.initDataUnsafe?.start_param || null;
};

export const isTelegramWebApp = () => {
  return typeof window !== 'undefined' && !!window.Telegram?.WebApp;
};

export const hapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'medium') => {
  const webApp = getTelegramWebApp();
  webApp?.HapticFeedback?.impactOccurred(type);
};

export const notificationFeedback = (type: 'error' | 'success' | 'warning' = 'success') => {
  const webApp = getTelegramWebApp();
  webApp?.HapticFeedback?.notificationOccurred(type);
};

export const openLink = (url: string) => {
  const webApp = getTelegramWebApp();
  if (webApp) {
    webApp.openLink(url);
  } else {
    window.open(url, '_blank');
  }
};

export const openTelegramLink = (url: string) => {
  const webApp = getTelegramWebApp();
  if (webApp) {
    webApp.openTelegramLink(url);
  } else {
    window.open(url, '_blank');
  }
};

export const closeWebApp = () => {
  const webApp = getTelegramWebApp();
  webApp?.close();
};
