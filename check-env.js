// Environment Variables Check
// Run this with: node check-env.js

console.log('🔍 Checking Environment Variables...\n')

const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
]

const optionalVars = [
  'SUPABASE_SERVICE_KEY'
]

console.log('✅ Required Variables:')
requiredVars.forEach(varName => {
  const value = process.env[varName]
  if (value) {
    console.log(`  ${varName}: ${value.substring(0, 20)}...`)
  } else {
    console.log(`  ❌ ${varName}: MISSING`)
  }
})

console.log('\n🔧 Optional Variables:')
optionalVars.forEach(varName => {
  const value = process.env[varName]
  if (value) {
    console.log(`  ${varName}: ${value.substring(0, 20)}...`)
  } else {
    console.log(`  ⚠️  ${varName}: Not set (optional)`)
  }
})

console.log('\n📋 Next Steps:')
console.log('1. Make sure .env.local exists in the village/ directory')
console.log('2. Copy your Supabase URL and anon key from the Supabase dashboard')
console.log('3. Restart your development server after updating .env.local')
