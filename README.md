# ExpatVillage - Swiss Immigration Assistant

A comprehensive platform to help expats navigate Swiss immigration processes with intelligent PDF form processing and task management.

## Features

### 🏠 Dashboard
- Personalized task management for Swiss immigration
- Progress tracking with visual indicators
- Document vault for storing important documents

### 📋 Task Management
- **Task 1**: Residence permit/visa requirements
- **Task 3**: Municipality registration
- **Task 4**: School/kindergarten registration
- Dynamic workflows based on user's country of origin (EU/EFTA vs Non-EU/EFTA)

### 📄 Smart PDF Processing
- Automatic language detection (DE/FR/IT/RM)
- English overlay forms with original tooltips
- Intelligent field recognition and translation
- Autofill functionality with user profile data
- Original PDF form filling and download

### 🌍 Localization
- Swiss postal code autocomplete
- EU/EFTA status automatic detection
- Municipality-specific information
- Multi-language support

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **AI**: Google Gemini API for document analysis
- **PDF Processing**: pdf-lib, PDF.js
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Google Gemini API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ExpatVillage
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your environment variables:
```env
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

5. Set up the database:
```bash
# Run the SQL scripts in your Supabase dashboard
# - db_schema_complete.sql
# - tasks_1_2_3_setup.sql
# - form_analyses_setup.sql
```

6. Start the development server:
```bash
npm run dev
```

## Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Set up environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_GEMINI_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Deploy automatically on push to main branch

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_GEMINI_API_KEY` | Google Gemini API key for AI processing | Yes |
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |

## API Endpoints

### PDF Processing
- `POST /api/pdf/optimized-form-analysis` - Analyze PDF forms
- `POST /api/pdf/test-fill-form` - Fill PDF forms
- `GET /api/user/profile` - Get user profile for autofill

### Swiss Data
- `GET /api/swiss-places` - Swiss postal code autocomplete
- `GET /api/eu-countries` - EU/EFTA country detection

### Documents
- `GET /api/documents/load` - Load user documents
- `POST /api/documents/create-links` - Generate signed URLs

## Database Schema

### Key Tables
- `tasks` - Task definitions and content
- `documents_vault` - User uploaded documents
- `form_analyses` - PDF form analysis cache
- `users` - User profiles and preferences

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the GitHub repository.
