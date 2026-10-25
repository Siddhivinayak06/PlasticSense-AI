
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
	email VARCHAR(255) NOT NULL, 
	full_name VARCHAR(255), 
	avatar_url VARCHAR(512), 
	role VARCHAR(32) DEFAULT 'user' NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (email)
);

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

-- Trigger: Automatically create a user_profile when a user signs in with Google OAuth for the first time
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, avatar_url, role)
  VALUES (
    new.id::text,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    'user' -- Default role is always normal user
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


