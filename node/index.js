const express = require("express");
const routes = require("./routes");
const { httpRequestDurationMicroseconds, httpRequestsTotal } = require("./metrics");

const app = express();

// Middleware to track HTTP request metrics
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    
    httpRequestDurationMicroseconds.observe(
      { method: req.method, route, status_code: res.statusCode },
      duration
    );
    
    httpRequestsTotal.inc({ method: req.method, route, status_code: res.statusCode });
  });
  
  next();
});

app.use(routes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});