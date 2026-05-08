# Authentication System Schema

## Database Tables

### users (main user table)
```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  password TEXT, -- Hashed
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_google_user BOOLEAN DEFAULT false,
  email_verified BOOLEAN DEFAULT false,
  email_verified_at TIMESTAMPTZ,
  verification_code TEXT, -- Hashed OTP
  verification_expires_at TIMESTAMPTZ,
  verification_attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

### user_sessions (session tracking)
```sql
CREATE TABLE public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  logged_out_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(token);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);
```

### rate_limit_log (rate limiting log)
```sql
CREATE TABLE public.rate_limit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, -- IP or email
  action TEXT NOT NULL, -- 'send_code', 'verify_code', 'login'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rate_limit_identifier ON rate_limit_log(identifier, created_at);
```

### family_services (custom services for families)
```sql
CREATE TABLE public.family_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  is_predefined BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_family_services_family_id ON family_services(family_id);
CREATE INDEX idx_family_services_user_id ON family_services(user_id);
CREATE UNIQUE INDEX idx_family_services_unique ON family_services(family_id, service_name);
```

Note: The `family_services` table is optional. Services can also be stored as a comma-separated string in the families table (current approach). This table allows for more granular control if needed.

## Security Features

### 1. OTP Hashing
- Codes are hashed using AES-256-GCM before storage
- Each code has unique salt and IV
- Environment variable: `OTP_ENCRYPTION_KEY`

### 2. Password Hashing
- Passwords use PBKDF2 with 100,000 iterations
- Each password has unique salt

### 3. Rate Limiting
- Registration: 5 requests per minute per email
- Verification: 5 requests per minute per email  
- Resend: 3 requests per minute per email
- Login: 10 requests per minute per email

### 4. Attempt Limiting
- Max 5 verification attempts per code
- After 5 failures, code is invalidated

### 5. Code Expiration
- Verification codes expire in 10 minutes

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/register` | POST | Register new user |
| `/api/login` | POST | Login with email/password |
| `/api/verify-email` | POST | Verify OTP code |
| `/api/resend-verification` | POST | Resend verification code |
| `/api/logout` | POST | Logout user |

## Environment Variables Required
```
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
OTP_ENCRYPTION_KEY= (min 32 characters)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
```

## Role-Based Access
- `user`: Standard access to dashboard
- `admin`: Access to admin routes (/admin, /settings/users)

## Middleware Protection
- Public routes: `/`, `/login`, `/register`, `/verify-email`, `/contact`, `/waitlist`, `/terms`, `/privacy`
- Protected routes: All other routes require authentication
- Admin routes: Require `role = 'admin'`