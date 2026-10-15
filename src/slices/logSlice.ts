//contain log endpoints 
import { createAsyncThunk } from "@reduxjs/toolkit";
import { kaizenApiRequest } from "../utils/kaizenApi";

type Weight = {
    id: string;
    weight: number;
    date: string;
}

type Workout = {
    id: string;
    name: string;
    date: string;
    notes: string;
}

export const getWeights = createAsyncThunk("log/getWeights", async () => {
    const response = await kaizenApiRequest<{ weights: Weight[] }>("/api/weights");
    return response.weights;   
});

export const getWorkouts = createAsyncThunk("log/getWorkouts", async () => {
    const response = await kaizenApiRequest<{ workouts: Workout[] }>("/api/workouts");
    return response.workouts;
});

export const addWeight = createAsyncThunk(
    "log/addWeight",
    async ({ weight, date }: { weight: number; date: string }) => {
        const response = await kaizenApiRequest<{ weight: Weight }>("/api/weights", {
            method: "POST",
            data: { weight, date },
        });
        return response.weight;
    },
);

export const addWorkout = createAsyncThunk("log/addWorkout", async (workout: Workout) => {
    const response = await kaizenApiRequest<{ workout: Workout }>("/api/workouts", { method: "POST", data: workout });
    return response.workout;
});
