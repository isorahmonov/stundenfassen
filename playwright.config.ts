// run: npx @playwright/test test
// Dev-Server muss separat laufen: npm run dev

export default {
  testDir: "./e2e",
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
    { name: "Mobile Chrome", use: { browserName: "chromium", viewport: { width: 390, height: 844 } } },
  ],
}
