const { createClient } = require('@supabase/supabase-js')

// Load environment variables from .env.local
const fs = require('fs')
const path = require('path')

function loadEnvFile() {
  const envPath = path.join(__dirname, '.env.local')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    const envVars = {}
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=')
      if (key && value) {
        envVars[key.trim()] = value.trim()
      }
    })
    return envVars
  }
  return {}
}

const envVars = loadEnvFile()
const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.log('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createStorageBucket() {
  try {
    console.log('🚀 Creating storage bucket...')
    
    // Create the documents bucket
    const { data, error } = await supabase.storage.createBucket('documents', {
      public: false,
      fileSizeLimit: 52428800, // 50MB
      allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    })

    if (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Bucket "documents" already exists')
      } else {
        console.error('❌ Error creating bucket:', error)
        return false
      }
    } else {
      console.log('✅ Bucket "documents" created successfully')
    }

    // Test bucket access
    console.log('🧪 Testing bucket access...')
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError)
      return false
    }

    const documentsBucket = buckets.find(bucket => bucket.id === 'documents')
    if (documentsBucket) {
      console.log('✅ Bucket "documents" is accessible')
      console.log('📊 Bucket details:', {
        id: documentsBucket.id,
        name: documentsBucket.name,
        public: documentsBucket.public,
        fileSizeLimit: documentsBucket.file_size_limit,
        allowedMimeTypes: documentsBucket.allowed_mime_types
      })
      return true
    } else {
      console.error('❌ Bucket "documents" not found after creation')
      return false
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return false
  }
}

// Run the script
createStorageBucket()
  .then(success => {
    if (success) {
      console.log('🎉 Storage bucket setup completed successfully!')
      console.log('You can now test the document upload in your app.')
    } else {
      console.log('💥 Storage bucket setup failed!')
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })
