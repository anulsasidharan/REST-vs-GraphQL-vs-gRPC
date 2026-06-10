import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import express from 'express';
import { createRestApp } from './rest/server.js';
import { typeDefs } from './graphql/schema.js';
import { resolvers } from './graphql/resolvers.js';
import { callGrpcDemo, startGrpcServer } from './grpc/server.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HTTP_PORT = Number(process.env.PORT) || 3000;
const GRPC_PORT = Number(process.env.GRPC_PORT) || 50051;

async function main() {
  const app = express();
  const restApp = createRestApp();

  app.use(cors());
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '../public')));

  app.use(restApp);

  const apollo = new ApolloServer({
    typeDefs,
    resolvers,
  });
  await apollo.start();

  app.use(
    '/graphql',
    cors(),
    express.json(),
    expressMiddleware(apollo, {
      context: async () => ({}),
    })
  );

  // Browser-friendly proxy so gRPC responses can be compared in the web UI
  app.get('/api/grpc/book/:id', async (req, res) => {
    try {
      const book = await callGrpcDemo(GRPC_PORT, req.params.id);
      res.json({
        protocol: 'gRPC',
        method: 'BookService.GetBook',
        note: 'Proxied from gRPC for browser demo. Wire format is binary protobuf.',
        wireFormat: 'application/grpc+proto (binary)',
        data: book,
      });
    } catch (error) {
      res.status(500).json({ error: String(error.message ?? error) });
    }
  });

  app.get('/api/info', (_req, res) => {
    res.json({
      title: 'GraphQL vs REST vs gRPC Demo',
      endpoints: {
        rest: {
          listBooks: `http://localhost:${HTTP_PORT}/api/books`,
          getBook: `http://localhost:${HTTP_PORT}/api/books/2`,
          getAuthor: `http://localhost:${HTTP_PORT}/api/authors/2`,
        },
        graphql: {
          url: `http://localhost:${HTTP_PORT}/graphql`,
          exampleQuery: {
            operationName: null,
            query: `{
  book(id: "2") {
    title
    genre
    author { name }
  }
}`,
          },
        },
        grpc: {
          port: GRPC_PORT,
          proto: 'src/grpc/book.proto',
          methods: ['ListBooks', 'GetBook', 'GetAuthor'],
        },
      },
    });
  });

  await startGrpcServer(GRPC_PORT);

  app.listen(HTTP_PORT, () => {
    console.log('');
    console.log('  GraphQL vs REST vs gRPC Demo');
    console.log('  =============================');
    console.log(`  Web UI:    http://localhost:${HTTP_PORT}`);
    console.log(`  REST:      http://localhost:${HTTP_PORT}/api/books`);
    console.log(`  GraphQL:   http://localhost:${HTTP_PORT}/graphql`);
    console.log(`  gRPC:      localhost:${GRPC_PORT}`);
    console.log('');
  });
}

main().catch((error) => {
  console.error('Failed to start servers:', error);
  process.exit(1);
});
