import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { Theme } from '../types';

const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const themes: Array<{ value: Theme; icon: React.ReactNode; label: string }> = [
    { value: 'light', icon: <Sun className="w-4 h-4" />, label: 'Light' },
    { value: 'dark', icon: <Moon className="w-4 h-4" />, label: 'Dark' },
    { value: 'system', icon: <Monitor className="w-4 h-4" />, label: 'System' },
  ];

  return (
    <div className="flex items-center bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
      {themes.map((themeOption) => (
        <button
          key={themeOption.value}
          onClick={() => setTheme(themeOption.value)}
          className={`
            flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium transition-colors
            ${
              theme === themeOption.value
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }
          `}
          title={themeOption.label}
        >
          {themeOption.icon}
          <span className="hidden sm:inline">{themeOption.label}</span>
        </button>
      ))}
    </div>
  );
};

export default ThemeToggle;