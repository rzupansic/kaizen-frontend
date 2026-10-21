import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { kaizenApiRequest } from "../../utils/kaizenApi.ts";
import { dayKey, formatDayLong } from "../../utils/dates.ts";
import type { PREvent } from "../../utils/trainingStats.ts";
import type { WorkoutDetail } from "../../types.ts";

const HEADING_FONT = '"Shippori Mincho", ui-serif, Georgia, serif';

type WorkoutDetailDialogProps = {
  workoutId: number;
  /** PRs set in this workout, used to badge exercises. */
  prs?: PREvent[];
  onClose: () => void;
  /** Called after an edit or delete so the caller can refetch its data. */
  onChanged: () => void;
};

function errorMessage(error: unknown) {
  return error instanceof Error && error.message ? error.message : "Something went wrong. Please try again.";
}

export default function WorkoutDetailDialog({ workoutId, prs = [], onClose, onChanged }: WorkoutDetailDialogProps) {
  const [workout, setWorkout] = useState<WorkoutDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await kaizenApiRequest<{ workout: WorkoutDetail }>(`/api/workouts/${workoutId}`);
        if (!cancelled) setWorkout(response.workout);
      } catch (err) {
        if (!cancelled) setLoadError(errorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [workoutId]);

  const startEditing = () => {
    if (!workout) return;
    setName(workout.name);
    setDate(dayKey(workout.date));
    setNotes(workout.notes ?? "");
    setError("");
    setEditing(true);
  };

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!workout) return;
    if (name.trim() === "") return setError("Give the workout a name, like Push or Legs.");
    if (date === "") return setError("Pick a date.");

    setBusy(true);
    setError("");
    try {
      await kaizenApiRequest(`/api/workouts/${workout.id}`, {
        method: "PATCH",
        data: { name: name.trim(), date, notes: notes.trim() },
      });
      setWorkout({ ...workout, name: name.trim(), date, notes: notes.trim() === "" ? null : notes.trim() });
      setEditing(false);
      onChanged();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!workout) return;
    setBusy(true);
    setError("");
    try {
      await kaizenApiRequest(`/api/workouts/${workout.id}`, { method: "DELETE" });
      onChanged();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  const prByExercise = new Map(prs.map((event) => [event.exerciseId, event]));

  return (
    <Dialog open onClose={busy ? undefined : onClose} fullWidth maxWidth="sm" scroll="paper">
      <form onSubmit={handleSave} noValidate style={{ display: "contents" }}>
        <DialogTitle sx={{ fontFamily: HEADING_FONT }}>
          {editing ? "Edit workout" : (workout?.name ?? "Workout")}
        </DialogTitle>

        <DialogContent dividers>
          {loading && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          )}

          {loadError && <Alert severity="error">{loadError}</Alert>}

          {workout && editing && (
            <Box sx={{ display: "grid", gap: 2, pt: 1 }}>
              <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 11rem" } }}>
                <TextField
                  autoFocus
                  label="Workout name"
                  value={name}
                  disabled={busy}
                  onChange={(event) => setName(event.target.value)}
                />
                <TextField
                  label="Date"
                  type="date"
                  value={date}
                  disabled={busy}
                  onChange={(event) => setDate(event.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Box>
              <TextField
                multiline
                minRows={2}
                label="Notes"
                value={notes}
                disabled={busy}
                onChange={(event) => setNotes(event.target.value)}
              />
              <Typography variant="caption" sx={{ color: "#7a5c24" }}>
                Exercises and sets can't be changed after a workout is saved.
              </Typography>
            </Box>
          )}

          {workout && !editing && (
            <>
              <Typography variant="body2" sx={{ color: "#7a5c24" }}>
                {formatDayLong(workout.date)}
              </Typography>
              {workout.notes && (
                <Typography sx={{ mt: 1, fontStyle: "italic" }}>{workout.notes}</Typography>
              )}

              <Box sx={{ mt: 2, display: "grid", gap: 1.5 }}>
                {workout.exercises.map((exercise) => {
                  const pr = prByExercise.get(exercise.exerciseId);
                  return (
                    <Box
                      key={exercise.exerciseId}
                      sx={{ p: 1.5, border: "1px solid rgba(208, 173, 106, 0.6)" }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                        <Typography sx={{ fontWeight: 500 }}>{exercise.exerciseName}</Typography>
                        <Typography variant="caption" sx={{ color: "#7a5c24" }}>
                          {exercise.muscleGroup}
                        </Typography>
                        {pr && (
                          <Chip
                            size="small"
                            icon={<EmojiEventsIcon />}
                            label={`PR · est. 1RM ${Math.round(pr.oneRepMax)} lb`}
                            sx={{ ml: "auto", bgcolor: "#c43b22", color: "#faf6ec", "& .MuiChip-icon": { color: "inherit" } }}
                          />
                        )}
                      </Box>
                      <Box component="ol" sx={{ m: 0, mt: 0.5, pl: 0, listStyle: "none" }}>
                        {exercise.sets.map((set) => (
                          <Typography
                            component="li"
                            variant="body2"
                            key={set.setNumber}
                            sx={{ display: "flex", gap: 2 }}
                          >
                            <span style={{ width: "3.5rem", color: "#7a5c24" }}>Set {set.setNumber}</span>
                            <span>
                              {set.weight} lb × {set.reps}
                            </span>
                          </Typography>
                        ))}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </>
          )}

          {confirmingDelete && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Delete this workout and all of its sets? This can't be undone.
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          {editing ? (
            <>
              <Button onClick={() => setEditing(false)} disabled={busy} color="inherit">
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={busy}>
                {busy ? "Saving..." : "Save changes"}
              </Button>
            </>
          ) : confirmingDelete ? (
            <>
              <Button onClick={() => setConfirmingDelete(false)} disabled={busy} color="inherit">
                Keep it
              </Button>
              <Button onClick={handleDelete} disabled={busy} variant="contained" color="error">
                {busy ? "Deleting..." : "Delete workout"}
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={() => setConfirmingDelete(true)}
                disabled={!workout}
                color="error"
                sx={{ mr: "auto" }}
              >
                Delete
              </Button>
              <Button onClick={startEditing} disabled={!workout}>
                Edit
              </Button>
              <Button onClick={onClose} variant="contained">
                Close
              </Button>
            </>
          )}
        </DialogActions>
      </form>
    </Dialog>
  );
}
