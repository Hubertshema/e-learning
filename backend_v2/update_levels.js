import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_hajq07EkJsev@ep-falling-bird-b5ga2g7o-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require'
});

async function updateLevels() {
  await client.connect();
  
  try {
    console.log('Altering column type...');
    // Drop default if any, change type to varchar
    await client.query("ALTER TABLE public.courses ALTER COLUMN level TYPE VARCHAR(255) USING level::text;");

    console.log('Updating levels...');
    await client.query("UPDATE public.courses SET level = '1' WHERE level IN ('PRE_A1', 'A1');");
    await client.query("UPDATE public.courses SET level = '2' WHERE level IN ('A2', 'B1');");
    await client.query("UPDATE public.courses SET level = '3' WHERE level IN ('B2', 'C1', 'C2');");
    console.log('Update complete.');
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

updateLevels().catch(console.error);
