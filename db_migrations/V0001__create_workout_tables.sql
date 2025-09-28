-- Create users table for VK users
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    vk_user_id BIGINT UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create workouts table
CREATE TABLE IF NOT EXISTS workouts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(200) NOT NULL,
    workout_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, workout_date)
);

-- Create exercises table
CREATE TABLE IF NOT EXISTS exercises (
    id SERIAL PRIMARY KEY,
    workout_id INTEGER REFERENCES workouts(id),
    name VARCHAR(200) NOT NULL,
    sets INTEGER DEFAULT 0,
    reps INTEGER DEFAULT 0,
    weight DECIMAL(6,2) DEFAULT 0,
    notes TEXT,
    exercise_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_vk_user_id ON users(vk_user_id);
CREATE INDEX IF NOT EXISTS idx_workouts_user_date ON workouts(user_id, workout_date);
CREATE INDEX IF NOT EXISTS idx_exercises_workout ON exercises(workout_id);