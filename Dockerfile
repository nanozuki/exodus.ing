# Dockerfile builds the production image in stages: it enables Corepack, installs production and full dependencies
# from the frozen lockfile with a cached pnpm store, runs the application build, and copies package.json, production
# dependencies, and the build output into the runner, which runs `node build` on port 3000. The base image's Node
# version follows the development runtime through src/scripts/sync-node-version.ts.

FROM node:24.22.2-slim AS base
ENV NODE_ENV=production
WORKDIR /app

FROM base AS workspace
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY . /app
WORKDIR /app

FROM workspace AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM workspace AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run build

FROM base AS runner
COPY --from=workspace /app/package.json /app/package.json
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/build /app/build
EXPOSE 3000
CMD [ "node", "build" ]
