const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const env = fs.readFileSync('.env.local', 'utf-8')
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1]
const supabaseKey = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1]

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const { data } = await supabase.from('profiles').select('id, handle').eq('id', 'ca288564-b9d8-4a3c-b1e4-900bbbcdf8cc')
  console.log('Profiles check 1:', data)
  const { data: d2 } = await supabase.from('profiles').select('id, handle').eq('id', '3fe414d0-0a36-450e-9f89-bb8865b285e6')
  console.log('Profiles check 2:', d2)
}
test()
