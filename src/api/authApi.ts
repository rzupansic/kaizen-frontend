import { kaizenApiRequest } from "../utils/kaizenApi";
import type { AuthUser } from "../slices/authSlice.ts";

export const login = async (email: string, password: string) => {
  try {
    const response = await kaizenApiRequest("/auth/login", {
      method: "POST",
      data: { email, password },
    });
    return response;
  } catch (error) {
    console.error("Login failed:", error);
    throw error;
  }
};

export const me = async (): Promise<AuthUser> => {
  const response = await kaizenApiRequest("/auth/me");
  return response.user ?? response;
};

export const logout = async (): Promise<void> => {
  try {
    await kaizenApiRequest("/auth/logout", {
      method: "POST",
    });
  } catch (error) {
    console.error("Logout failed:", error);
    throw error;
  }
};