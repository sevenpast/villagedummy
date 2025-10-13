# Village Setup Guide

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+ installed
- A Supabase account (free tier available)
- Git installed

### 2. Supabase Setup

1. **Create a new Supabase project:**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Choose your organization
   - Enter project name: "village"
   - Set a strong database password
   - Choose a region close to you
   - Click "Create new project"

2. **Get your project credentials:**
   - Go to Settings → API
   - Copy the following values:
     - Project URL
     - anon/public key
     - service_role key (keep this secret!)

3. **Set up the database:**
   - Go to the SQL Editor in your Supabase dashboard
   - Copy the contents of `database/01_initial_schema.sql`
   - Paste and run the SQL script
   - This will create all necessary tables and functions

### 3. Environment Configuration

1. **Update `.env.local`:**
   ```bash
   # Replace with your actual Supabase values
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   
   # App Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-random-secret-here
   NEXTAUTH_URL=http://localhost:3000
   
   # Document Vault Configuration
   NEXT_PUBLIC_MAX_FILE_SIZE=10485760
   NEXT_PUBLIC_ALLOWED_FILE_TYPES=pdf,jpg,jpeg,png,doc,docx
   
   # Security (generate a random 32-character string)
   NEXT_PUBLIC_ENCRYPTION_KEY=your-32-character-encryption-key
   ```

2. **Generate a secure NEXTAUTH_SECRET:**
   ```bash
   openssl rand -base64 32
   ```

3. **Generate a secure encryption key:**
   ```bash
   openssl rand -hex 16
   ```

### 4. Start the Application

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your application!

## 🔧 Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## 🗄️ Database Management

### Reset Database (if needed)
```bash
# If you have Supabase CLI installed
supabase db reset

# Or manually run the SQL in database/01_initial_schema.sql
```

### View Database
- Go to your Supabase dashboard
- Navigate to Table Editor
- You should see all the tables created by the schema

## 🚀 Deployment to Vercel

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/village.git
git push -u origin main
```

### 2. Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Add environment variables in Vercel dashboard
5. Deploy!

### 3. Environment Variables for Production
Add these in your Vercel project settings:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL` (your Vercel domain)
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` (your Vercel domain)
- `NEXT_PUBLIC_MAX_FILE_SIZE`
- `NEXT_PUBLIC_ALLOWED_FILE_TYPES`
- `NEXT_PUBLIC_ENCRYPTION_KEY`

## 🔐 Security Notes

- **Never commit** `.env.local` or any files with API keys
- **Keep your service role key secret** - it has admin access
- **Use strong passwords** for your Supabase project
- **Enable Row Level Security** (already configured in the schema)

## 🐛 Troubleshooting

### Build Errors
- Make sure all environment variables are set
- Check that your Supabase project is active
- Verify the database schema was applied correctly

### Authentication Issues
- Check your Supabase project URL and keys
- Ensure email confirmation is set up in Supabase Auth settings
- Check the auth callback URL in Supabase settings

### Database Issues
- Verify the schema was applied correctly
- Check Row Level Security policies
- Ensure your user has the correct permissions

## 📚 Next Steps

1. **Test the application:**
   - Create an account
   - Upload a document
   - Check the dashboard

2. **Customize:**
   - Update the branding in `src/app/layout.tsx`
   - Modify the color scheme in `tailwind.config.js`
   - Add your own tasks in the database

3. **Add features:**
   - Implement AI document classification
   - Add more task types
   - Create email automation

## 🆘 Need Help?

- Check the [README.md](./README.md) for detailed documentation
- Review the [Supabase documentation](https://supabase.com/docs)
- Check the [Next.js documentation](https://nextjs.org/docs)

---

**Happy coding! 🚀**
