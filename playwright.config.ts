import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  reporter: [['list']],
  use: { baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure' },
  webServer: {
    command: 'pnpm dev --host 127.0.0.1',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 5'] } },
    { name: 'webkit-motion', testMatch: /motion\/.*\.spec\.ts/, use: { ...devices['Desktop Safari'] } },
    { name: 'webkit-readability', testMatch: /readability\/.*\.spec\.ts/, use: { ...devices['Desktop Safari'] } },
  ],
})
