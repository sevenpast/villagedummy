# Deployment Guide

## Vercel Deployment

### 1. Prepare Repository
```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit: ExpatVillage Swiss Immigration Assistant"

# Add remote origin (replace with your GitHub repository URL)
git remote add origin https://github.com/yourusername/expatvillage.git

# Push to GitHub
git push -u origin main
```

### 2. Vercel Setup

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure environment variables:

#### Required Environment Variables:
```
NEXT_PUBLIC_GEMINI_API_KEY=your_actual_gemini_api_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. Database Setup

1. Go to your Supabase dashboard
2. Run the following SQL scripts in order:

```sql
-- 1. Main database schema
\i db_schema_complete.sql

-- 2. Task setup
\i tasks_1_2_3_setup.sql

-- 3. Form analysis table
\i form_analyses_setup.sql

-- 4. Documents table
\i documents_table_setup.sql
```

### 4. Test Deployment

1. Visit your Vercel deployment URL
2. Test the following features:
   - User registration
   - PDF upload and processing
   - Task completion
   - Document vault

### 5. Production Checklist

- [ ] Environment variables configured
- [ ] Database schema deployed
- [ ] Gemini API key working
- [ ] Supabase connection established
- [ ] PDF processing functional
- [ ] All tasks working correctly
- [ ] Document upload/download working

## Troubleshooting

### Common Issues:

1. **Gemini API 404 Error**: Check API key and model name
2. **Supabase Connection**: Verify URL and keys
3. **PDF Processing**: Ensure pdf-lib is properly installed
4. **Build Errors**: Check TypeScript types and imports

### Debug Commands:

```bash
# Check build locally
npm run build

# Test API endpoints
curl -X GET https://your-app.vercel.app/api/user/profile?userId=test

# Check environment variables
vercel env ls
```
