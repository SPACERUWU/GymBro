-- Exercises table
CREATE TABLE IF NOT EXISTS exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    category TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Workouts table
CREATE TABLE IF NOT EXISTS workouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Workout sets table
CREATE TABLE IF NOT EXISTS workout_sets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workout_id INTEGER NOT NULL,
    exercise_id INTEGER NOT NULL,
    weight REAL NOT NULL,
    reps INTEGER NOT NULL,
    set_order INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workout_id) REFERENCES workouts (id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises (id) ON DELETE CASCADE
);

-- Workout splits table
CREATE TABLE IF NOT EXISTS workout_splits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Exercise split assignments table
CREATE TABLE IF NOT EXISTS exercise_splits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exercise_id INTEGER NOT NULL,
    split_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exercise_id) REFERENCES exercises (id) ON DELETE CASCADE,
    FOREIGN KEY (split_id) REFERENCES workout_splits (id) ON DELETE CASCADE
);

-- Insert workout splits
INSERT OR IGNORE INTO workout_splits (name, description) VALUES
('Push', 'Chest, Shoulders, Triceps'),
('Pull', 'Back, Biceps'),
('Legs', 'Quads, Hamstrings, Glutes, Calves'),
('Rest', 'Rest Day - Recovery');

-- Insert some default exercises
INSERT OR IGNORE INTO exercises (name, category) VALUES
-- Free Weights
('Bench Press', 'Chest'),
('Squat', 'Legs'),
('Deadlift', 'Back'),
('Overhead Press', 'Shoulders'),
('Barbell Row', 'Back'),
('Pull-ups', 'Back'),
('Dips', 'Chest'),
('Lunges', 'Legs'),
('Bicep Curls', 'Arms'),
('Tricep Extensions', 'Arms'),
('Lateral Raises', 'Shoulders'),
('Calf Raises', 'Legs'),
-- Machine Exercises
('Chest Press Machine', 'Chest'),
('Leg Press Machine', 'Legs'),
('Lat Pulldown Machine', 'Back'),
('Shoulder Press Machine', 'Shoulders'),
('Seated Row Machine', 'Back'),
('Leg Extension Machine', 'Legs'),
('Leg Curl Machine', 'Legs'),
('Cable Chest Fly', 'Chest'),
('Cable Lat Pulldown', 'Back'),
('Cable Bicep Curl', 'Arms'),
('Cable Tricep Pushdown', 'Arms'),
('Cable Lateral Raise', 'Shoulders'),
('Cable Row', 'Back'),
('Hack Squat Machine', 'Legs'),
('Smith Machine Squat', 'Legs'),
('Smith Machine Bench Press', 'Chest'),
('Pec Deck Machine', 'Chest'),
('Reverse Pec Deck', 'Shoulders'),
('Cable Crossover', 'Chest'),
('Cable Woodchop', 'Core'),
('Cable Crunch', 'Core'),
('Ab Crunch Machine', 'Core'),
('Back Extension Machine', 'Back'),
('Hip Adductor Machine', 'Legs'),
('Hip Abductor Machine', 'Legs'),
('Seated Calf Raise Machine', 'Legs'),
('Standing Calf Raise Machine', 'Legs'),
('Preacher Curl Machine', 'Arms'),
('Tricep Dip Machine', 'Arms'),
('Assisted Pull-up Machine', 'Back'),
('T-bar Row Machine', 'Back'),
('Incline Chest Press Machine', 'Chest'),
('Decline Chest Press Machine', 'Chest'),
('Cable Face Pull', 'Shoulders'),
('Cable Shrug', 'Back'),
('Cable Reverse Fly', 'Shoulders'),
('Cable Hammer Curl', 'Arms'),
('Cable Overhead Extension', 'Arms'),
('Cable Kickback', 'Arms'),
('Cable Squat', 'Legs'),
('Cable Lunge', 'Legs'),
('Cable Deadlift', 'Back'),
('Cable Good Morning', 'Back'),
('Cable Russian Twist', 'Core'),
('Cable Side Bend', 'Core'),
('Cable Pallof Press', 'Core');

-- Assign exercises to workout splits
-- Push Day Exercises (Chest, Shoulders, Triceps)
INSERT OR IGNORE INTO exercise_splits (exercise_id, split_id) 
SELECT e.id, ws.id FROM exercises e, workout_splits ws 
WHERE e.name IN (
    'Bench Press', 'Overhead Press', 'Dips', 'Chest Press Machine', 
    'Shoulder Press Machine', 'Cable Chest Fly', 'Smith Machine Bench Press',
    'Pec Deck Machine', 'Cable Crossover', 'Incline Chest Press Machine',
    'Decline Chest Press Machine', 'Cable Lateral Raise', 'Cable Tricep Pushdown', 
    'Tricep Extensions', 'Tricep Dip Machine', 'Cable Overhead Extension', 
    'Cable Kickback', 'Cable Face Pull', 'Cable Reverse Fly'
) AND ws.name = 'Push';

-- Pull Day Exercises (Back, Biceps)
INSERT OR IGNORE INTO exercise_splits (exercise_id, split_id) 
SELECT e.id, ws.id FROM exercises e, workout_splits ws 
WHERE e.name IN (
    'Deadlift', 'Barbell Row', 'Pull-ups', 'Lat Pulldown Machine',
    'Seated Row Machine', 'Cable Lat Pulldown', 'Cable Row',
    'Assisted Pull-up Machine', 'T-bar Row Machine', 'Cable Shrug',
    'Back Extension Machine', 'Cable Deadlift', 'Cable Good Morning',
    'Bicep Curls', 'Cable Bicep Curl', 'Cable Hammer Curl',
    'Preacher Curl Machine', 'Cable Reverse Fly', 'Cable Face Pull',
    'Cable Pallof Press', 'Cable Russian Twist'
) AND ws.name = 'Pull';

-- Leg Day Exercises (Quads, Hamstrings, Glutes, Calves)
INSERT OR IGNORE INTO exercise_splits (exercise_id, split_id) 
SELECT e.id, ws.id FROM exercises e, workout_splits ws 
WHERE e.name IN (
    'Squat', 'Lunges', 'Calf Raises', 'Leg Press Machine',
    'Leg Extension Machine', 'Leg Curl Machine', 'Hack Squat Machine',
    'Smith Machine Squat', 'Hip Adductor Machine', 'Hip Abductor Machine',
    'Seated Calf Raise Machine', 'Standing Calf Raise Machine',
    'Cable Squat', 'Cable Lunge'
) AND ws.name = 'Legs';

-- Planned workouts table
CREATE TABLE IF NOT EXISTS planned_workouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL UNIQUE,
    split_id INTEGER,
    notes TEXT,
    is_completed BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (split_id) REFERENCES workout_splits (id)
);

-- Workout schedule table
CREATE TABLE IF NOT EXISTS workout_schedule (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    split_name TEXT NOT NULL,
    day_of_week INTEGER NOT NULL, -- 0 = Sunday, 1 = Monday, etc.
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
