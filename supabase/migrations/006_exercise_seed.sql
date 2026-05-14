-- supabase/migrations/006_exercise_seed.sql
-- ~280 exercises across all major muscle groups and equipment types

insert into public.exercises (name, muscle_group, equipment) values
-- CHEST / Barbell
('Barbell Bench Press', 'Chest', 'Barbell'),
('Incline Barbell Press', 'Chest', 'Barbell'),
('Decline Barbell Press', 'Chest', 'Barbell'),
('Close-Grip Bench Press', 'Chest', 'Barbell'),
('Svend Press', 'Chest', 'Barbell'),
-- CHEST / Dumbbell
('Dumbbell Bench Press', 'Chest', 'Dumbbell'),
('Incline Dumbbell Press', 'Chest', 'Dumbbell'),
('Decline Dumbbell Press', 'Chest', 'Dumbbell'),
('Dumbbell Fly', 'Chest', 'Dumbbell'),
('Incline Dumbbell Fly', 'Chest', 'Dumbbell'),
('Hex Press', 'Chest', 'Dumbbell'),
-- CHEST / Cable
('Cable Crossover', 'Chest', 'Cable'),
('Cable Fly (Low to High)', 'Chest', 'Cable'),
('Cable Fly (High to Low)', 'Chest', 'Cable'),
-- CHEST / Machine
('Machine Chest Press', 'Chest', 'Machine'),
('Pec Deck Fly', 'Chest', 'Machine'),
('Smith Machine Bench Press', 'Chest', 'Smith Machine'),
-- CHEST / Bodyweight
('Push-Up', 'Chest', 'Bodyweight'),
('Incline Push-Up', 'Chest', 'Bodyweight'),
('Decline Push-Up', 'Chest', 'Bodyweight'),
('Chest Dip', 'Chest', 'Bodyweight'),
('Diamond Push-Up', 'Chest', 'Bodyweight'),

-- BACK / Barbell
('Barbell Row', 'Back', 'Barbell'),
('Pendlay Row', 'Back', 'Barbell'),
('Yates Row', 'Back', 'Barbell'),
('Good Morning', 'Back', 'Barbell'),
('Rack Pull', 'Back', 'Barbell'),
('Barbell Pullover', 'Back', 'Barbell'),
-- BACK / Dumbbell
('Dumbbell Row', 'Back', 'Dumbbell'),
('Kroc Row', 'Back', 'Dumbbell'),
('Meadows Row', 'Back', 'Dumbbell'),
('Dumbbell Pullover', 'Back', 'Dumbbell'),
('Renegade Row', 'Back', 'Dumbbell'),
('Seal Row', 'Back', 'Dumbbell'),
-- BACK / Cable
('Seated Cable Row', 'Back', 'Cable'),
('Lat Pulldown', 'Back', 'Cable'),
('Straight-Arm Pulldown', 'Back', 'Cable'),
('Single-Arm Cable Row', 'Back', 'Cable'),
('Cable Pullover', 'Back', 'Cable'),
('Face Pull', 'Back', 'Cable'),
-- BACK / Machine
('Machine Row', 'Back', 'Machine'),
('Chest-Supported Row', 'Back', 'Machine'),
-- BACK / Bodyweight
('Pull-Up', 'Back', 'Bodyweight'),
('Chin-Up', 'Back', 'Bodyweight'),
('Inverted Row', 'Back', 'Bodyweight'),
('Superman', 'Back', 'Bodyweight'),
('Back Extension', 'Back', 'Bodyweight'),
('Band Pull-Apart', 'Back', 'Resistance Band'),
-- BACK / TRX
('TRX Row', 'Back', 'TRX'),

-- SHOULDERS / Barbell
('Barbell Overhead Press', 'Shoulders', 'Barbell'),
('Push Press', 'Shoulders', 'Barbell'),
('Behind-the-Neck Press', 'Shoulders', 'Barbell'),
('Bradford Press', 'Shoulders', 'Barbell'),
('Upright Row', 'Shoulders', 'Barbell'),
('Barbell Shrug', 'Shoulders', 'Barbell'),
-- SHOULDERS / Dumbbell
('Dumbbell Shoulder Press', 'Shoulders', 'Dumbbell'),
('Arnold Press', 'Shoulders', 'Dumbbell'),
('Lateral Raise', 'Shoulders', 'Dumbbell'),
('Front Raise', 'Shoulders', 'Dumbbell'),
('Rear Delt Fly', 'Shoulders', 'Dumbbell'),
('Dumbbell Shrug', 'Shoulders', 'Dumbbell'),
-- SHOULDERS / Cable
('Cable Lateral Raise', 'Shoulders', 'Cable'),
('Cable Front Raise', 'Shoulders', 'Cable'),
('Cable Rear Delt Fly', 'Shoulders', 'Cable'),
-- SHOULDERS / Machine
('Machine Shoulder Press', 'Shoulders', 'Machine'),
('Reverse Pec Deck', 'Shoulders', 'Machine'),
-- SHOULDERS / Kettlebell
('Kettlebell Press', 'Shoulders', 'Kettlebell'),
('Z-Press', 'Shoulders', 'Kettlebell'),

-- BICEPS / Barbell
('Barbell Curl', 'Biceps', 'Barbell'),
('EZ-Bar Curl', 'Biceps', 'Barbell'),
('Reverse Curl', 'Biceps', 'Barbell'),
('Drag Curl', 'Biceps', 'Barbell'),
-- BICEPS / Dumbbell
('Dumbbell Curl', 'Biceps', 'Dumbbell'),
('Hammer Curl', 'Biceps', 'Dumbbell'),
('Incline Dumbbell Curl', 'Biceps', 'Dumbbell'),
('Concentration Curl', 'Biceps', 'Dumbbell'),
('Spider Curl', 'Biceps', 'Dumbbell'),
('Zottman Curl', 'Biceps', 'Dumbbell'),
-- BICEPS / Cable
('Cable Curl', 'Biceps', 'Cable'),
('Cable Hammer Curl', 'Biceps', 'Cable'),
('Cable Rope Curl', 'Biceps', 'Cable'),
('Bayesian Curl', 'Biceps', 'Cable'),
-- BICEPS / Machine
('Preacher Curl (Machine)', 'Biceps', 'Machine'),
-- BICEPS / Barbell (preacher)
('Barbell Preacher Curl', 'Biceps', 'Barbell'),

-- TRICEPS / Barbell
('Skull Crusher', 'Triceps', 'Barbell'),
('Close-Grip Bench Press', 'Triceps', 'Barbell'),
('JM Press', 'Triceps', 'Barbell'),
('French Press', 'Triceps', 'Barbell'),
-- TRICEPS / Dumbbell
('Dumbbell Overhead Extension', 'Triceps', 'Dumbbell'),
('Dumbbell Kickback', 'Triceps', 'Dumbbell'),
('Tate Press', 'Triceps', 'Dumbbell'),
-- TRICEPS / Cable
('Tricep Pushdown (Bar)', 'Triceps', 'Cable'),
('Tricep Pushdown (Rope)', 'Triceps', 'Cable'),
('Overhead Tricep Extension (Cable)', 'Triceps', 'Cable'),
('Single-Arm Pushdown', 'Triceps', 'Cable'),
-- TRICEPS / Bodyweight
('Tricep Dip', 'Triceps', 'Bodyweight'),
('Bench Dip', 'Triceps', 'Bodyweight'),
('Diamond Push-Up', 'Triceps', 'Bodyweight'),
-- TRICEPS / Machine
('Machine Tricep Press', 'Triceps', 'Machine'),

-- FOREARMS
('Barbell Wrist Curl', 'Forearms', 'Barbell'),
('Reverse Wrist Curl', 'Forearms', 'Barbell'),
('Dumbbell Wrist Curl', 'Forearms', 'Dumbbell'),
('Reverse Dumbbell Curl', 'Forearms', 'Dumbbell'),
('Wrist Roller', 'Forearms', 'Bodyweight'),
('Plate Pinch', 'Forearms', 'Bodyweight'),
('Towel Pull-Up', 'Forearms', 'Bodyweight'),

-- QUADS / Barbell
('Back Squat', 'Quads', 'Barbell'),
('Front Squat', 'Quads', 'Barbell'),
('Box Squat', 'Quads', 'Barbell'),
('Pause Squat', 'Quads', 'Barbell'),
('Hack Squat (Barbell)', 'Quads', 'Barbell'),
-- QUADS / Machine
('Leg Press', 'Quads', 'Machine'),
('Hack Squat (Machine)', 'Quads', 'Machine'),
('Leg Extension', 'Quads', 'Machine'),
('Terminal Knee Extension', 'Quads', 'Machine'),
('Smith Machine Squat', 'Quads', 'Smith Machine'),
-- QUADS / Dumbbell
('Goblet Squat', 'Quads', 'Dumbbell'),
('Bulgarian Split Squat', 'Quads', 'Dumbbell'),
('Lunge', 'Quads', 'Dumbbell'),
('Walking Lunge', 'Quads', 'Dumbbell'),
('Reverse Lunge', 'Quads', 'Dumbbell'),
('Lateral Lunge', 'Quads', 'Dumbbell'),
('Step-Up', 'Quads', 'Dumbbell'),
-- QUADS / Bodyweight
('Bodyweight Squat', 'Quads', 'Bodyweight'),
('Jump Squat', 'Quads', 'Bodyweight'),
('Wall Sit', 'Quads', 'Bodyweight'),
('Sissy Squat', 'Quads', 'Bodyweight'),
('Cyclist Squat', 'Quads', 'Bodyweight'),
-- QUADS / Kettlebell
('Kettlebell Goblet Squat', 'Quads', 'Kettlebell'),

-- HAMSTRINGS / Barbell
('Romanian Deadlift', 'Hamstrings', 'Barbell'),
('Stiff-Leg Deadlift', 'Hamstrings', 'Barbell'),
('Sumo Deadlift', 'Hamstrings', 'Barbell'),
-- HAMSTRINGS / Dumbbell
('Dumbbell Romanian Deadlift', 'Hamstrings', 'Dumbbell'),
('Single-Leg Romanian Deadlift', 'Hamstrings', 'Dumbbell'),
-- HAMSTRINGS / Machine
('Lying Leg Curl', 'Hamstrings', 'Machine'),
('Seated Leg Curl', 'Hamstrings', 'Machine'),
('Nordic Curl', 'Hamstrings', 'Machine'),
-- HAMSTRINGS / Cable
('Cable Pull-Through', 'Hamstrings', 'Cable'),
-- HAMSTRINGS / Bodyweight
('Glute-Ham Raise', 'Hamstrings', 'Bodyweight'),
('Swiss Ball Leg Curl', 'Hamstrings', 'Bodyweight'),
-- HAMSTRINGS / Resistance Band
('Banded Romanian Deadlift', 'Hamstrings', 'Resistance Band'),

-- GLUTES / Barbell
('Hip Thrust', 'Glutes', 'Barbell'),
('Barbell Glute Bridge', 'Glutes', 'Barbell'),
('Sumo Squat', 'Glutes', 'Barbell'),
-- GLUTES / Dumbbell
('Dumbbell Hip Thrust', 'Glutes', 'Dumbbell'),
('Step-Up to Reverse Lunge', 'Glutes', 'Dumbbell'),
-- GLUTES / Cable
('Cable Glute Kickback', 'Glutes', 'Cable'),
('Cable Hip Abduction', 'Glutes', 'Cable'),
-- GLUTES / Machine
('Reverse Hyperextension', 'Glutes', 'Machine'),
('Hip Abduction Machine', 'Glutes', 'Machine'),
-- GLUTES / Bodyweight
('Bodyweight Glute Bridge', 'Glutes', 'Bodyweight'),
('Donkey Kick', 'Glutes', 'Bodyweight'),
('Fire Hydrant', 'Glutes', 'Bodyweight'),
-- GLUTES / Resistance Band
('Lateral Band Walk', 'Glutes', 'Resistance Band'),
('Clamshell', 'Glutes', 'Resistance Band'),
('Banded Glute Bridge', 'Glutes', 'Resistance Band'),

-- CALVES / Machine
('Standing Calf Raise', 'Calves', 'Machine'),
('Seated Calf Raise', 'Calves', 'Machine'),
('Donkey Calf Raise', 'Calves', 'Machine'),
('Leg Press Calf Raise', 'Calves', 'Machine'),
('Smith Machine Calf Raise', 'Calves', 'Smith Machine'),
-- CALVES / Bodyweight
('Single-Leg Calf Raise', 'Calves', 'Bodyweight'),
('Seated Calf Raise (BW)', 'Calves', 'Bodyweight'),

