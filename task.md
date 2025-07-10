# Phase 1: Setup & Configuration

## Step 1: Set up a PostgreSQL Server

You'll need a running PostgreSQL instance. The easiest way to get started, especially since you have a Dockerfile, is to use Docker.

I can help you run this command to start a PostgreSQL container for local development:

1 docker run --name my-postgres-db -e POSTGRES_PASSWORD=mysecretpassword -p 5432:5432 -v pgdata:/var/lib/postgresql/data -d postgres

This command starts a PostgreSQL server, sets a password, maps it to your local port 5432, and creates a volume (pgdata) to persist the data.

## Step 2: Update Project Dependencies

You'll need to swap the SQLite database driver for the PostgreSQL one.
I will run these commands to add the pg driver and remove the SQLite driver:

1 pnpm add pg
2 pnpm remove @libsql/client

## Step 3: Update Drizzle Configuration (`drizzle.config.ts`)

Your drizzle.config.ts file is currently configured for SQLite. It needs to be updated to point to your new PostgreSQL database. This involves changing the driver and dbCredentials.

## Step 4: Update Database Connection in the App

The code that initializes the Drizzle client for your application (likely in src/lib/server/registry.ts or src/lib/server/adapters/lucia.ts) needs to be changed from using the SQLite driver to the new pg driver. This will involve using a PostgreSQL connection string, which is best stored in an environment variable
(.env file).

# Phase 2: Schema & Data Migration

## Step 5: Adjust the Database Schema (`src/lib/server/repositories/schema.ts`)

PostgreSQL has slightly different data types than SQLite. You may need to update your schema definitions in src/lib/server/repositories/schema.ts. For example, you might switch from integer for primary keys to serial, or use timestamp with time zones. I'll need to inspect this file to be sure.

## Step 6: Generate and Run the Initial PostgreSQL Migration

With the configuration pointing to your new, empty PostgreSQL database, we'll use Drizzle Kit to generate a migration file that will create the entire schema.

1.  pnpm drizzle-kit generate:pg - This creates the SQL migration file.
2.  pnpm drizzle-kit migrate:pg - This applies the generated migration to your database.

## Step 7: Migrate Existing Data (Optional)

This is often the most complex step. If you have important data in your SQLite file, you have a few options:

- Start Fresh (Easiest): If the data is just for testing, the easiest path is to start with an empty PostgreSQL database and create new test data.
- Use a Tool: Tools like pgloader can automate migrating data from SQLite to PostgreSQL.
- Write a Custom Script: I can help you write a script that reads from your SQLite database and inserts the data into your new PostgreSQL database.

# Phase 3: Verification

## Step 8: Update Dockerfile and Environment

Your Dockerfile might need adjustments if it was previously copying the SQLite database file. You'll also need to ensure the DATABASE_URL environment variable is available to your application, both locally (in a .env file) and in your production environment.

## Step 9: Test Everything

Run your project's tests (vitest) and manually test the application thoroughly to ensure all database operations (creating users, articles, comments, etc.) work correctly with PostgreSQL.
