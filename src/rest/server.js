import express from 'express';
import {
  enrichBook,
  getAllBooks,
  getAuthorById,
  getBookById,
  getBooksByAuthorId,
} from '../data/store.js';

export function createRestApp() {
  const app = express();
  app.use(express.json());

  // REST: fixed resource URLs, returns full representations (often over-fetches)
  app.get('/api/books', (_req, res) => {
    const payload = getAllBooks().map(enrichBook);
    res.json({
      protocol: 'REST',
      method: 'GET',
      endpoint: '/api/books',
      note: 'Returns every book with the full author object embedded.',
      count: payload.length,
      data: payload,
    });
  });

  app.get('/api/books/:id', (req, res) => {
    const book = getBookById(req.params.id);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.json({
      protocol: 'REST',
      method: 'GET',
      endpoint: `/api/books/${req.params.id}`,
      note: 'Single resource endpoint with a fixed JSON shape.',
      data: enrichBook(book),
    });
  });

  app.get('/api/authors/:id', (req, res) => {
    const author = getAuthorById(req.params.id);
    if (!author) {
      return res.status(404).json({ error: 'Author not found' });
    }

    res.json({
      protocol: 'REST',
      method: 'GET',
      endpoint: `/api/authors/${req.params.id}`,
      note: 'Separate endpoint — fetching books + author details may need multiple HTTP calls.',
      data: {
        ...author,
        books: getBooksByAuthorId(author.id),
      },
    });
  });

  return app;
}
