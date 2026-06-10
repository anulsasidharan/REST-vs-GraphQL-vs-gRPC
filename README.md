# GraphQL vs REST vs gRPC Demo

A small Node.js app that exposes the same **book catalog** through three API styles so you can compare how each one works.

## Quick Start

```bash
npm install
npm start
```

Open **http://localhost:3000** for the interactive comparison UI.

## What's Included

| Protocol | Endpoint | Port |
|----------|----------|------|
| **REST** | `GET /api/books`, `GET /api/books/:id` | 3000 |
| **GraphQL** | `POST /graphql` | 3000 |
| **gRPC** | `BookService.ListBooks`, `GetBook`, `GetAuthor` | 50051 |

All three read from the same in-memory dataset (`src/data/store.js`).

## Demonstrating Response Differences

### Option 1 — Web UI (recommended)

1. Run `npm start`
2. Open http://localhost:3000
3. Click **Run All Comparisons** to see REST, GraphQL, and gRPC side by side

Notice:
- **REST** always returns the full book + author object
- **GraphQL** returns only the fields you request (`title`, `author.name`)
- **gRPC** uses protobuf field names (`published_year` vs `publishedYear`) and binary on the wire

### Option 2 — CLI demo script

In one terminal:

```bash
npm start
```

In another:

```bash
npm run demo
```

### Option 3 — Manual curl examples

**REST** — fixed URL, full payload:

```bash
curl http://localhost:3000/api/books/2
```

**GraphQL** — single endpoint, pick your fields:

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"{ book(id: \\\"2\\\") { title author { name } } }\"}"
```

**gRPC** — use the browser proxy (or `npm run demo`):

```bash
curl http://localhost:3000/api/grpc/book/2
```

## Key Differences Highlighted

| | REST | GraphQL | gRPC |
|---|------|---------|------|
| **Endpoints** | Multiple resource URLs | One `/graphql` endpoint | RPC methods on a service |
| **Data shape** | Server decides | Client selects fields | Defined in `.proto` file |
| **Format** | JSON (human-readable) | JSON (human-readable) | Protobuf (binary, compact) |
| **Transport** | HTTP/1.1 | HTTP/1.1 | HTTP/2 |
| **Best for** | Simple public APIs, caching | Flexible frontends, mobile | Microservice-to-microservice |

## Project Structure

```
src/
  data/store.js       # Shared book & author data
  rest/server.js      # REST endpoints
  graphql/            # GraphQL schema & resolvers
  grpc/               # Protobuf definition & gRPC server
  demo/compare.js     # CLI comparison script
  index.js            # Starts all servers
public/
  index.html          # Interactive demo UI
```

## gRPC Note

Browsers cannot speak gRPC natively. This demo includes `GET /api/grpc/book/:id` as a thin HTTP proxy that calls the gRPC server and returns JSON for easy comparison. In production, backend services communicate via gRPC directly.
