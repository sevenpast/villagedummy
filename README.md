# Village - Expat Onboarding Platform

A secure, data-driven platform for expat onboarding in Switzerland, featuring document management, personalized tasks, and GDPR compliance.

## 🚀 Features

### MVP (Current)
- **Authentication**: Secure user registration and login with Supabase Auth
- **Document Vault**: Secure document storage with client-side encryption
- **Dashboard**: Overview of user progress and quick actions
- **Responsive Design**: Mobile-first UI with Tailwind CSS

### Planned Features
- **AI Document Classification**: Automatic document categorization using Gemini
- **Personalized Tasks**: Dynamic task recommendations based on user profile
- **GDPR Compliance**: Full data access, deletion, and portability features
- **Email Automation**: Automated reminders and notifications
- **Multi-language Support**: German, English, French, Italian

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Deployment**: Vercel
- **Security**: Row-Level Security (RLS), Client-side encryption

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Vercel account (for deployment)

## 🚀 Quick Start

### 1. Clone and Install

```bash
cd village
npm install
```

### 2. Environment Setup

Copy the example environment file:

```bash
cp .env.example .env.local
```

Update `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Setup

Run the initial database schema:

```bash
# If you have Supabase CLI installed
supabase db reset

# Or manually run the SQL in database/01_initial_schema.sql
```

### 4. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```
village/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # Dashboard page
│   │   ├── document-vault/    # Document management
│   │   └── api/               # API routes
│   ├── components/            # React components
│   │   ├── auth/              # Authentication components
│   │   ├── document-vault/    # Document management components
│   │   ├── dashboard/         # Dashboard components
│   │   └── ui/                # Reusable UI components
│   ├── lib/                   # Utilities and configurations
│   │   ├── supabase/          # Supabase client setup
│   │   ├── types/             # TypeScript type definitions
│   │   └── utils/             # Helper functions
│   └── middleware.ts          # Next.js middleware for auth
├── database/                  # Database schemas and migrations
├── docs/                      # Documentation
├── deployment/                # Deployment configurations
└── public/                    # Static assets
```

## 🔐 Security Features

### Document Vault Security
- **Client-side Encryption**: Documents encrypted before upload
- **Zero-Knowledge Architecture**: Server cannot decrypt user documents
- **Row-Level Security**: Database-level access control
- **Audit Logging**: All document access tracked

### Authentication Security
- **Supabase Auth**: Industry-standard authentication
- **Protected Routes**: Middleware-based route protection
- **Session Management**: Secure session handling

## 📊 Database Schema

The application uses a comprehensive PostgreSQL schema with:

- **User Management**: Profiles, family members, preferences
- **Document Storage**: Encrypted document vault with categories
- **Task System**: Modules, tasks, variants, and progress tracking
- **Audit Logs**: Complete access and modification tracking
- **Swiss Data**: Municipalities and postal codes

## 🚀 Deployment

### Vercel Deployment

1. **Connect Repository**: Link your GitHub repository to Vercel
2. **Environment Variables**: Add all required environment variables
3. **Deploy**: Automatic deployment on push to main branch

### Environment Variables for Production

```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your_secure_random_string
```

## 🧪 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:reset     # Reset Supabase database
npm run db:push      # Push schema changes
npm run db:migrate   # Run database migrations
```

### Code Style

- **TypeScript**: Strict type checking enabled
- **ESLint**: Next.js recommended configuration
- **Prettier**: Code formatting (recommended)
- **Tailwind CSS**: Utility-first styling

## 📝 API Documentation

### Authentication Endpoints

- `POST /auth/signup` - User registration
- `POST /auth/signin` - User login
- `POST /auth/signout` - User logout

### Document Vault Endpoints

- `GET /api/documents` - List user documents
- `POST /api/documents` - Upload document
- `GET /api/documents/[id]` - Download document
- `DELETE /api/documents/[id]` - Delete document

## 🔒 GDPR Compliance

The application is designed with GDPR compliance in mind:

- **Right to Access**: Users can view all their data
- **Right to Erasure**: Complete account deletion
- **Right to Portability**: Data export functionality
- **Consent Management**: Granular consent tracking
- **Data Minimization**: Only necessary data collected

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

- Create an issue in the GitHub repository
- Check the documentation in the `docs/` folder
- Review the deployment guide in `deployment/`

## 🗺️ Roadmap

### Phase 1 (MVP) - Current
- [x] Basic authentication
- [x] Document vault
- [x] Dashboard
- [ ] User profile management
- [ ] Basic task system

### Phase 2 (3-6 months)
- [ ] AI document classification
- [ ] Personalized task recommendations
- [ ] Email automation
- [ ] Advanced search

### Phase 3 (6+ months)
- [ ] Full GDPR dashboard
- [ ] Multi-language support
- [ ] Advanced analytics
- [ ] Mobile app

---

Built with ❤️ for the expat community in Switzerland