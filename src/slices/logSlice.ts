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

type Exercise = {
    id: string;
    name: string;
    muscleGroup: string;
    description: string;
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

export const createExercise = createAsyncThunk("log/createExercise", async ({ name, muscleGroup, description }: { name: string; muscleGroup: string; description: string }) => {
    const response = await kaizenApiRequest<{ exercise: Exercise }>("/api/exercises", { method: "POST", data: { name, muscleGroup, description } });
    return response.exercise;
});

export const getExercises = createAsyncThunk("log/getExercises", async () => {
    const response = await kaizenApiRequest<{ exercises: Exercise[] }>("/api/exercises");
    return response.exercises;
});