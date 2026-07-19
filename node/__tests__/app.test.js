const request = require("supertest");
const app = require("../index");

// Mock database connection
jest.mock("../connectionDb", () => ({
  query: jest.fn((sql, callback) => {
    if (sql.includes("INSERT")) {
      callback(null, { insertId: 1 });
    } else if (sql.includes("SELECT")) {
      callback(null, [{ name: "Test User 1" }, { name: "Test User 2" }]);
    }
  }),
}));

describe("API Health Check", () => {
  test("GET /health should return OK", async () => {
    const response = await request(app).get("/health");
    expect(response.statusCode).toBe(200);
    expect(response.text).toBe("OK");
  });
});

describe("API Root Endpoint", () => {
  test("GET / should return HTML content", async () => {
    const response = await request(app).get("/");
    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toContain("text/html");
    expect(response.text).toContain("Desafio Devops!");
  }, 10000);
});
