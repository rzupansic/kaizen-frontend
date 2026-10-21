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
import { kaizenApiRequest } from "../../utils/kaizenApi.ts";
import { formatDayLong } from "../../utils/dates.ts";
import type { WeightEntry } from "../../types.ts";

const HEADING_FONT = '"Shippori Mincho", ui-serif, Georgia, serif';

type WeightEditDialogProps = {
  entry: WeightEntry;
  onClose: () => void;
  /** Called after a successful save or delete so the caller can refetch. */
  onChanged: () => void;
};

function errorMessage(error: unknown) {
  return error instanceof Error && error.message ? error.message : "Something went wrong. Please try again.";
}

export default function WeightEditDialog({ entry, onClose, onChanged }: WeightEditDialogProps) {
  const [weight, setWeight] = useState(String(entry.weight));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    const value = Number(weight);
    if (weight.trim() === "" || !Number.isFinite(value) || value <= 0) {
      setError("Enter a weight greater than 0.");
      return;
    }
    if (value === entry.weight) {
      onClose();
      return;
    }

    setBusy(true);
    setError("");
    try {
      await kaizenApiRequest(`/api/weights/${entry.id}`, { method: "PUT", data: { weight: value } });
      onChanged();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    setError("");
    try {
      await kaizenApiRequest(`/api/weights/${entry.id}`, { method: "DELETE" });
      onChanged();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <Dialog open onClose={busy ? undefined : onClose} fullWidth maxWidth="xs">
      <form onSubmit={handleSave} noValidate style={{ display: "contents" }}>
        <DialogTitle sx={{ fontFamily: HEADING_FONT }}>Edit weight</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: "#7a5c24" }}>
            {formatDayLong(entry.date)}
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="Weight (lb)"
            type="number"
            value={weight}
            disabled={busy || confirmingDelete}
            onChange={(event) => setWeight(event.target.value)}
            slotProps={{ htmlInput: { min: 0, step: "0.1", inputMode: "decimal" } }}
          />
          {confirmingDelete && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Delete the {entry.weight} lb entry for {formatDayLong(entry.date)}? This can't be undone.
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          {confirmingDelete ? (
            <>
              <Button onClick={() => setConfirmingDelete(false)} disabled={busy} color="inherit">
                Keep it
              </Button>
              <Button onClick={handleDelete} disabled={busy} variant="contained" color="error">
                {busy ? "Deleting..." : "Delete"}
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={() => setConfirmingDelete(true)}
                disabled={busy}
                color="error"
                sx={{ mr: "auto" }}
              >
                Delete
              </Button>
              <Button onClick={onClose} disabled={busy} color="inherit">
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={busy}>
                {busy ? "Saving..." : "Save"}
              </Button>
            </>
          )}
        </DialogActions>
      </form>
    </Dialog>
  );
}
