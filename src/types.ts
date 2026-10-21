export type WeightEntry = {
  id: number;
  weight: number;
  date: string;
};

export type WorkoutSummary = {
  id: number;
  name: string;
  date: string;
  notes: string | null;
};

export type WorkoutDetail = {
  id: number;
  name: string;
  date: string;
  notes: string | null;
  exercises: {
    exerciseId: number;
    exerciseName: string;
    muscleGroup: string;
    sets: { setNumber: number; weight: number; reps: number }[];
  }[];
};

/** One logged set, flattened with its workout + exercise (GET /api/workouts/history). */
export type SetRow = {
  workoutId: number;
  /** YYYY-MM-DD */
  date: string;
  exerciseId: number;
  exerciseName: string;
  muscleGroup: string;
  setNumber: number;
  weight: number;
  reps: number;
};
