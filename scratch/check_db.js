const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkData() {
  const { data: families, error } = await supabase.from('families').select('id, mother_name, user_id, status');
  if (error) {
    console.error('Error fetching families:', error);
    return;
  }
  console.log('Total Families in DB:', families.length);
  families.forEach(f => {
    console.log(`- ${f.mother_name}: user_id=${f.user_id}, status=${f.status}`);
  });
}

checkData();
