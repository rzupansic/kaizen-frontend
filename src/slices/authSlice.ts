import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type AuthUser = {
  email: string;
};

type AuthState = {
  status: "unknown" | "authenticated" | "guest";
  user: AuthUser | null;
};

const initialState: AuthState = {
  status: "unknown",
  user: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<AuthUser | null>) {
      state.user = action.payload;
      state.status = action.payload ? "authenticated" : "guest";
    },
  },
});

export const { setUser } = authSlice.actions;
export default authSlice.reducer;
