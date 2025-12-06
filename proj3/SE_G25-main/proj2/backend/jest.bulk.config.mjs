export default {
  testEnvironment: "node",
  transform: {},
  moduleFileExtensions: ["js", "mjs", "json"],
  // Run these specific files in the isolated "Modern" environment
  testMatch: [
    "**/__tests__/controllers/bulkFeature.test.js",
    "**/__tests__/controllers/orderController.test.js"
  ],
  testTimeout: 30000,
  // Disable the setup file here to prevent path resolution errors
  setupFilesAfterEnv: [] 
};