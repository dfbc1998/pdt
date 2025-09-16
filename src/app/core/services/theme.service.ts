// src/app/core/services/theme.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type ThemeMode = 'light' | 'dark' | 'auto';
export type ThemeColor = 'blue' | 'purple' | 'green';

export interface ThemeConfig {
    mode: ThemeMode;
    color: ThemeColor;
    highContrast: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    private readonly STORAGE_KEY = 'fw-theme-config';
    private readonly DEFAULT_CONFIG: ThemeConfig = {
        mode: 'light',
        color: 'blue',
        highContrast: false
    };

    private configSubject = new BehaviorSubject<ThemeConfig>(this.DEFAULT_CONFIG);
    public config$: Observable<ThemeConfig> = this.configSubject.asObservable();

    private mediaQuery: MediaQueryList;

    constructor() {
        this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        this.loadConfig();
        this.applyTheme();

        // Listen for system theme changes
        this.mediaQuery.addEventListener('change', () => {
            if (this.configSubject.value.mode === 'auto') {
                this.applyTheme();
            }
        });
    }

    /**
     * Get current theme configuration
     */
    getCurrentConfig(): ThemeConfig {
        return this.configSubject.value;
    }

    /**
     * Set theme mode (light, dark, auto)
     */
    setMode(mode: ThemeMode): void {
        const config = { ...this.configSubject.value, mode };
        this.updateConfig(config);
    }

    /**
     * Set theme color variant
     */
    setColor(color: ThemeColor): void {
        const config = { ...this.configSubject.value, color };
        this.updateConfig(config);
    }

    /**
     * Toggle high contrast mode
     */
    toggleHighContrast(): void {
        const config = {
            ...this.configSubject.value,
            highContrast: !this.configSubject.value.highContrast
        };
        this.updateConfig(config);
    }

    /**
     * Toggle between light and dark themes
     */
    toggleMode(): void {
        const currentMode = this.configSubject.value.mode;
        let newMode: ThemeMode;

        switch (currentMode) {
            case 'light':
                newMode = 'dark';
                break;
            case 'dark':
                newMode = 'light';
                break;
            case 'auto':
                newMode = this.getSystemTheme() === 'dark' ? 'light' : 'dark';
                break;
            default:
                newMode = 'light';
        }

        this.setMode(newMode);
    }

    /**
     * Get the effective theme (resolves 'auto' to actual theme)
     */
    getEffectiveTheme(): 'light' | 'dark' {
        const config = this.configSubject.value;

        if (config.mode === 'auto') {
            return this.getSystemTheme();
        }

        return config.mode as 'light' | 'dark';
    }

    /**
     * Check if dark theme is currently active
     */
    isDarkTheme(): boolean {
        return this.getEffectiveTheme() === 'dark';
    }

    /**
     * Get system theme preference
     */
    private getSystemTheme(): 'light' | 'dark' {
        return this.mediaQuery.matches ? 'dark' : 'light';
    }

    /**
     * Load configuration from storage
     */
    private loadConfig(): void {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                const config = JSON.parse(stored) as ThemeConfig;
                this.configSubject.next({ ...this.DEFAULT_CONFIG, ...config });
            }
        } catch (error) {
            console.warn('Failed to load theme config from storage:', error);
        }
    }

    /**
     * Save configuration to storage
     */
    private saveConfig(config: ThemeConfig): void {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
        } catch (error) {
            console.warn('Failed to save theme config to storage:', error);
        }
    }

    /**
     * Update configuration and apply theme
     */
    private updateConfig(config: ThemeConfig): void {
        // Disable transitions temporarily for better UX
        document.body.classList.add('theme-transition-disabled');

        this.configSubject.next(config);
        this.saveConfig(config);
        this.applyTheme();

        // Re-enable transitions after a short delay
        setTimeout(() => {
            document.body.classList.remove('theme-transition-disabled');
        }, 50);
    }

    /**
     * Apply theme to DOM
     */
    private applyTheme(): void {
        const config = this.configSubject.value;
        const effectiveTheme = this.getEffectiveTheme();

        // Remove existing theme classes
        document.body.classList.remove('theme-light', 'theme-dark', 'theme-blue', 'theme-purple', 'theme-green', 'theme-high-contrast');

        // Remove existing data-theme attributes
        document.documentElement.removeAttribute('data-theme');

        // Apply theme mode
        document.body.classList.add(`theme-${effectiveTheme}`);
        document.documentElement.setAttribute('data-theme', effectiveTheme);

        // Apply color variant
        document.body.classList.add(`theme-${config.color}`);
        if (config.color !== 'blue') {
            document.documentElement.setAttribute('data-theme', config.color);
        }

        // Apply high contrast if enabled
        if (config.highContrast) {
            document.body.classList.add('theme-high-contrast');
            document.documentElement.setAttribute('data-theme', 'high-contrast');
        }

        // Update meta theme-color for mobile browsers
        this.updateMetaThemeColor(effectiveTheme);

        // Emit theme change event for other components
        this.emitThemeChangeEvent(effectiveTheme, config);
    }

    /**
     * Update meta theme-color for mobile browsers
     */
    private updateMetaThemeColor(theme: 'light' | 'dark'): void {
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');

        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.setAttribute('name', 'theme-color');
            document.head.appendChild(metaThemeColor);
        }

        const color = theme === 'dark' ? '#1e293b' : '#ffffff';
        metaThemeColor.setAttribute('content', color);
    }

    /**
     * Emit custom theme change event
     */
    private emitThemeChangeEvent(theme: 'light' | 'dark', config: ThemeConfig): void {
        const event = new CustomEvent('themeChange', {
            detail: { theme, config }
        });
        window.dispatchEvent(event);
    }

    /**
     * Get available theme options for UI
     */
    getThemeOptions() {
        return {
            modes: [
                { value: 'light', label: 'Claro', icon: 'sunny-outline' },
                { value: 'dark', label: 'Oscuro', icon: 'moon-outline' },
                { value: 'auto', label: 'Automático', icon: 'phone-portrait-outline' }
            ] as Array<{ value: ThemeMode; label: string; icon: string }>,

            colors: [
                { value: 'blue', label: 'Azul Profesional', color: '#3b82f6' },
                { value: 'purple', label: 'Púrpura Creativo', color: '#a855f7' },
                { value: 'green', label: 'Verde Éxito', color: '#22c55e' }
            ] as Array<{ value: ThemeColor; label: string; color: string }>
        };
    }

    /**
     * Reset theme to default
     */
    resetToDefault(): void {
        this.updateConfig(this.DEFAULT_CONFIG);
    }

    /**
     * Get CSS custom property value
     */
    getCSSProperty(property: string): string {
        return getComputedStyle(document.documentElement)
            .getPropertyValue(property)
            .trim();
    }

    /**
     * Set CSS custom property value
     */
    setCSSProperty(property: string, value: string): void {
        document.documentElement.style.setProperty(property, value);
    }
}