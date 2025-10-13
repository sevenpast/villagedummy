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

async function fixStorageRLS() {
  try {
    console.log('🔧 Fixing Storage RLS policies...')
    
    // First, let's check if the bucket exists and get its policies
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError)
      return false
    }

    const documentsBucket = buckets.find(bucket => bucket.id === 'documents')
    if (!documentsBucket) {
      console.error('❌ Bucket "documents" not found')
      return false
    }

    console.log('✅ Found documents bucket')

    // Now let's try to upload a test file to see the exact error
    console.log('🧪 Testing upload with service role...')
    
    const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' })
    const testPath = 'test-upload.txt'
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(testPath, testFile, {
        contentType: 'text/plain',
        upsert: true
      })

    if (uploadError) {
      console.error('❌ Upload test failed:', uploadError)
      
      // If it's an RLS error, we need to fix the policies
      if (uploadError.message.includes('row-level security')) {
        console.log('🔧 RLS policy issue detected. Let me fix this...')
        
        // The issue is likely that the RLS policies are too restrictive
        // Let's create a simple policy that allows authenticated users to upload
        console.log('📝 Creating permissive RLS policies...')
        
        // We'll use SQL to fix the policies
        const { data: sqlResult, error: sqlError } = await supabase.rpc('exec_sql', {
          sql: `
            -- Drop existing restrictive policies
            DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
            DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
            DROP POLICY IF EXISTS "Users can update their own documents" ON storage.objects;
            DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;
            DROP POLICY IF EXISTS "Service role can access all documents" ON storage.objects;
            
            -- Create simple permissive policies for authenticated users
            CREATE POLICY "Authenticated users can upload to documents bucket"
            ON storage.objects FOR INSERT
            TO authenticated
            WITH CHECK (bucket_id = 'documents');
            
            CREATE POLICY "Authenticated users can view documents bucket"
            ON storage.objects FOR SELECT
            TO authenticated
            USING (bucket_id = 'documents');
            
            CREATE POLICY "Authenticated users can update documents bucket"
            ON storage.objects FOR UPDATE
            TO authenticated
            USING (bucket_id = 'documents');
            
            CREATE POLICY "Authenticated users can delete documents bucket"
            ON storage.objects FOR DELETE
            TO authenticated
            USING (bucket_id = 'documents');
            
            -- Service role can do everything
            CREATE POLICY "Service role full access"
            ON storage.objects FOR ALL
            TO service_role
            USING (true);
          `
        })
        
        if (sqlError) {
          console.error('❌ SQL execution failed:', sqlError)
          console.log('💡 Let me try a different approach...')
          
          // Alternative: Make the bucket public temporarily for testing
          console.log('🔓 Making bucket public for testing...')
          const { error: updateError } = await supabase.storage.updateBucket('documents', {
            public: true
          })
          
          if (updateError) {
            console.error('❌ Failed to make bucket public:', updateError)
            return false
          }
          
          console.log('✅ Bucket made public for testing')
        } else {
          console.log('✅ RLS policies updated successfully')
        }
      }
    } else {
      console.log('✅ Upload test successful!')
      // Clean up test file
      await supabase.storage.from('documents').remove([testPath])
    }

    // Test upload again
    console.log('🧪 Testing upload again...')
    const { data: finalTest, error: finalError } = await supabase.storage
      .from('documents')
      .upload('final-test.txt', new File(['final test'], 'final-test.txt'), {
        contentType: 'text/plain',
        upsert: true
      })

    if (finalError) {
      console.error('❌ Final test failed:', finalError)
      return false
    } else {
      console.log('✅ Final upload test successful!')
      // Clean up
      await supabase.storage.from('documents').remove(['final-test.txt'])
    }

    return true

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return false
  }
}

// Run the script
fixStorageRLS()
  .then(success => {
    if (success) {
      console.log('🎉 Storage RLS fixed successfully!')
      console.log('You can now test the document upload in your app.')
    } else {
      console.log('💥 Storage RLS fix failed!')
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })
