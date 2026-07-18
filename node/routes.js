const express = require('express');
const routes = express.Router();
const faker = require('faker');
faker.locale = 'pt_BR';

const connection = require('./connectionDb');

routes.get('/health', (_, res) => {
    return res.send('OK');
})

routes.get('/', (_, res) => {
    const sql = `INSERT INTO peoples(name) VALUES('${faker.name.findName()}')`;

    connection.query(sql, (err) => {

        if (err) {
            console.error(err);
            return res.status(500).send(err.message);
        }

        connection.query("SELECT * FROM peoples", (err, results) => {

            if (err) {
                console.error(err);
                return res.status(500).send(err.message);
            }

            let html = "<h1>Desafio Devops!</h1>";

            results.forEach(person => {
                html += `${person.name}<br>`;
            });

            res.send(html);
        });
    });
});

module.exports = routes;