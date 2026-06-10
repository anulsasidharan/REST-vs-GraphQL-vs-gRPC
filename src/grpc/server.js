import path from 'node:path';
import { fileURLToPath } from 'node:url';
import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import {
  enrichBook,
  getAllBooks,
  getAuthorById,
  getBookById,
} from '../data/store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROTO_PATH = path.join(__dirname, 'book.proto');

function toGrpcAuthor(author) {
  if (!author) return undefined;
  return {
    id: author.id,
    name: author.name,
    country: author.country,
    birth_year: author.birthYear,
  };
}

function toGrpcBook(book) {
  const enriched = enrichBook(book);
  return {
    id: enriched.id,
    title: enriched.title,
    genre: enriched.genre,
    pages: enriched.pages,
    published_year: enriched.publishedYear,
    isbn: enriched.isbn,
    description: enriched.description,
    author: toGrpcAuthor(enriched.author),
  };
}

export function startGrpcServer(port) {
  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });

  const bookProto = grpc.loadPackageDefinition(packageDefinition).books;

  const server = new grpc.Server();

  server.addService(bookProto.BookService.service, {
    ListBooks: (_call, callback) => {
      callback(null, {
        books: getAllBooks().map(toGrpcBook),
      });
    },
    GetBook: (call, callback) => {
      const book = getBookById(call.request.id);
      if (!book) {
        return callback({
          code: grpc.status.NOT_FOUND,
          message: 'Book not found',
        });
      }
      callback(null, toGrpcBook(book));
    },
    GetAuthor: (call, callback) => {
      const author = getAuthorById(call.request.id);
      if (!author) {
        return callback({
          code: grpc.status.NOT_FOUND,
          message: 'Author not found',
        });
      }

      callback(null, toGrpcAuthor(author));
    },
  });

  return new Promise((resolve, reject) => {
    server.bindAsync(
      `0.0.0.0:${port}`,
      grpc.ServerCredentials.createInsecure(),
      (error, boundPort) => {
        if (error) {
          reject(error);
          return;
        }
        resolve({ server, port: boundPort });
      }
    );
  });
}

const grpcClients = new Map();

function getGrpcClient(port) {
  if (!grpcClients.has(port)) {
    const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });

    const bookProto = grpc.loadPackageDefinition(packageDefinition).books;
    grpcClients.set(
      port,
      new bookProto.BookService(
        `localhost:${port}`,
        grpc.credentials.createInsecure()
      )
    );
  }
  return grpcClients.get(port);
}

export async function callGrpcDemo(port, id = '2') {
  const client = getGrpcClient(port);

  return new Promise((resolve, reject) => {
    client.GetBook({ id }, (error, response) => {
      if (error) reject(error);
      else resolve(response);
    });
  });
}
