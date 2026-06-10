const HTTP_PORT = Number(process.env.PORT) || 3000;
const GRPC_PORT = Number(process.env.GRPC_PORT) || 50051;
const BASE = `http://localhost:${HTTP_PORT}`;

function section(title) {
  console.log('\n' + '='.repeat(60));
  console.log(title);
  console.log('='.repeat(60));
}

function printJson(label, data) {
  const json = JSON.stringify(data, null, 2);
  console.log(`\n${label} (${json.length} bytes):`);
  console.log(json);
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`${url} -> ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function runRestDemo() {
  section('REST — fixed endpoints, full JSON payloads');

  const allBooks = await fetchJson(`${BASE}/api/books`);
  printJson('GET /api/books', allBooks);

  const oneBook = await fetchJson(`${BASE}/api/books/2`);
  printJson('GET /api/books/2', oneBook);

  console.log('\nREST characteristics:');
  console.log('  - Multiple URLs for different resources');
  console.log('  - Response shape is fixed by the server (over-fetching)');
  console.log('  - Human-readable JSON over HTTP');
}

async function runGraphqlDemo() {
  section('GraphQL — single endpoint, client picks fields');

  const fullQuery = {
    query: `{
  book(id: "2") {
    title
    genre
    pages
    publishedYear
    isbn
    description
    author { id name country birthYear }
  }
}`,
  };

  const minimalQuery = {
    query: `{
  book(id: "2") {
    title
    author { name }
  }
}`,
  };

  const full = await fetchJson(`${BASE}/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fullQuery),
  });
  printJson('POST /graphql (full query)', full);

  const minimal = await fetchJson(`${BASE}/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(minimalQuery),
  });
  printJson('POST /graphql (minimal query — only title + author name)', minimal);

  console.log('\nGraphQL characteristics:');
  console.log('  - One endpoint (POST /graphql)');
  console.log('  - Client requests exactly the fields it needs');
  console.log('  - Nested data in a single round trip');
}

async function runGrpcDemo() {
  section('gRPC — binary protocol, schema defined in .proto');

  const { callGrpcDemo } = await import('../grpc/server.js');
  const book = await callGrpcDemo(GRPC_PORT);
  printJson('BookService.GetBook({ id: "2" })', book);

  console.log('\ngRPC characteristics:');
  console.log('  - Contract-first via book.proto (strong typing)');
  console.log('  - Binary serialization (smaller & faster than JSON)');
  console.log('  - HTTP/2 based — great for service-to-service calls');
  console.log('  - Not browser-friendly without a proxy (grpc-web)');
}

async function main() {
  console.log('Waiting for server...');
  for (let attempt = 1; attempt <= 15; attempt++) {
    try {
      await fetchJson(`${BASE}/api/info`);
      break;
    } catch {
      if (attempt === 15) {
        console.error('Server not reachable. Run: npm start');
        process.exit(1);
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  await runRestDemo();
  await runGraphqlDemo();
  await runGrpcDemo();

  section('Summary');
  console.log(`
  | Aspect          | REST              | GraphQL           | gRPC              |
  |-----------------|-------------------|-------------------|-------------------|
  | Endpoint style  | Multiple URLs     | Single /graphql   | RPC methods       |
  | Data shape      | Server-defined    | Client-selected   | Proto-defined     |
  | Format          | JSON (text)       | JSON (text)       | Protobuf (binary) |
  | Best for        | Simple public APIs| Flexible clients  | Microservices     |
`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
