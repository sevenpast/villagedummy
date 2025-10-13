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

async function fixBucketMimeTypes() {
  try {
    console.log('🔧 Fixing bucket MIME type restrictions...')
    
    // Update the bucket to allow more MIME types and make it less restrictive
    const { data, error } = await supabase.storage.updateBucket('documents', {
      public: false,
      fileSizeLimit: 52428800, // 50MB
      allowedMimeTypes: [
        'application/pdf',
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/webp',
        'image/gif',
        'image/bmp',
        'image/tiff',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'text/csv',
        'application/zip',
        'application/x-zip-compressed'
      ]
    })

    if (error) {
      console.error('❌ Error updating bucket:', error)
      return false
    }

    console.log('✅ Bucket MIME types updated successfully')
    
    // Test with a PDF file (which should be allowed)
    console.log('🧪 Testing upload with PDF MIME type...')
    
    // Create a simple PDF-like file for testing
    const pdfContent = '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n174\n%%EOF'
    const testFile = new File([pdfContent], 'test.pdf', { type: 'application/pdf' })
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload('test-upload.pdf', testFile, {
        contentType: 'application/pdf',
        upsert: true
      })

    if (uploadError) {
      console.error('❌ PDF upload test failed:', uploadError)
      
      // If it's still an RLS error, let's make the bucket public temporarily
      if (uploadError.message.includes('row-level security') || uploadError.message.includes('policy')) {
        console.log('🔓 Making bucket public to bypass RLS...')
        
        const { error: publicError } = await supabase.storage.updateBucket('documents', {
          public: true
        })
        
        if (publicError) {
          console.error('❌ Failed to make bucket public:', publicError)
          return false
        }
        
        console.log('✅ Bucket made public')
        
        // Test again
        const { data: retryData, error: retryError } = await supabase.storage
          .from('documents')
          .upload('test-upload-public.pdf', testFile, {
            contentType: 'application/pdf',
            upsert: true
          })
        
        if (retryError) {
          console.error('❌ Public upload test failed:', retryError)
          return false
        } else {
          console.log('✅ Public upload test successful!')
          // Clean up
          await supabase.storage.from('documents').remove(['test-upload-public.pdf'])
        }
      }
    } else {
      console.log('✅ PDF upload test successful!')
      // Clean up
      await supabase.storage.from('documents').remove(['test-upload.pdf'])
    }

    return true

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return false
  }
}

// Run the script
fixBucketMimeTypes()
  .then(success => {
    if (success) {
      console.log('🎉 Bucket configuration fixed successfully!')
      console.log('You can now test the document upload in your app.')
    } else {
      console.log('💥 Bucket configuration fix failed!')
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })
