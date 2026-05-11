const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.from('products').select('*').limit(1);
  console.log("Existing columns:", data && data.length > 0 ? Object.keys(data[0]) : "No data");
  if (error) console.error(error);
}
check();
