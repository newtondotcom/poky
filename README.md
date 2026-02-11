# 🎯 Pok7

Une application moderne de pokes à la Meta avec des fonctionnalités temps réel, construite avec une stack TypeScript de pointe.

## ✨ Fonctionnalités

- **🔔 Notifications Push** - Recevez des notifications en temps réel
- **📡 Server-Sent Events** - Mises à jour instantanées sans rechargement
- **👥 Système de Poke** - Interagissez avec d'autres utilisateurs
- **🏆 Classement** - Suivez votre position dans le classement
- **🔍 Recherche d'utilisateurs** - Trouvez facilement d'autres personnes
- **🌙 Thème sombre/clair** - Interface adaptée à vos préférences
- **📱 PWA** - Installation sur mobile et desktop
- **🔐 Authentification sécurisée** - Authentification centralisée

## 🛠️ Stack Technique

### Frontend
- **TypeScript** - Type safety and improved developer experience
- **TanStack Router** - File-based routing with full type safety
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **shadcn/ui** - Reusable UI components
- **Bun** - Runtime environment
- **Drizzle ORM** - TypeScript-first ORM
- **PostgreSQL** - Database engine
- **Better-Auth** - Secure authentication
- **Turborepo** - Optimized monorepo build system
- **PWA** - Progressive Web App support
- **Connect RPC** - Type-safe gRPC-Web APIs

### Backend
- **Fastify** - Ultra-fast Node.js server framework with CORS support
- **Connect RPC** - gRPC-Web APIs with type safety
- **Protocol Buffers** - Efficient binary serialization
- **Drizzle ORM** - TypeScript-first ORM with migrations
- **PostgreSQL** - Robust relational database
- **Redis (ioredis)** - Real-time caching and session management
- **NATS** - High-performance messaging system
- **Web Push** - Native push notifications
- **Winston** - Structured and performant logging

### Infrastructure & Tools
- **Bun** - Ultra-fast JavaScript runtime
- **Turborepo** - Optimized monorepo with intelligent build caching
- **Docker** - Containerization and deployment
- **Buf** - Modern Protocol Buffers tooling
- **Drizzle Kit** - Database migration and introspection tools
- **TypeScript** - Static type checking and type safety

## 📦 Managed Dependencies

All dependencies are centralized in the root `package.json` catalog for consistent versioning:

### Core Dependencies
- `better-auth` - Authentication framework
- `dotenv` - Environment variable management
- `zod` - Schema validation
- `typescript` - TypeScript compiler
- `tsdown` - TypeScript bundler

### Database & ORM
- `drizzle-orm` - TypeScript ORM
- `drizzle-kit` - Database tools
- `pg` - PostgreSQL client
- `postgres` - PostgreSQL driver

### Server & API
- `fastify` - Web framework
- `@fastify/cors` - CORS middleware
- `@connectrpc/connect` - Connect RPC client
- `@connectrpc/connect-fastify` - Fastify integration
- `@connectrpc/connect-query` - Query integration
- `@connectrpc/connect-web` - Web integration
- `@connectrpc/validate` - Validation utilities

### Messaging & Cache
- `ioredis` - Redis client
- `nats` - NATS messaging
- `web-push` - Push notifications
- `@types/web-push` - TypeScript definitions for web-push

### Development & Build Tools
- `@bufbuild/protobuf` - Protocol Buffers runtime
- `@bufbuild/buf` - Protocol Buffers CLI
- `@types/bun` - Bun type definitions
- `@types/pg` - PostgreSQL type definitions

### Logging
- `winston` - Structured logging

## Getting Started

First, install the dependencies:

```bash
bun install
```
## Infrastructure Setup

### Docker Services

This project requires PostgreSQL, NATS, and Valkey (Redis) for full functionality. Start all services using Docker Compose:

```bash
cd apps/server
docker compose up -d
```

This will start:
- **PostgreSQL** - Database on port 8001 (credentials: `postgres:mypassword`)
- **NATS** - Message broker on port 4222
- **Valkey** - Cache/session storage on port 6379

### Database Setup

1. Ensure PostgreSQL is running via Docker Compose
2. Update your `apps/server/.env` file with the connection details (if needed):
   ```
   DATABASE_URL=postgresql://postgres:mypassword@localhost:8001/postgres
   ```

3. Apply the schema to your database:
```bash
bun db:push
```


Then, run the development server:

```bash
bun dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser to see the web application.
The API is running at [http://localhost:3000](http://localhost:3000).

## Project Structure

```
pok7/
├── apps/
│   ├── web/                 # Frontend application (React + TanStack Router + PWA)
│   └── server/              # Backend API (Fastify + Connect RPC)
├── packages/
│   ├── api/                 # RPC API implementations and service handlers
│   ├── auth/                # Authentication configuration (Better-Auth)
│   ├── db/                  # Database schema and migrations (Drizzle ORM)
│   ├── env/                 # Environment variable validation
│   └── config/              # Shared TypeScript and build configuration
├── bunfig.toml              # Bun workspace configuration
├── turbo.json               # Turborepo build configuration
└── package.json             # Root workspace manifest with dependency catalog
```

## Available Scripts

- `bun dev`: Start all applications in development mode
- `bun build`: Build all applications
- `bun dev:web`: Start only the web application
- `bun dev:server`: Start only the server
- `bun check-types`: Check TypeScript types across all apps
- `bun db:push`: Push schema changes to database
- `bun db:studio`: Open database studio UI
- `cd apps/web && bun generate-pwa-assets`: Generate PWA assets
- `cd apps/web && bun desktop:dev`: Start Tauri desktop app in development
- `cd apps/web && bun desktop:build`: Build Tauri desktop app


## 🤝 Contributing

1. Fork the project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License. See the `LICENSE` file for more details.

## 🆘 Support

If you encounter any issues or have questions:
- Open an [issue](https://github.com/your-username/pok7/issues)
- Check the [documentation](https://github.com/your-username/pok7/wiki)

---

**Built with ❤️ and [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack)**
