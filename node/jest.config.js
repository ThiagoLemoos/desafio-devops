module.exports = {
  testEnvironment: "node",
  coverageDirectory: "coverage",
  collectCoverageFrom: [
    "**/*.js",
    "!node_modules/**",
    "!coverage/**",
    "!jest.config.js",
    "!server.js",
  ],
  testMatch: ["**/__tests__/**/*.js", "**/?(*.)+(spec|test).js"],
  forceExit: true,
  detectOpenHandles: false,
};
