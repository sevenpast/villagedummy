# Village Database Setup Guide

## Overview

This database stores the three critical pieces of user information that determine which tasks are shown and how they are personalized:

1. **Country of Origin** - Determines legal status and visa requirements
2. **Family Status** - Shows family-related tasks like school registration
3. **Destination in Switzerland** - Enables location-specific content and municipality help

## Important Assumption

**The user must already have an account** (via Supabase Auth or another authentication system). The `user_id` field in the `user_profiles` table links to the authenticated user's ID. This ensures that:

- Users can only access their own profile data
- Profile information is securely tied to authenticated users
- The app can provide personalized content based on the user's account

## Database Files

- `database_schema.sql` - Main database schema with tables, indexes, and sample data
- `database_permissions.sql` - User roles, permissions, and security policies

## Setup Instructions

### Option 1: Supabase (Recommended)

1. **Create a new Supabase project:**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note your project URL and anon key

2. **Run the schema:**
   - Go to SQL Editor in Supabase dashboard
   - Copy and paste the contents of `database_schema.sql`
   - Execute the script

3. **Set up permissions:**
   - Copy and paste the contents of `database_permissions.sql`
   - Execute the script

4. **Environment variables:**
   ```env
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### Option 2: PostgreSQL (Local/Production)

1. **Create database:**
   ```sql
   CREATE DATABASE village;
   ```

2. **Run schema:**
   ```bash
   psql -d village -f database_schema.sql
   ```

3. **Set up permissions:**
   ```bash
   psql -d village -f database_permissions.sql
   ```

## Database Schema

### Core Tables

#### `user_profiles`
Stores the three critical user information pieces:

```sql
- country_of_origin VARCHAR(100) -- Most critical information
- is_eu_efta_citizen BOOLEAN -- Derived from country_of_origin
- visa_status VARCHAR(50) -- 'visa_required', 'visa_exempt', 'not_applicable'
- has_children BOOLEAN -- Determines family-related tasks
- children_count INTEGER -- Total number of children
- school_age_children_count INTEGER -- Children aged 4-16
- target_municipality VARCHAR(100) -- Enables location-specific content
- target_canton VARCHAR(50) -- For canton-specific rules
```

#### `tasks`
Task definitions with targeting and sequencing information.

#### `task_visibility_rules`
Rules that determine which tasks are shown based on user profile.

#### `task_content`
Content variants for different user types (EU vs non-EU, with/without children).

#### `user_task_status`
Tracks user progress on tasks.

### Key Functions

#### `calculate_profile_completeness(profile_id UUID)`
Returns a JSON object showing which profile sections are complete and overall percentage.

#### `user_has_complete_profile(user_uuid UUID)`
Returns true if user has provided all three critical pieces of information.

#### `get_user_visible_tasks(user_uuid UUID)`
Returns tasks visible to a user based on their profile and visibility rules.

#### `get_task_content_variant(user_uuid UUID, task_id_param VARCHAR(50))`
Returns the correct content variant for a task based on user profile completeness and characteristics. This function handles the three scenarios for the visa task:

- **Incomplete Profile**: User hasn't provided country of origin
- **Non-EU/EFTA Visa-Exempt**: User from visa-exempt country (e.g., USA, Canada)
- **Non-EU/EFTA Visa-Required**: User from country requiring visa

## Security

### Row Level Security (RLS)
- Users can only access their own profile data
- Tasks and content are publicly readable
- Task status is user-specific

### User Roles
- `village_admin` - Full administrative access
- `village_app_user` - Application read/write access
- `village_readonly` - Read-only access for analytics

## Sample Data

The schema includes sample data for:
- 4 main tasks (visa, housing, municipality registration, school)
- Visibility rules for different user types
- Content variants for EU vs non-EU citizens
- A sample user profile for testing

## Usage Examples

### Check if user has complete profile
```sql
SELECT user_has_complete_profile('user-uuid-here');
```

### Get user's visible tasks
```sql
SELECT * FROM get_user_visible_tasks('user-uuid-here');
```

### Get correct content variant for a task
```sql
SELECT * FROM get_task_content_variant('user-uuid-here', 'secure_visa');
```

This will return different content based on the user's profile:
- If no country of origin: `incomplete_profile` variant
- If EU/EFTA citizen: `not_applicable` variant (visa not needed)
- If non-EU visa-exempt: `non_eu_visa_exempt` variant
- If non-EU visa-required: `non_eu_visa_required` variant

### Get profile completeness
```sql
SELECT calculated_completeness 
FROM user_profiles_with_completeness 
WHERE user_id = 'user-uuid-here';
```

### Update user profile
```sql
UPDATE user_profiles 
SET 
  country_of_origin = 'Germany',
  is_eu_efta_citizen = true,
  has_children = true,
  children_count = 2,
  school_age_children_count = 1,
  target_municipality = 'Zurich'
WHERE user_id = 'user-uuid-here';
```

## Integration with App

The database is designed to work with the existing TaskVisibilityEngine and ContentResolver classes. The app will:

1. Load user profile from `user_profiles` table
2. Use visibility rules to determine which tasks to show
3. Select appropriate content variants based on user profile
4. Track task progress in `user_task_status` table

## Next Steps

1. Set up Supabase project
2. Run the database schema
3. Update app to use real database instead of mock data
4. Implement user profile management UI
5. Test with different user profiles
