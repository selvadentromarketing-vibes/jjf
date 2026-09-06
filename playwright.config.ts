import { defineConfig, devices } from '@playwright/test';

const exe = process.env.CHROMIUM_PATH; // the sandbox's preinstalled Chromium; unset in CI
const launchOptions = exe ? { executablePath: exe } : {};
const iphone = { ...devices['iPhone 14'], browserName: 'chromium' as const, defaultBrowserType: 'chromium' as const };

export default defineConfig({
  testDir: './tests',
  timeout: 45_000,
  fullyParallel: true,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: 'http://localhost:4321', trace: 'retain-on-failure', launchOptions },
  webServer: { command: 'npm run preview', url: 'http://localhost:4321/es/', reuseExistingServer: true, timeout: 90_000 },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], launchOptions } },
    { name: 'reduced', use: { ...devices['Desktop Chrome'], contextOptions: { reducedMotion: 'reduce' }, launchOptions } },
    { name: 'iphone', use: { ...iphone, launchOptions } },
    { name: 'in-app', use: { ...iphone, userAgent: `${devices['iPhone 14'].userAgent} Instagram 300.0.0.0.0`, launchOptions } },
  ],
});
