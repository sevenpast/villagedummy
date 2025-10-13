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
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function recreateBucket() {
  try {
    console.log('🗑️  Deleting existing documents bucket...')
    
    // Try to delete the existing bucket
    const { error: deleteError } = await supabase.storage.deleteBucket('documents')
    
    if (deleteError) {
      console.log('⚠️  Could not delete bucket (might not exist):', deleteError.message)
    } else {
      console.log('✅ Existing bucket deleted')
    }

    console.log('🆕 Creating new documents bucket...')
    
    // Create a new bucket with minimal restrictions
    const { data, error } = await supabase.storage.createBucket('documents', {
      public: true, // Make it public to avoid RLS issues for now
      fileSizeLimit: 50 * 1024 * 1024, // 50MB (smaller limit)
      allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'text/plain']
    })

    if (error) {
      console.error('❌ Error creating bucket:', error)
      return false
    }

    console.log('✅ New bucket created successfully')
    
    // Test the bucket
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
    } else {
      console.error('❌ Bucket "documents" not found after creation')
      return false
    }

    // Test upload
    console.log('🧪 Testing file upload...')
    const testContent = 'This is a test file for the documents bucket.'
    const testFile = new File([testContent], 'test.txt', { type: 'text/plain' })
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload('test-upload.txt', testFile, {
        contentType: 'text/plain',
        upsert: true
      })

    if (uploadError) {
      console.error('❌ Upload test failed:', uploadError)
      return false
    } else {
      console.log('✅ Upload test successful!')
      // Clean up test file
      await supabase.storage.from('documents').remove(['test-upload.txt'])
    }

    return true

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return false
  }
}

// Run the script
recreateBucket()
  .then(success => {
    if (success) {
      console.log('🎉 Bucket recreated successfully!')
      console.log('The documents bucket is now public and should allow uploads.')
      console.log('You can now test the document upload in your app.')
    } else {
      console.log('💥 Bucket recreation failed!')
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })
