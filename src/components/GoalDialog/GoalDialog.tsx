import { useState } from "react";
import type { FormEvent } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

const HEADING_FONT = '"Shippori Mincho", ui-serif, Georgia, serif';

type GoalDialogProps = {
  /** Current goal, if one is set. */
  goal: number | null;
  /** Latest logged weight, shown for context. */
  latest: number | null;
  onSave: (goal: number | null) => void;
  onClose: () => void;
};

export default function GoalDialog({ goal, latest, onSave, onClose }: GoalDialogProps) {
  const [value, setValue] = useState(goal === null ? "" : String(goal));
  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const next = Number(value);
    if (value.trim() === "" || !Number.isFinite(next) || next <= 0) {
      setError("Enter a goal weight greater than 0.");
      return;
    }
    onSave(next);
    onClose();
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <form onSubmit={handleSubmit} noValidate style={{ display: "contents" }}>
        <DialogTitle sx={{ fontFamily: HEADING_FONT }}>Goal weight</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: "#7a5c24" }}>
            {latest === null
              ? "Set a target to see it on your chart."
              : `Your latest weight is ${latest} lb. The chart will show a goal line and an estimated finish date.`}
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="Goal (lb)"
            type="number"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            slotProps={{ htmlInput: { min: 0, step: "0.1", inputMode: "decimal" } }}
          />
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          {goal !== null && (
            <Button
              color="error"
              sx={{ mr: "auto" }}
              onClick={() => {
                onSave(null);
                onClose();
              }}
            >
              Clear goal
            </Button>
          )}
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained">
            Save
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