-- CORE / Bodyweight
('Plank', 'Core', 'Bodyweight'),
('Side Plank', 'Core', 'Bodyweight'),
('Copenhagen Plank', 'Core', 'Bodyweight'),
('Crunch', 'Core', 'Bodyweight'),
('Bicycle Crunch', 'Core', 'Bodyweight'),
('Russian Twist', 'Core', 'Bodyweight'),
('Leg Raise', 'Core', 'Bodyweight'),
('Hanging Leg Raise', 'Core', 'Bodyweight'),
('Hanging Knee Raise', 'Core', 'Bodyweight'),
('Dead Bug', 'Core', 'Bodyweight'),
('Hollow Hold', 'Core', 'Bodyweight'),
('V-Up', 'Core', 'Bodyweight'),
('Toe Touch', 'Core', 'Bodyweight'),
('Mountain Climber', 'Core', 'Bodyweight'),
('Dragon Flag', 'Core', 'Bodyweight'),
('L-Sit', 'Core', 'Bodyweight'),
('Flutter Kick', 'Core', 'Bodyweight'),
('Oblique Crunch', 'Core', 'Bodyweight'),
('Bird Dog', 'Core', 'Bodyweight'),
('Bear Crawl', 'Core', 'Bodyweight'),
('Ab Rollout', 'Core', 'Bodyweight'),
('Windmill', 'Core', 'Bodyweight'),
-- CORE / Cable
('Cable Crunch', 'Core', 'Cable'),
('Pallof Press', 'Core', 'Cable'),
('Woodchop', 'Core', 'Cable'),
-- CORE / Kettlebell
('Kettlebell Windmill', 'Core', 'Kettlebell'),
('Turkish Get-Up', 'Core', 'Kettlebell'),

-- FULL BODY / Barbell
('Deadlift', 'Full Body', 'Barbell'),
('Power Clean', 'Full Body', 'Barbell'),
('Hang Clean', 'Full Body', 'Barbell'),
('Clean and Press', 'Full Body', 'Barbell'),
('Snatch', 'Full Body', 'Barbell'),
('Push Jerk', 'Full Body', 'Barbell'),
('Thruster', 'Full Body', 'Barbell'),
('Barbell Complex', 'Full Body', 'Barbell'),
-- FULL BODY / Dumbbell
('Dumbbell Complex', 'Full Body', 'Dumbbell'),
('Man Maker', 'Full Body', 'Dumbbell'),
-- FULL BODY / Kettlebell
('Kettlebell Swing', 'Full Body', 'Kettlebell'),
('Kettlebell Clean', 'Full Body', 'Kettlebell'),
('Kettlebell Snatch', 'Full Body', 'Kettlebell'),
('Kettlebell Turkish Get-Up', 'Full Body', 'Kettlebell'),
-- FULL BODY / Bodyweight
('Burpee', 'Full Body', 'Bodyweight'),
('Box Jump', 'Full Body', 'Bodyweight'),
('Broad Jump', 'Full Body', 'Bodyweight'),
('Jump Lunge', 'Full Body', 'Bodyweight'),
('Tuck Jump', 'Full Body', 'Bodyweight'),
-- FULL BODY / Machine
('Sled Push', 'Full Body', 'Machine'),
('Sled Pull', 'Full Body', 'Machine'),
('Tire Flip', 'Full Body', 'Machine'),
-- FULL BODY / Bodyweight (battle)
('Battle Rope Waves', 'Full Body', 'Bodyweight'),
('Med Ball Slam', 'Full Body', 'Bodyweight'),
('Farmer''s Walk', 'Full Body', 'Bodyweight'),

-- CARDIO / Cardio Machine
('Treadmill Run', 'Cardio', 'Cardio Machine'),
('Rowing Machine', 'Cardio', 'Cardio Machine'),
('Assault Bike', 'Cardio', 'Cardio Machine'),
('Stationary Bike', 'Cardio', 'Cardio Machine'),
('Elliptical', 'Cardio', 'Cardio Machine'),
('Stair Climber', 'Cardio', 'Cardio Machine'),
('Ski Erg', 'Cardio', 'Cardio Machine'),
-- CARDIO / Bodyweight
('Jump Rope', 'Cardio', 'Bodyweight'),
('High Knees', 'Cardio', 'Bodyweight'),
('Butt Kicks', 'Cardio', 'Bodyweight'),
('Jumping Jacks', 'Cardio', 'Bodyweight'),
('Sprint Interval', 'Cardio', 'Bodyweight'),
('Box Jump (Cardio)', 'Cardio', 'Bodyweight'),
('Skipping', 'Cardio', 'Bodyweight'),
('Shuttle Run', 'Cardio', 'Bodyweight');
