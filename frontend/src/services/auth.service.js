import axios from "axios";

const API = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/auth`,
  withCredentials: true,
});

export const registerUser = async (userData) => (await API.post("/register", userData)).data;
export const loginUser = async (userData) => (await API.post("/login", userData)).data;

export const logoutUser = async () => (await API.post("/logout")).data;

export const getMe = async () => (await API.get("/me")).data;

export const forgotPassword = async (payload) => (await API.post("/forgot-password", payload)).data;

export const resetPassword = async ({ token, password }) => (await API.post(`/reset-password/${token}`, { password })).data;
