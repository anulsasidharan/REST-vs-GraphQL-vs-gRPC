export const typeDefs = `#graphql
  type Author {
    id: ID!
    name: String!
    country: String
    birthYear: Int
    books: [Book!]!
  }

  type Book {
    id: ID!
    title: String!
    genre: String
    pages: Int
    publishedYear: Int
    isbn: String
    description: String
    author: Author
  }

  type Query {
    books: [Book!]!
    book(id: ID!): Book
    author(id: ID!): Author
  }
`;
