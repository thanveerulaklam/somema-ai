const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Read environment variables from .env.local
function loadEnvFile() {
  const envPath = path.join(__dirname, '.env.local')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    const envVars = {}
    
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim()
      }
    })
    
    return envVars
  }
  return {}
}

const envVars = loadEnvFile()
const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  console.error('Please make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupDatabase() {
  try {
    console.log('Checking and setting up database tables...')
    
    // Check if posts table exists
    const { data: postsCheck, error: postsError } = await supabase
      .from('posts')
      .select('id')
      .limit(1)
    
    if (postsError && postsError.code === '42P01') {
      console.log('Posts table does not exist. Creating it...')
      
      // Create posts table
      const createPostsTable = `
        CREATE TABLE IF NOT EXISTS posts (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          caption TEXT,
          hashtags TEXT[],
          platform TEXT NOT NULL,
          status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
          scheduled_for TIMESTAMP WITH TIME ZONE,
          published_at TIMESTAMP WITH TIME ZONE,
          media_url TEXT,
          text_elements JSONB DEFAULT '{}',
          business_context TEXT,
          theme TEXT,
          content_type TEXT,
          custom_prompt TEXT,
          engagement_data JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
      
      const { error: createError } = await supabase.rpc('exec_sql', { sql: createPostsTable })
      if (createError) {
        console.error('Error creating posts table:', createError)
      } else {
        console.log('Posts table created successfully!')
      }
      
      // Enable RLS on posts table
      const enableRLS = `ALTER TABLE posts ENABLE ROW LEVEL SECURITY;`
      await supabase.rpc('exec_sql', { sql: enableRLS })
      
      // Create RLS policies for posts table (with IF NOT EXISTS)
      const policies = [
        `CREATE POLICY IF NOT EXISTS "Users can view their own posts" ON posts FOR SELECT USING (auth.uid() = user_id);`,
        `CREATE POLICY IF NOT EXISTS "Users can insert their own posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);`,
        `CREATE POLICY IF NOT EXISTS "Users can update their own posts" ON posts FOR UPDATE USING (auth.uid() = user_id);`,
        `CREATE POLICY IF NOT EXISTS "Users can delete their own posts" ON posts FOR DELETE USING (auth.uid() = user_id);`
      ]
      
      for (const policy of policies) {
        const { error: policyError } = await supabase.rpc('exec_sql', { sql: policy })
        if (policyError) {
          console.error('Error creating policy:', policyError)
        }
      }
      
      console.log('Posts table and policies created successfully!')
    } else if (postsError) {
      console.error('Error checking posts table:', postsError)
    } else {
      console.log('Posts table already exists!')
      
      // Check if we need to add missing columns
      console.log('Checking for missing columns...')
      
      const addMissingColumns = `
        ALTER TABLE posts 
        ADD COLUMN IF NOT EXISTS text_elements JSONB DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS business_context TEXT,
        ADD COLUMN IF NOT EXISTS theme TEXT;
      `
      
      const { error: alterError } = await supabase.rpc('exec_sql', { sql: addMissingColumns })
      if (alterError) {
        console.error('Error adding missing columns:', alterError)
      } else {
        console.log('Missing columns added successfully!')
      }
    }
    
    // Check if user_profiles table exists
    const { data: profilesCheck, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1)
    
    if (profilesError && profilesError.code === '42P01') {
      console.log('User profiles table does not exist. Creating it...')
      
      const createProfilesTable = `
        CREATE TABLE IF NOT EXISTS user_profiles (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
          full_name TEXT,
          business_name TEXT,
          business_type TEXT,
          industry TEXT,
          brand_tone TEXT,
          target_audience TEXT,
          social_links JSONB DEFAULT '{}',
          notifications JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
      
      const { error: createError } = await supabase.rpc('exec_sql', { sql: createProfilesTable })
      if (createError) {
        console.error('Error creating user_profiles table:', createError)
      } else {
        console.log('User profiles table created successfully!')
      }
      
      // Enable RLS and create policies
      await supabase.rpc('exec_sql', { sql: 'ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;' })
      
      const profilePolicies = [
        `CREATE POLICY IF NOT EXISTS "Users can view their own profile" ON user_profiles FOR SELECT USING (auth.uid() = user_id);`,
        `CREATE POLICY IF NOT EXISTS "Users can insert their own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);`,
        `CREATE POLICY IF NOT EXISTS "Users can update their own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);`,
        `CREATE POLICY IF NOT EXISTS "Users can delete their own profile" ON user_profiles FOR DELETE USING (auth.uid() = user_id);`
      ]
      
      for (const policy of profilePolicies) {
        await supabase.rpc('exec_sql', { sql: policy })
      }
    } else {
      console.log('User profiles table already exists!')
    }
    
    console.log('Database setup completed!')
  } catch (error) {
    console.error('Database setup failed:', error)
  }
}

setupDatabase() 