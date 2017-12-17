'use strict';

// export PORT=3000
// export CLIENT_URL=http://localhost:8080
// export DATABASE_URL=postgres://localhost:5432/books_app

const express = require('express');
const cors = require('cors');
const pg = require('pg');
const bodyparser = require('body-parser').urlencoded({extended:true});
const superagent = require('superagent');

const app = express();
const PORT = process.env.PORT;
const CLIENT_URL = process.env.CLIENT_URL;
const API_KEY = process.env.GOOGLE_API_KEY

const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', err => console.error(err));

app.use(cors());
app.use(bodyparser);
app.get('/api/v1/books', (request, response) => {
    client.query(`SELECT book_id, title, author, image_url FROM books;`)
    .then(result => response.send(result.rows))
    .catch(console.error);
});


app.get('/api/v1/books/find', (req, res) => {
  let url = 'https://www.googleapis.com/books/v1/volumes';
  let query = ''
  if(req.query.title) query += `+intitle:${req.query.title}`;
  if(req.query.author) query += `+inauthor:${req.query.author}`;
  if(req.query.isbn) query += `+isbn:${req.query.isbn}`;

  superagent.get(url)
    .query({'q': query})
    .query({'key': API_KEY})
    .then(response => response.body.items.map((book, idx) => {
      let { title, authors, industryIdentifiers, imageLinks, description } = book.volumeInfo;
      let placeholderImage = 'http://www.newyorkpaddy.com/images/covers/NoCoverAvailable.jpg';

      return {
        title: title ? title : 'No title available',
        author: authors ? authors[0] : 'No authors available',
        isbn: industryIdentifiers ? `ISBN_13 ${industryIdentifiers[0].identifier}` : 'No ISBN available',
        image_url: imageLinks ? imageLinks.smallThumbnail : placeholderImage,
        description: description ? description : 'No description available',
        book_id: industryIdentifiers ? `${industryIdentifiers[0].identifier}` : '',
      }
    }))
    .then(arr => res.send(arr))
    .catch(console.error)
})

app.get('/api/v1/books/find/:isbn', (req, res) => {
  let url = 'https://www.googleapis.com/books/v1/volumes';
  superagent.get(url)
    .query({'q': `+isbn:${req.params.isbn}`})
    .query({'key': API_KEY})
    .then(res => res.body.items.map((book, idx) => {
      let { title, authors, industryIdentifiers, imageLinks, description } = book.volumeInfo;
      let placeholderImage = 'http://www.newyorkpaddy.com/images/covers/NoCoverAvailable.jpg';
      console.log(res)

      return {
        title: title ? title : 'No title available',
        author: authors ? authors[0] : 'No authors available',
        isbn: industryIdentifiers ? `ISBN_13 ${industryIdentifiers[0].identifier}` : 'No ISBN available',
        image_url: imageLinks ? imageLinks.smallThumbnail : placeholderImage,
        description: description ? description : 'No description available',
        book_id: industryIdentifiers ? `${industryIdentifiers[0].identifier}` : '',
      }
    }))
    .then(book => res.send(book[0]))
    .catch(console.error)
})

app.get('/api/v1/books/:id', (request, response) => {
  client.query(`SELECT book_id, title, author, isbn, image_url, description FROM books WHERE book_id=${request.params.id};`)
  .then(result => response.send(result.rows))
  .catch(console.error);
});

app.put('/api/v1/books/:id', bodyparser, (request, response) => {
  client.query(
    `UPDATE books SET title=$1, author=$2, isbn=$3, image_url=$4, description=$5 WHERE book_id=$6;`,
    [request.body.title, request.body.author, request.body.isbn, request.body.image_url, request.body.description, request.params.id]
  )
  .then(() => response.sendStatus(204))
  .catch(console.error);
});

app.post('/api/v1/books', (request, response) => {
  client.query(
    'INSERT INTO books (title, author, isbn, image_url, description) VALUES ($1,$2,$3,$4,$5)',
    [request.body.title, request.body.author, request.body.isbn, request.body.image_url, request.body.description],
    function(err) {
      if (err) console.error(err);
      response.send('insert complete');
    }
  )
})

app.delete('/api/v1/books/:id', (request, response) => {
  client.query(
    `DELETE FROM books WHERE book_id=$1;`,
    [request.params.id]
  )
  .then(() => response.sendStatus(204))
  .catch(console.error);
});

app.get('*', (req, res) => res.redirect(CLIENT_URL));
app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));
