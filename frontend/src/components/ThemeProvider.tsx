import { useEffect } from 'react';
import { useThemeStore } from '@/store/themeStore';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const apply = () => {
      const isDark = theme === 'dark' || (theme === 'system' && media.matches);
      root.classList.toggle('dark', isDark);
    };

    apply();

    if (theme === 'system') {
      media.addEventListener('change', apply);
      return () => media.removeEventListener('change', apply);
    }
  }, [theme]);

  return <>{children}</>;
}
