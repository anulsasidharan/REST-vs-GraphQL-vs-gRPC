const authors = [
  { id: '1', name: 'Jane Austen', country: 'England', birthYear: 1775 },
  { id: '2', name: 'George Orwell', country: 'England', birthYear: 1903 },
  { id: '3', name: 'Haruki Murakami', country: 'Japan', birthYear: 1949 },
];

const books = [
  {
    id: '1',
    title: 'Pride and Prejudice',
    authorId: '1',
    genre: 'Romance',
    pages: 432,
    publishedYear: 1813,
    isbn: '978-0141439518',
    description: 'A witty comedy of manners following Elizabeth Bennet.',
  },
  {
    id: '2',
    title: '1984',
    authorId: '2',
    genre: 'Dystopian',
    pages: 328,
    publishedYear: 1949,
    isbn: '978-0451524935',
    description: 'A chilling vision of totalitarian surveillance.',
  },
  {
    id: '3',
    title: 'Norwegian Wood',
    authorId: '3',
    genre: 'Literary Fiction',
    pages: 296,
    publishedYear: 1987,
    isbn: '978-0375704024',
    description: 'A nostalgic story of love and loss in 1960s Tokyo.',
  },
  {
    id: '4',
    title: 'Animal Farm',
    authorId: '2',
    genre: 'Satire',
    pages: 112,
    publishedYear: 1945,
    isbn: '978-0451526342',
    description: 'An allegorical novella about power and corruption.',
  },
];

export function getAllBooks() {
  return books;
}

export function getBookById(id) {
  return books.find((book) => book.id === id) ?? null;
}

export function getAuthorById(id) {
  return authors.find((author) => author.id === id) ?? null;
}

export function getBooksByAuthorId(authorId) {
  return books.filter((book) => book.authorId === authorId);
}

export function enrichBook(book) {
  const author = getAuthorById(book.authorId);
  return {
    ...book,
    author: author
      ? {
          id: author.id,
          name: author.name,
          country: author.country,
          birthYear: author.birthYear,
        }
      : null,
  };
}
