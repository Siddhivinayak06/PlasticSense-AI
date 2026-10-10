
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

