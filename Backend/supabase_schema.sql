
CREATE TABLE detections (
	id VARCHAR(36) NOT NULL, 
	image_url VARCHAR(512) NOT NULL, 
	annotated_image_url VARCHAR(512), 
	latitude FLOAT, 
	longitude FLOAT, 
	location_source VARCHAR(50), 
	location_confidence FLOAT, 
	model_version VARCHAR(64) NOT NULL, 
	detection_status VARCHAR(32) NOT NULL, 
	failure_reason VARCHAR(512), 
	processing_time_ms FLOAT, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id)
)

;


CREATE TABLE ngo_teams (
	id VARCHAR(36) NOT NULL, 
	name VARCHAR(128) NOT NULL, 
	city VARCHAR(64) NOT NULL, 
	state VARCHAR(64) NOT NULL, 
	contact_person VARCHAR(128) NOT NULL, 
	email VARCHAR(128) NOT NULL, 
	phone VARCHAR(32) NOT NULL, 
	team_size INTEGER NOT NULL, 
	active_assignments INTEGER NOT NULL, 
	completed_cleanups INTEGER NOT NULL, 
	availability VARCHAR(32) NOT NULL, 
	current_workload VARCHAR(32) NOT NULL, 
	performance_score INTEGER NOT NULL, 
	avg_completion_days FLOAT NOT NULL, 
	specializations JSONB NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id)
)

;


CREATE TABLE cleanup_assignments (
	id VARCHAR(36) NOT NULL, 
	title VARCHAR(256) NOT NULL, 
	detection_id VARCHAR(36), 
	hotspot_id VARCHAR(64), 
	location_name VARCHAR(256) NOT NULL, 
	latitude FLOAT, 
	longitude FLOAT, 
	priority VARCHAR(32) NOT NULL, 
	severity VARCHAR(32) NOT NULL, 
	risk_score FLOAT NOT NULL, 
	waste_count INTEGER NOT NULL, 
	waste_before INTEGER NOT NULL, 
	waste_after INTEGER, 
	waste_reduction_percent FLOAT, 
	status VARCHAR(32) NOT NULL, 
	ngo_team_id VARCHAR(36), 
	ngo_team_name VARCHAR(128), 
	scheduled_date TIMESTAMP WITH TIME ZONE, 
	completed_date TIMESTAMP WITH TIME ZONE, 
	notes TEXT, 
	before_image_url VARCHAR(512), 
	after_image_url VARCHAR(512), 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(detection_id) REFERENCES detections (id) ON DELETE SET NULL, 
	FOREIGN KEY(ngo_team_id) REFERENCES ngo_teams (id) ON DELETE SET NULL
)

;


CREATE TABLE detection_items (
	id VARCHAR(36) NOT NULL, 
	detection_id VARCHAR(36) NOT NULL, 
	class_name VARCHAR(128) NOT NULL, 
	waste_group VARCHAR(64) NOT NULL, 
	confidence FLOAT NOT NULL, 
	bbox_x FLOAT NOT NULL, 
	bbox_y FLOAT NOT NULL, 
	bbox_w FLOAT NOT NULL, 
	bbox_h FLOAT NOT NULL, 
	waste_type VARCHAR(128) NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(detection_id) REFERENCES detections (id) ON DELETE CASCADE
)

;


CREATE TABLE risk_assessments (
	id VARCHAR(36) NOT NULL, 
	detection_id VARCHAR(36) NOT NULL, 
	score FLOAT NOT NULL, 
	level VARCHAR(16) NOT NULL, 
	strategy_breakdown JSONB NOT NULL, 
	computed_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(detection_id) REFERENCES detections (id) ON DELETE CASCADE
)

;

CREATE TABLE user_profiles (
	id VARCHAR(36) NOT NULL, 
	google_sub VARCHAR(255),
	email VARCHAR(255) NOT NULL, 
	full_name VARCHAR(255), 
	avatar_url VARCHAR(512), 
	role VARCHAR(32) DEFAULT 'citizen' NOT NULL, 
	is_active BOOLEAN DEFAULT TRUE NOT NULL,
	last_login_at TIMESTAMP WITH TIME ZONE,
	created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (email),
	UNIQUE (google_sub)
);

CREATE TABLE role_audit_logs (
	id VARCHAR(36) PRIMARY KEY,
	user_id VARCHAR(36) NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
	changed_by_admin_id VARCHAR(36) NOT NULL,
	old_role VARCHAR(32) NOT NULL,
	new_role VARCHAR(32) NOT NULL,
	reason TEXT,
	created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX ix_role_audit_logs_user_id ON role_audit_logs(user_id);
CREATE INDEX ix_role_audit_logs_created_at ON role_audit_logs(created_at);

-- RLS: Enable Row Level Security on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can read their own profile
CREATE POLICY "Users can read own profile" 
ON user_profiles 
FOR SELECT 
USING (auth.uid()::text = id);

-- Policy 2: Municipal Admins can view all user profiles
CREATE POLICY "Admins can view all profiles" 
ON user_profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid()::text AND role = 'admin'
  )
);

-- Policy 3: Users can update their own personal info (name, avatar), but NOT their role
CREATE POLICY "Users can update own personal info" 
ON user_profiles 
FOR UPDATE 
USING (auth.uid()::text = id)
WITH CHECK (
  auth.uid()::text = id AND 
  role = (SELECT role FROM user_profiles WHERE id = auth.uid()::text)
);

-- Policy 4: Allow authenticated users to insert/sync their profile
CREATE POLICY "Users can insert their own profile" 
ON user_profiles 
FOR INSERT 
WITH CHECK (auth.uid()::text = id);

-- Trigger: Automatically create or update user_profile when a user signs in with Google OAuth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  existing_id VARCHAR(36);
  assigned_role VARCHAR(32);
BEGIN
  -- Check if this email should have admin access
  assigned_role := 'user';
  IF LOWER(new.email) IN ('siddhivinayaksawant04@gmail.com', 'bipinkuruvilla134@gmail.com') THEN
    assigned_role := 'admin';
  END IF;

  -- Check if profile already exists by email
  SELECT id INTO existing_id FROM public.user_profiles WHERE LOWER(email) = LOWER(new.email);

  IF existing_id IS NOT NULL THEN
    -- Update existing profile to link to the new Supabase Auth UUID
    UPDATE public.user_profiles
    SET id = new.id::text,
        full_name = COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', user_profiles.full_name),
        avatar_url = COALESCE(new.raw_user_meta_data->>'avatar_url', user_profiles.avatar_url),
        role = CASE WHEN assigned_role = 'admin' THEN 'admin' ELSE user_profiles.role END,
        updated_at = NOW()
    WHERE id = existing_id;
  ELSE
    -- Insert new user profile
    INSERT INTO public.user_profiles (id, email, full_name, avatar_url, role, created_at, updated_at)
    VALUES (
      new.id::text,
      LOWER(new.email),
      COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
      new.raw_user_meta_data->>'avatar_url',
      assigned_role,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
      avatar_url = COALESCE(EXCLUDED.avatar_url, user_profiles.avatar_url),
      updated_at = NOW();
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log warning but NEVER abort auth.users user creation
  RAISE WARNING 'handle_new_user error: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


