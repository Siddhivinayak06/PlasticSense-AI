# WasteSense AI — Supabase Auth & Google OAuth Setup Guide

This guide walks you through the exact settings to configure in **Google Cloud Console** and the **Supabase Dashboard** for the `mepiirlnaiacikuyofmy` project.

---

## 1. Google Cloud Console Settings

1. Open [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials).
2. Select your Google Cloud project (or create one named `WasteSense-AI`).
3. If not already configured, set up your **OAuth consent screen**:
   - **User Type**: External
   - **App name**: WasteSense AI
   - **User support email**: `bipinkuruvilla134@gmail.com`
   - **Developer contact**: `bipinkuruvilla134@gmail.com`
   - **Scopes**: `.../auth/userinfo.email`, `.../auth/userinfo.profile`, `openid`
4. Go to **Credentials** -> Click **+ CREATE CREDENTIALS** -> Select **OAuth client ID**:
   - **Application type**: Web application
   - **Name**: `WasteSense Web Client`
   - **Authorized JavaScript origins**:
     ```text
     http://localhost:3000
     https://mepiirlnaiacikuyofmy.supabase.co
     ```
   - **Authorized redirect URIs**:
     ```text
     https://mepiirlnaiacikuyofmy.supabase.co/auth/v1/callback
     ```
5. Click **Create** and copy:
   - **Client ID**
   - **Client Secret**

---

## 2. Supabase Dashboard Configuration

Open your Supabase Project: [https://supabase.com/dashboard/project/mepiirlnaiacikuyofmy](https://supabase.com/dashboard/project/mepiirlnaiacikuyofmy)

### A. Enable Google Provider
1. In the left navigation, go to **Authentication** -> **Providers**.
2. Expand **Google**:
   - Toggle **Enable Sign in with Google** to **ON**.
   - Paste your **Client ID** from Google Cloud Console.
   - Paste your **Client Secret** from Google Cloud Console.
   - Click **Save**.

### B. Configure Redirect URLs
1. In the left navigation, go to **Authentication** -> **URL Configuration**.
2. Set **Site URL**:
   ```text
   http://localhost:3000
   ```
3. Under **Redirect URLs**, click **Add URL** and add:
   ```text
   http://localhost:3000/auth/callback
   http://localhost:3000/**
   ```
4. Click **Save**.

### C. Copy API Keys to Your Environment Files
1. In the left navigation, go to **Project Settings** (gear icon) -> **API**:
2. Under **Project API keys**:
   - Copy the **`anon` `public`** key.
   - Open `Frontend/.env.local` and set:
     ```env
     NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
     NEXT_PUBLIC_SUPABASE_URL=https://mepiirlnaiacikuyofmy.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     ```
3. Under **JWT Settings**:
   - Copy the **JWT Secret**.
   - Open `Backend/.env` and ensure:
     ```env
     SUPABASE_JWT_SECRET="<your-jwt-secret>"
     ADMIN_EMAILS="bipinkuruvilla134@gmail.com"
     ```

### D. Apply Database Table & RLS Policies (SQL Editor)
1. In the left navigation, go to **SQL Editor** -> Click **New Query**.
2. Run the SQL schema script provided in [`Backend/supabase_schema.sql`](file:///home/bipin/Documents/PlasticSense-AI/Backend/supabase_schema.sql#L108-L175):
   ```sql
   CREATE TABLE IF NOT EXISTS public.user_profiles (
       id VARCHAR(36) NOT NULL PRIMARY KEY,
       email VARCHAR(255) NOT NULL UNIQUE,
       full_name VARCHAR(255),
       avatar_url VARCHAR(512),
       role VARCHAR(32) DEFAULT 'user' NOT NULL,
       created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
       updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
   );

   ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

   CREATE POLICY "Users can read own profile" 
   ON public.user_profiles 
   FOR SELECT 
   USING (auth.uid()::text = id);

   CREATE POLICY "Admins can view all profiles" 
   ON public.user_profiles 
   FOR SELECT 
   USING (
     EXISTS (
       SELECT 1 FROM public.user_profiles 
       WHERE id = auth.uid()::text AND role = 'admin'
     )
   );

   CREATE OR REPLACE FUNCTION public.handle_new_user()
   RETURNS TRIGGER AS $$
   BEGIN
     INSERT INTO public.user_profiles (id, email, full_name, avatar_url, role)
     VALUES (
       new.id::text,
       new.email,
       COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
       new.raw_user_meta_data->>'avatar_url',
       'user'
     )
     ON CONFLICT (id) DO UPDATE SET
       email = EXCLUDED.email,
       full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
       avatar_url = COALESCE(EXCLUDED.avatar_url, user_profiles.avatar_url),
       updated_at = NOW();
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;

   DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
   CREATE TRIGGER on_auth_user_created
     AFTER INSERT ON auth.users
     FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
   ```

---

## 3. Role-Based Access Control (RBAC) Summary

| Feature / Action | Public Visitor | Citizen User (`role: 'user'`) | Municipal Admin (`role: 'admin'`) |
| :--- | :---: | :---: | :---: |
| Landing Page & Public Docs | Yes | Yes | Yes |
| Google Sign-In | Yes | Yes | Yes |
| View Detections & Hotspots | Redirects to Sign-In | Yes | Yes |
| Upload & Run AI Detection | Redirects to Sign-In | Yes | Yes |
| Pollution Map & Analytics | Redirects to Sign-In | Yes | Yes |
| Create Cleanup Assignments | 401 | 403 Forbidden | **Allowed** |
| Update Cleanup Assignments | 401 | 403 Forbidden | **Allowed** |
| Verify Cleanups with AI | 401 | 403 Forbidden | **Allowed** |
| Onboard NGO Teams | 401 | 403 Forbidden | **Allowed** |
| User & Role Management (`/users`) | Redirects to Sign-In | 403 Forbidden | **Allowed** |
