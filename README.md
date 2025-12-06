# RockliffeProject

An Astro project with Vue.js integration, Node.js server support, and SQLite database connectivity.

## Features

- **Astro** - Modern static site generator with server-side rendering
- **Vue.js** - Integrated via `@astrojs/vue` for component-based UI
- **Node.js Adapter** - Server-side API routes support via `@astrojs/node`
- **SQLite** - Database connectivity via `better-sqlite3`
- **TypeScript** - Full type safety
- **Zod** - Schema validation library

## Project Structure

```
RockliffeProject/
├── src/
│   ├── components/
│   │   ├── LoginDialog.vue      # Login dialog component (placeholder)
│   │   ├── OrdersTable.vue      # Orders table component (placeholder)
│   │   └── OrderDetails.vue     # Order details component (placeholder)
│   ├── lib/
│   │   └── db.ts                 # Database connection (placeholder)
│   └── pages/
│       ├── api/
│       │   ├── login.ts          # Login API endpoint (placeholder)
│       │   ├── orders.ts         # Orders API endpoint (placeholder)
│       │   └── order-details.ts  # Order details API endpoint (placeholder)
│       └── index.astro           # Main page (ready for Vue components)
├── astro.config.mjs              # Astro configuration
├── package.json                   # Dependencies and scripts
└── tsconfig.json                  # TypeScript configuration
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

Dependencies are already installed. If you need to reinstall:

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

The server will start at `http://localhost:4321`

### Build

Build for production:

```bash
npm run build
```

### Preview

Preview the production build:

```bash
npm run preview
```

## Dependencies

- `astro` - Core Astro framework
- `@astrojs/vue` - Vue.js integration
- `@astrojs/node` - Node.js server adapter
- `vue` - Vue.js framework
- `better-sqlite3` - SQLite database driver
- `zod` - Schema validation

## Next Steps

All files are placeholder structures ready for implementation:

1. **Database** (`src/lib/db.ts`) - Set up SQLite connection
2. **API Routes** (`src/pages/api/*.ts`) - Implement authentication and order endpoints
3. **Vue Components** (`src/components/*.vue`) - Build UI components
4. **Main Page** (`src/pages/index.astro`) - Mount Vue components and build the UI

## Login Information

- **Employee ID**: Only accepts numbers (numeric input)
- **Password**: For all employees, the password is `123`

## Notes

- The project is configured for server-side rendering with Node.js adapter
- Vue components can be used in Astro pages
- API routes are available at `/api/*` endpoints
- Database connection logic should be implemented in `src/lib/db.ts`
