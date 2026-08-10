# Build from repo root:
#   podman build -f packages/db/migrate.Containerfile -t poky-migrate .
# Run with:
#   podman run --rm -e DATABASE_URL=postgres://... poky-migrate

FROM oven/bun
WORKDIR /usr/src/app

# Workspace manifests for install (lockfile-aware)
COPY package.json bun.lock ./
COPY apps/server/package.json apps/server/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/api/package.json packages/api/package.json
COPY packages/auth/package.json packages/auth/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/env/package.json packages/env/package.json

# Install all deps (including drizzle-kit as a db devDependency)
RUN bun install

# Only the packages migrate needs at runtime
COPY packages/db packages/db
COPY packages/env packages/env
COPY packages/config packages/config

WORKDIR /usr/src/app/packages/db

ENTRYPOINT ["bun", "run", "db:migrate"]
