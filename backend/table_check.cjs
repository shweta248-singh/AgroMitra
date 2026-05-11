const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  console.log("Checking tables...");
  
  const { data: usersData, error: usersError } = await supabase.from('users').select('*').limit(1);
  console.log("Users table exists:", !usersError);
  if (usersError) console.log("Users table error:", usersError.message);

  const { data: profilesData, error: profilesError } = await supabase.from('profiles').select('*').limit(1);
  console.log("Profiles table exists:", !profilesError);
  if (profilesError) console.log("Profiles table error:", profilesError.message);
  
  const { data: productsData, error: productsError } = await supabase.from('products').select('*').limit(1);
  console.log("Products table exists:", !productsError);
  if (productsError) console.log("Products table error:", productsError.message);
}
check();
