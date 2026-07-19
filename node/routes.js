const express = require("express");
const routes = express.Router();
const faker = require("faker");
faker.locale = "pt_BR";

const connection = require("./connectionDb");
const { register, dbQueryDurationMicroseconds, dbQueriesTotal } = require("./metrics");

routes.get("/health", (_, res) => {
  return res.send("OK");
});

routes.get("/metrics", async (_, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

routes.get("/", (_, res) => {
  const sql = `INSERT INTO peoples(name) VALUES('${faker.name.findName()}')`;

  const insertStart = Date.now();
  connection.query(sql, (err) => {
    const insertDuration = (Date.now() - insertStart) / 1000;
    
    if (err) {
      dbQueryDurationMicroseconds.observe({ operation: 'insert' }, insertDuration);
      dbQueriesTotal.inc({ operation: 'insert', status: 'error' });
      console.error(err);
      return res.status(500).send(err.message);
    }

    dbQueryDurationMicroseconds.observe({ operation: 'insert' }, insertDuration);
    dbQueriesTotal.inc({ operation: 'insert', status: 'success' });

    const selectStart = Date.now();
    connection.query("SELECT * FROM peoples", (err, results) => {
      const selectDuration = (Date.now() - selectStart) / 1000;
      
      if (err) {
        dbQueryDurationMicroseconds.observe({ operation: 'select' }, selectDuration);
        dbQueriesTotal.inc({ operation: 'select', status: 'error' });
        console.error(err);
        return res.status(500).send(err.message);
      }

      dbQueryDurationMicroseconds.observe({ operation: 'select' }, selectDuration);
      dbQueriesTotal.inc({ operation: 'select', status: 'success' });

      let html = "<h1>Desafio Devops!</h1>";

      results.forEach((person) => {
        html += `${person.name}<br>`;
      });

      res.send(html);
    });
  });
});

module.exports = routes;
