import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { kaizenApiRequest } from "../utils/kaizenApi";

export type AuthUser = {
  email: string;
};

type AuthState = {
  status: "unknown" | "authenticated" | "guest";
  user: AuthUser | null;
};

type LoginResponse = {
  user: AuthUser;
  token: string;
};

const initialState: AuthState = {
  status: "unknown",
  user: null,
};

type MeResponse = {
  user: AuthUser;
};

export const restoreSession = createAsyncThunk("auth/restoreSession", async () => {
  const data = await kaizenApiRequest<MeResponse>("/api/auth/me");
  return data.user;
});

export const login = createAsyncThunk(
  "auth/login",
  async ({ email, password }: { email: string; password: string }) => {
    const data = await kaizenApiRequest<LoginResponse>("/api/auth/login", {
      method: "POST",
      data: { email, password },
    });
    return data.user;
  },
);

export const logout = createAsyncThunk("auth/logout", async () => {
  const data = await kaizenApiRequest<LoginResponse>("/api/auth/logout", {
    method: "POST",
    data: {},
  });
  return data;
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = "authenticated";
      })
      .addCase(restoreSession.rejected, (state) => {
        state.user = null;
        state.status = "guest";
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = "authenticated";
      })
      .addCase(login.rejected, (state) => {
        state.user = null;
        state.status = "guest";
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.status = "guest";
      })
      .addCase(logout.rejected, (state) => {
        state.user = null;
        state.status = "guest";
      });
  },
});

export default authSlice.reducer;
