FROM node:22.14.0-slim AS base
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
