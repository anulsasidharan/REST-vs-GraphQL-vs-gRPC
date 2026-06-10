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

The app is organized so each API style lives in its own folder, while all three share the same data source. A single entry point wires everything together.

```
ProjDemo/
├── package.json              # Dependencies and npm scripts
├── .gitignore                # Ignores node_modules and .env
├── README.md                 # This file
│
├── public/
│   └── index.html            # Interactive web UI for side-by-side comparison
│
└── src/
    ├── index.js              # Main entry — starts HTTP + gRPC servers
    │
    ├── data/
    │   └── store.js          # Shared in-memory book & author dataset
    │
    ├── rest/
    │   └── server.js         # REST API routes (Express)
    │
    ├── graphql/
    │   ├── schema.js         # GraphQL type definitions (SDL)
    │   └── resolvers.js      # GraphQL query/resolver logic
    │
    ├── grpc/
    │   ├── book.proto        # Protobuf service contract
    │   └── server.js         # gRPC server + client helper
    │
    └── demo/
        └── compare.js        # CLI script that calls all three APIs
```

### Root files

| File | Purpose |
|------|---------|
| `package.json` | Defines the project, npm scripts (`start`, `demo`), and dependencies (Express, Apollo Server, gRPC). Uses ES modules (`"type": "module"`). |
| `.gitignore` | Excludes `node_modules/` and `.env` from version control. |
| `README.md` | Setup instructions, usage examples, and architecture notes. |

### `public/` — Web UI

| File | Purpose |
|------|---------|
| `index.html` | Single-page demo UI. Provides buttons to call REST, GraphQL, and the gRPC proxy, then displays responses side by side with byte-size comparison. No build step — plain HTML/CSS/JS served by Express. |

### `src/` — Application code

#### `index.js` — Orchestrator

The main entry point. It:

- Creates an Express app and mounts the REST routes from `rest/server.js`
- Starts Apollo Server and mounts GraphQL at `/graphql`
- Serves static files from `public/`
- Exposes helper HTTP routes:
  - `GET /api/info` — lists all available endpoints and example queries
  - `GET /api/grpc/book/:id` — HTTP proxy to gRPC (browsers cannot call gRPC directly)
- Starts the gRPC server on port `50051` (configurable via `GRPC_PORT`)
- Listens for HTTP on port `3000` (configurable via `PORT`)

#### `data/store.js` — Shared data layer

Single source of truth for the demo. Contains:

- In-memory arrays of **authors** and **books**
- Helper functions: `getAllBooks()`, `getBookById()`, `getAuthorById()`, `getBooksByAuthorId()`, `enrichBook()`

All three API implementations import from here, so every protocol returns the same underlying data — the differences you see are purely about **how** the data is exposed, not **what** data exists.

#### `rest/server.js` — REST API

Exports `createRestApp()`, an Express router with resource-oriented endpoints:

| Route | Purpose |
|-------|---------|
| `GET /api/books` | Returns all books with full author objects embedded |
| `GET /api/books/:id` | Returns one book with its full author |
| `GET /api/authors/:id` | Returns an author and their books (separate resource) |

Responses include metadata (`protocol`, `endpoint`, `note`) to highlight REST characteristics like fixed response shapes and multiple URLs.

#### `graphql/schema.js` — GraphQL schema

Defines the GraphQL type system in SDL (Schema Definition Language):

- Types: `Book`, `Author`
- Queries: `books`, `book(id)`, `author(id)`
- Relationships: `Book.author` and `Author.books` (resolved lazily)

The schema describes **what can be queried**, not how data is fetched.

#### `graphql/resolvers.js` — GraphQL resolvers

Maps GraphQL fields to the shared data store:

- Root queries delegate to `store.js` functions
- Nested fields (`Book.author`, `Author.books`) are resolved on demand

This is what enables GraphQL's field selection — the client chooses which fields to include in the query, and only those resolvers run.

#### `grpc/book.proto` — gRPC contract

Protobuf definition of the `BookService` RPC interface:

| RPC method | Purpose |
|------------|---------|
| `ListBooks` | Returns all books |
| `GetBook` | Returns one book by ID |
| `GetAuthor` | Returns one author by ID |

Also defines message types (`Book`, `Author`, request/response wrappers). Field names use **snake_case** (`published_year`, `birth_year`) per protobuf convention — notice the difference from REST/GraphQL's camelCase.

#### `grpc/server.js` — gRPC server & client

Two responsibilities:

1. **`startGrpcServer(port)`** — Loads `book.proto`, implements the RPC handlers, and binds to the given port
2. **`callGrpcDemo(port, id)`** — Creates a gRPC client to call `GetBook` (used by the HTTP proxy and CLI demo)

Transforms data from the JS store (camelCase) into protobuf message format (snake_case) via `toGrpcBook()` and `toGrpcAuthor()`.

#### `demo/compare.js` — CLI comparison

Standalone script (run via `npm run demo`) that:

1. Waits for the server to be reachable
2. Calls REST, GraphQL (full + minimal queries), and gRPC sequentially
3. Prints responses with byte sizes and a summary comparison table

Useful for terminal-based demos or recording output for presentations.

### How the pieces connect

```
                    ┌─────────────────────────────────┐
                    │         src/index.js            │
                    │  (Express HTTP + gRPC starter)  │
                    └──────────┬──────────────────────┘
           ┌───────────────────┼───────────────────┐
           │                   │                   │
    ┌──────▼──────┐    ┌───────▼───────┐   ┌──────▼──────┐
    │ rest/       │    │ graphql/      │   │ grpc/       │
    │ server.js   │    │ schema.js     │   │ server.js   │
    │             │    │ resolvers.js  │   │ book.proto  │
    └──────┬──────┘    └───────┬───────┘   └──────┬──────┘
           │                   │                   │
           └───────────────────┼───────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   data/store.js   │
                    │  (books + authors)│
                    └───────────────────┘
```

All three API layers read from the same store. The web UI (`public/index.html`) and CLI demo (`demo/compare.js`) are clients that call into these endpoints to show the differences.

## gRPC Note

Browsers cannot speak gRPC natively. This demo includes `GET /api/grpc/book/:id` as a thin HTTP proxy that calls the gRPC server and returns JSON for easy comparison. In production, backend services communicate via gRPC directly.
