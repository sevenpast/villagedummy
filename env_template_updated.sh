#!/bin/bash

# Updated Environment Template for Supabase + Documents
# Copy this to .env.local and replace with your actual values

echo "Creating updated .env.local template..."

cat > .env.local << 'EOF'
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# AI Service API Keys
GEMINI_API_KEY=AIzaSyC8CHSLaNtftBtpLqk2HDuFX5Jiq98Pifo
EOF

echo "✅ Updated .env.local template created!"
echo ""
echo "📝 Next steps:"
echo "1. Replace 'your-project-id' with your actual Supabase project ID"
echo "2. Replace 'your-service-role-key-here' with your actual Supabase service role key"
echo "3. Restart your development server: npm run dev"
echo ""
echo "🔗 Get your keys from: https://supabase.com/dashboard/project/[your-project]/settings/api"


