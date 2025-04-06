# Made with GROK 3 (mostly)
#!/bin/bash
cd FlyNext
npm install
cd ..
cd afs
npm install
cd ..

# Start the databases
docker compose up -d postgres-fn postgres-afs

# Wait for databases to be ready (requires `psql` installed locally)
echo "Waiting for postgres-fn to be ready..."
until docker compose exec postgres-fn psql -U postgres -d mydb -c "SELECT 1" > /dev/null 2>&1; do
  sleep 1
done
echo "postgres-fn is ready!"

echo "Waiting for postgres-afs to be ready..."
until docker compose exec postgres-afs psql -U postgres -d mydb2 -c "SELECT 1" > /dev/null 2>&1; do
  sleep 1
done
echo "postgres-afs is ready!"

# Apply migrations to afs database
echo "Applying migrations to afs database..."
cd afs
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/mydb2?schema=public" npx prisma migrate deploy
cd ..

# Apply migrations to FlyNext database
echo "Applying migrations to FlyNext database..."
cd FlyNext
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mydb?schema=public" npx prisma migrate deploy
cd ..

# Run seeding for afs, clearing the tables first
echo "Clearing afs database tables..."
docker compose exec postgres-afs psql -U postgres -d mydb2 -c "DO \$\$ DECLARE r RECORD; BEGIN FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != '_prisma_migrations') LOOP EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE;'; END LOOP; END \$\$;"
echo "afs tables cleared!"

# Seeding afs
echo "Seeding afs database..."
cd afs
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/mydb2?schema=public" node prisma/data/import_data.js
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/mydb2?schema=public" node prisma/data/generate_flights.js
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/mydb2?schema=public" node prisma/data/import_agencies.js
cd ..

# Run seeding for FlyNext
echo "FlyNext tables will be cleared within the seed script."
echo "Seeding FlyNext database..."
cd FlyNext
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mydb?schema=public" node prisma/seed.js
cd ..

echo "Seeding complete!"

# Stop the databases from running
docker compose down