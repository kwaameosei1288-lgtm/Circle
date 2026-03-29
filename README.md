# Helping Hands Circle - Management System

A complete web-based management system for the Helping Hands Circle organization, built with modern web technologies.

## 🚀 Features

- **Authentication System**: Secure login with predefined users and forced password change
- **Dashboard**: Overview of contributions, welfare requests, and member statistics
- **Contribution Management**: Track monthly payments, handle part payments, and manage late fees
- **Welfare System**: Submit and approve welfare requests for various support types
- **Reports**: Generate PDF and CSV reports for weekly and monthly summaries
- **Member Management**: View and manage member information and roles
- **Profile System**: Update personal information and change passwords
- **Settings**: Theme toggle and admin system controls
- **Constitution**: Display organization constitution with acceptance tracking

## 🛠️ Tech Stack

- **Frontend**: HTML, CSS, Vanilla JavaScript
- **Backend**: Supabase (Authentication + Database)
- **Hosting**: Vercel
- **Libraries**: jsPDF (PDF generation), PapaParse (CSV export)

## 📋 Prerequisites

- Supabase account
- Vercel account (for deployment)
- Modern web browser

## 🔧 Supabase Setup

### 1. Create a New Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be set up

### 2. Database Tables

Create the following tables in your Supabase database:

#### `profiles`
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'member',
  password_changed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `contributions`
```sql
CREATE TABLE contributions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES profiles(id),
  amount DECIMAL(10,2) NOT NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('full', 'part')),
  month TEXT NOT NULL,
  transaction_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'late')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `welfare_requests`
```sql
CREATE TABLE welfare_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  request_type TEXT NOT NULL,
  amount DECIMAL(10,2),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  month TEXT DEFAULT TO_CHAR(NOW(), 'Month'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `constitution_acceptance`
```sql
CREATE TABLE constitution_acceptance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `audit_logs`
```sql
CREATE TABLE audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. Row Level Security (RLS) Policies

Enable RLS on all tables and create appropriate policies:

```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE welfare_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE constitution_acceptance ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Contributions policies
CREATE POLICY "Users can view their own contributions" ON contributions
  FOR SELECT USING (
    member_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'treasurer')
    )
  );

CREATE POLICY "Treasurers and admins can insert contributions" ON contributions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'treasurer')
    )
  );

-- Welfare requests policies
CREATE POLICY "Users can view their own requests" ON welfare_requests
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'welfare_officer', 'assistant_welfare_officer')
    )
  );

CREATE POLICY "Users can create their own requests" ON welfare_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Welfare officers can update requests" ON welfare_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'welfare_officer', 'assistant_welfare_officer')
    )
  );
```

### 4. Create Auth Users

Create the predefined users in Supabase Auth:

1. Go to Authentication > Users in your Supabase dashboard
2. Create users with these emails:
   - kingsley@helpinghands.com (Admin)
   - mavis@helpinghands.com (Treasurer)
   - rosemary@helpinghands.com (Secretary)
   - jacob@helpinghands.com (Welfare Officer)
   - constance@helpinghands.com (Assistant Welfare Officer)

3. Set initial password for all: `Password123`

### 5. Insert Profile Data

Insert the profile data for the users:

```sql
INSERT INTO profiles (id, name, email, role, password_changed) VALUES
  ('user-id-1', 'Kingsley', 'kingsley@helpinghands.com', 'admin', false),
  ('user-id-2', 'Mavis', 'mavis@helpinghands.com', 'treasurer', false),
  ('user-id-3', 'Rosemary', 'rosemary@helpinghands.com', 'secretary', false),
  ('user-id-4', 'Jacob', 'jacob@helpinghands.com', 'welfare_officer', false),
  ('user-id-5', 'Constance', 'constance@helpinghands.com', 'assistant_welfare_officer', false);
```

*Note: Replace 'user-id-X' with the actual UUIDs from the auth.users table*

## 🚀 Local Development

1. Clone this repository
2. Update the Supabase configuration in `lib/config.js`:
   ```javascript
   window.config = {
     SUPABASE_URL: 'your_supabase_project_url',
     SUPABASE_ANON_KEY: 'your_supabase_anon_key'
   };
   ```
3. Open `index.html` in your browser

## 📦 Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_ANON_KEY`: Your Supabase anon key
3. Update `lib/config.js` to use environment variables:
   ```javascript
   window.config = {
     SUPABASE_URL: process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL',
     SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'
   };
   ```
4. Deploy!

## 🔐 Security Notes

- Never expose your Supabase service key in frontend code
- All sensitive operations use Supabase Auth
- Row Level Security ensures users can only access appropriate data
- Role-based access controls implemented throughout

## 📱 Features Overview

### Authentication
- Username-based login (kingsley, mavis, rosemary, jacob, constance)
- Forced password change on first login
- Secure session management

### Dashboard
- Real-time statistics
- Recent activity feeds
- Mobile-responsive design

### Contributions
- Add payments with validation
- Track payment status
- Monthly contribution management
- Late fee calculation (GHS 10)

### Welfare
- Request support for marriage, funerals, sickness
- Approval workflow
- Status tracking

### Reports
- Weekly and monthly summaries
- PDF export with jsPDF
- CSV export with PapaParse

### Members
- View all members
- Role management
- Payment status overview

### Profile
- Update personal information
- Change password
- View contribution history

## 🎨 Design

- Modern glassmorphism UI
- Mobile-first responsive design
- Green color theme (#10B981)
- Smooth animations and transitions

## 📞 Support

For issues or questions, please check the code comments or create an issue in the repository.

---

**Built with ❤️ for Helping Hands Circle – Stronger Together**