import {
  getAllBooks,
  getAuthorById,
  getBookById,
  getBooksByAuthorId,
} from '../data/store.js';

export const resolvers = {
  Query: {
    books: () => getAllBooks(),
    book: (_parent, { id }) => getBookById(id),
    author: (_parent, { id }) => getAuthorById(id),
  },
  Book: {
    author: (book) => getAuthorById(book.authorId),
  },
  Author: {
    books: (author) => getBooksByAuthorId(author.id),
  },
};
