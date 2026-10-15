import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import { useDispatch } from "react-redux";
import { kaizenApiRequest } from "../../utils/kaizenApi.ts";
import { addWeight, addWorkout, createExercise, getExercises } from "../../slices/logSlice.ts";
import type { AppDispatch } from "../../slices/store.ts";

export type LogMode = "weight" | "workout";

type LogModalProps = {
  type: LogMode;
  onClose: () => void;
  /** Called after a successful save so the caller can refetch its data. */
  onLogged: () => void;
};

type FormProps = {
  onClose: () => void;
  onLogged: () => void;
};

type Exercise = {
  id: number;
  name: string;
  muscle_group: string | null;
};

type SetDraft = { key: number; reps: string; weight: string };
type ExerciseDraft = { exerciseId: number; sets: SetDraft[] };

const HEADING_FONT = '"Shippori Mincho", ui-serif, Georgia, serif';

let nextKey = 0;
const newSet = (reps = "", weight = ""): SetDraft => ({ key: nextKey++, reps, weight });

function localToday() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function errorMessage(error: unknown) {
  return error instanceof Error && error.message ? error.message : "Something went wrong. Please try again.";
}


export default function LogModal({ type, onClose, onLogged }: LogModalProps) {
  return (
    <Dialog
      open
      onClose={onClose}
      fullWidth
      maxWidth={type === "weight" ? "xs" : "sm"}
      scroll="paper"
    >
      {type === "weight" ? (
        <WeightForm onClose={onClose} onLogged={onLogged} />
      ) : (
        <WorkoutForm onClose={onClose} onLogged={onLogged} />
      )}
    </Dialog>
  );
}

function WeightForm({ onClose, onLogged }: FormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [weight, setWeight] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const value = Number(weight);
    if (weight.trim() === "" || !Number.isFinite(value) || value <= 0) {
      setError("Enter a weight greater than 0.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const created = await dispatch(addWeight({ weight: value, date: localToday() })).unwrap();
      if (created) onLogged();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: "contents" }}>
      <DialogTitle sx={{ fontFamily: HEADING_FONT }}>Log weight</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2, color: "#7a5c24" }}>
          Logged for today.
        </Typography>
        <TextField
          autoFocus
          fullWidth
          label="Weight (lb)"
          type="number"
          value={weight}
          onChange={(event) => setWeight(event.target.value)}
          slotProps={{ htmlInput: { min: 0, step: "0.1", inputMode: "decimal" } }}
        />
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving} color="inherit">
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </form>
  );
}

