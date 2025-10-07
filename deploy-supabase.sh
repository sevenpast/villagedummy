#!/bin/bash

echo "🚀 Deploying Supabase Architecture..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Check if we're in a Supabase project
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Not in a Supabase project. Please run:"
    echo "supabase init"
    exit 1
fi

echo "📊 Running database migrations..."
supabase db push

echo "🔧 Setting up secrets..."
echo "Please set the following secrets in your Supabase dashboard:"
echo "- GEMINI_API_KEY"
echo "- SUPABASE_URL"
echo "- SUPABASE_SERVICE_ROLE_KEY"

echo "📦 Deploying Edge Function..."
supabase functions deploy classify-document

echo "🗄️ Setting up Storage bucket..."
echo "Please create a 'documents' bucket in Supabase Storage with private access"

echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Set up your secrets in Supabase dashboard"
echo "2. Create the 'documents' storage bucket"
echo "3. Update your client to use the new upload-v2 API"
echo "4. Test the classification system"
