'use strict';

// export PORT=3000
// export CLIENT_URL=http://localhost:8080
// export DATABASE_URL=postgres://localhost:5432/books_app


const express = require('express');
const cors = require('cors');
const pg = require('pg');

const app = express();
const PORT = process.env.PORT;
const CLIENT_URL = process.env.CLIENT_URL;

const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', err => console.error(err));

app.use(cors());

app.get('/api/v1/books', (request, response) => {
    client.query(`SELECT book_id, title, author, image_url FROM books;`)
    .then(result => response.send(result.rows))
    .catch(console.error);
});
// app.get('/api/v1/books/new', (request, response) => {
//   .then(result => response.send(result.rows))
//   .catch(console.error);
// }
app.get('/api/v1/books/:id', (request, response) => {
  // console.log(request)
  client.query(`SELECT book_id, title, author, isbn, image_url, description FROM books WHERE book_id=${request.params.id};`)
  // .then(results => console.log(results.rows))
  .then(result => response.send(result.rows))
  .catch(console.error);
});

app.post('/api/v1/books'), (request, response) => {
  client.query(
    'INSERT INTO books (title, author, isbn, image_url, description) VALUES ($1,$2,$3,$4,$5)',
    [request.body.title, request.body.author, request.body.isbn, request.body.image_url, request.body.description],
    function(err) {
      if (err) console.error(err);
      response.send('insert complete');
    }
  )
}
app.get('*', (req, res) => res.redirect(CLIENT_URL));
app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));