function WorkoutForm({ onClose, onLogged }: FormProps) {
  const [name, setName] = useState("");
  const [date, setDate] = useState(localToday);
  const [notes, setNotes] = useState("");
  const [entries, setEntries] = useState<ExerciseDraft[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exercisesError, setExercisesError] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creatingExercise, setCreatingExercise] = useState(false);
  const [exerciseName, setExerciseName] = useState("");
  const [exerciseMuscleGroup, setExerciseMuscleGroup] = useState("");
  const [exerciseDescription, setExerciseDescription] = useState("");
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    let cancelled = false;

    async function loadExercises() {
      try {
        const data = await dispatch(getExercises()).unwrap();
        if (!cancelled) {
          setExercises(data as unknown as Exercise[]);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setExercisesError("Could not load the exercise list.");
        setLoading(false);
      }
    }

    loadExercises();
    return () => {
      cancelled = true;
    };
  }, []);

  const exerciseById = new Map(exercises.map((exercise) => [exercise.id, exercise]));
  const available = exercises
    .filter((exercise) => !entries.some((entry) => entry.exerciseId === exercise.id))
    .sort(
      (a, b) =>
        (a.muscle_group ?? "Other").localeCompare(b.muscle_group ?? "Other") ||
        a.name.localeCompare(b.name),
    );

  const addExercise = (exercise: Exercise) =>
    setEntries((current) => [...current, { exerciseId: exercise.id, sets: [newSet()] }]);

  const removeExercise = (exerciseId: number) =>
    setEntries((current) => current.filter((entry) => entry.exerciseId !== exerciseId));

  const addSet = (exerciseId: number) =>
    setEntries((current) =>
      current.map((entry) => {
        if (entry.exerciseId !== exerciseId) return entry;
        // Copy the previous set since lifters usually repeat it.
        const last = entry.sets[entry.sets.length - 1];
        return { ...entry, sets: [...entry.sets, newSet(last?.reps, last?.weight)] };
      }),
    );

  const removeSet = (exerciseId: number, key: number) =>
    setEntries((current) =>
      current.map((entry) =>
        entry.exerciseId === exerciseId
          ? { ...entry, sets: entry.sets.filter((set) => set.key !== key) }
          : entry,
      ),
    );

  const updateSet = (exerciseId: number, key: number, field: "reps" | "weight", value: string) =>
    setEntries((current) =>
      current.map((entry) =>
        entry.exerciseId === exerciseId
          ? {
              ...entry,
              sets: entry.sets.map((set) => (set.key === key ? { ...set, [field]: value } : set)),
            }
          : entry,
      ),
    );

  const handleStartCreateExercise = async () => {
    setCreatingExercise(true);
    setExerciseName("");
    setExerciseMuscleGroup("");
    setExerciseDescription("");
  };

  const handleCreateExercise = async () => {
    const created = await dispatch(createExercise({ name: exerciseName, muscleGroup: exerciseMuscleGroup, description: exerciseDescription })).unwrap();
    if (created) {
      setCreatingExercise(false);
      setExerciseName("");
      setExerciseMuscleGroup("");
      setExerciseDescription("");
    }
    setExercises([...exercises, created as unknown as Exercise]);
  };

  const handleCancelCreateExercise = () => {
    setCreatingExercise(false);
    setExerciseName("");
    setExerciseMuscleGroup("");
    setExerciseDescription("");
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (name.trim() === "") return setError("Give the workout a name, like Push or Legs.");
    if (date === "") return setError("Pick a date.");
    if (entries.length === 0) return setError("Add at least one exercise.");

    const payloadExercises = [];
    for (const entry of entries) {
      const label = exerciseById.get(entry.exerciseId)?.name ?? "An exercise";
      const sets = [];
      for (const set of entry.sets) {
        const reps = Number(set.reps);
        const weight = Number(set.weight);
        if (set.reps.trim() === "" || !Number.isInteger(reps) || reps <= 0) {
          return setError(`${label}: reps must be a whole number greater than 0.`);
        }
        if (set.weight.trim() === "" || !Number.isFinite(weight) || weight < 0) {
          return setError(`${label}: weight must be 0 or more.`);
        }
        sets.push({ reps, weight });
      }
      payloadExercises.push({ exerciseId: entry.exerciseId, sets });
    }

    setSaving(true);
    setError("");
    try {
      const created = await dispatch(
        addWorkout({ id: "", name: name.trim(), date, notes: notes.trim() === "" ? "" : notes.trim(), exercises: payloadExercises }),
      ).unwrap();
      if (created) onLogged();
      onClose();
    } catch (error) {
      setError(errorMessage(error));
      setSaving(false);
    }
  };
  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: "contents" }}>
      <DialogTitle sx={{ fontFamily: HEADING_FONT }}>Log workout for today</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 11rem" }, pt: 1 }}>
          <TextField
            autoFocus
            label="Workout name"
            placeholder="Push, Pull, Legs..."
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <TextField
            label="Date"
            type="date"
            disabled
            value={localToday()}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Box>
        <TextField
          fullWidth
          multiline
          minRows={2}
          label="Notes (optional)"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          sx={{ mt: 2 }}
        />

        <Typography sx={{ mt: 3, mb: 1, fontFamily: HEADING_FONT, color: "#7a5c24" }}>
          Exercises
        </Typography>
        {entries.map((entry) => (
          <Box
            key={entry.exerciseId}
            sx={{ mb: 2, p: 1.5, border: "1px solid rgba(208, 173, 106, 0.6)" }}
          >
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <Typography sx={{ flex: 1, fontWeight: 500 }}>
                {exerciseById.get(entry.exerciseId)?.name ?? "Exercise"}
              </Typography>
              <IconButton
                size="small"
                aria-label="Remove exercise"
                onClick={() => removeExercise(entry.exerciseId)}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Box>

            {entry.sets.map((set, index) => (
              <Box key={set.key} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <Typography variant="body2" sx={{ width: "3.5rem", color: "#7a5c24" }}>
                  Set {index + 1}
                </Typography>
                <TextField
                  size="small"
                  label="Reps"
                  type="number"
                  value={set.reps}
                  onChange={(event) => updateSet(entry.exerciseId, set.key, "reps", event.target.value)}
                  slotProps={{ htmlInput: { min: 1, step: 1, inputMode: "numeric" } }}
                  sx={{ flex: 1 }}
                />
                <TextField
                  size="small"
                  label="Weight (lb)"
                  type="number"
                  value={set.weight}
                  onChange={(event) => updateSet(entry.exerciseId, set.key, "weight", event.target.value)}
                  slotProps={{ htmlInput: { min: 0, step: "0.5", inputMode: "decimal" } }}
                  sx={{ flex: 1 }}
                />
                <IconButton
                  size="small"
                  aria-label="Remove set"
                  disabled={entry.sets.length === 1}
                  onClick={() => removeSet(entry.exerciseId, set.key)}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}

            <Button size="small" startIcon={<AddIcon />} onClick={() => addSet(entry.exerciseId)}>
              Add set
            </Button>
          </Box>
        ))}
        {creatingExercise && (
          <Box sx={{ mb: 2, p: 1.5, border: "1px solid rgba(208, 173, 106, 0.6)", display: "flex", flexDirection: "column", gap: 1 }}>
            <TextField
              autoFocus
              label="Exercise name"
              placeholder="Push, Pull, Legs..."
              value={exerciseName}
              onChange={(event) => setExerciseName(event.target.value)}
            />
            <TextField
              label="Muscle group"
              placeholder="Push, Pull, Legs..."
              value={exerciseMuscleGroup}
              onChange={(event) => setExerciseMuscleGroup(event.target.value)}
            />
            <TextField
              label="Description"
              placeholder="Description" 
              value={exerciseDescription}
              onChange={(event) => setExerciseDescription(event.target.value)}
            />

            <Box sx={{ display: "flex", gap: 1 }}>
              <Button onClick={handleCreateExercise} disabled={saving}>Create exercise</Button>
              <Button onClick={handleCancelCreateExercise} disabled={saving}>Cancel</Button>
            </Box>
          </Box>
        )}
        

        <Autocomplete
          options={available}
          groupBy={(option) => (option.muscle_group?.slice(0, 1).toUpperCase() + (option.muscle_group?.slice(1).toLowerCase() ?? "")) || "Other"}
          getOptionLabel={(option) => option.name}
          value={null}
          onChange={(_event, exercise) => {
            if (exercise) addExercise(exercise);
          }}
          noOptionsText={exercises.length === 0 && !exercisesError && loading ? "Loading..." : "No exercises available"}
          renderInput={(params) => <TextField {...params} size="small" label="Add exercise" />}
        />
        <Button onClick={handleStartCreateExercise} disabled={saving}>Create exercise</Button>
        {exercisesError && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            {exercisesError}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={saving} color="inherit">
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={saving}>
          {saving ? "Saving..." : "Save workout"}
        </Button>
      </DialogActions>
    </form>
  );
}
