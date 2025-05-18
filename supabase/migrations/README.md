# Supabase Migrations

This directory contains SQL migration files for the Supabase database schema.

## Migration Files

- `20250515164107_create_locations_table.sql` - Creates the locations table, indexes, triggers, and RLS policies

## How to Apply Migrations

### Option 1: Supabase CLI

If you have the Supabase CLI installed, you can apply migrations with:

```bash
supabase db push
```

### Option 2: Supabase Dashboard

1. Navigate to the Supabase Dashboard
2. Select your project
3. Go to the SQL Editor
4. Copy and paste the migration file content
5. Run the SQL query

## Important Notes

- Always check that the `uuid-ossp` extension is enabled before running migrations that use `uuid_generate_v4()`
- Ensure that RLS policies are properly set up for security
- Be careful when modifying existing tables with data
