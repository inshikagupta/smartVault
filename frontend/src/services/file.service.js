import axios from "axios";

const API = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/files`,
  withCredentials: true,
});

API.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem("user");
      window.location.href = "/";
    }
    return Promise.reject(err);
  }
);

export const getAllFiles = async () => (await API.get("/")).data;
export const getStarredFiles = async () => (await API.get("/starred")).data;
export const getTrashFiles = async () => (await API.get("/trash")).data;
export const getSharedFiles = async () => (await API.get("/shared")).data;
export const uploadFile = async (formData) => (await API.post("/upload", formData, { headers: { "Content-Type": "multipart/form-data" } })).data;
export const moveToTrash = async (id) => (await API.put(`/trash/${id}`)).data;
export const restoreFile = async (id) => (await API.put(`/restore/${id}`)).data;
export const renameFile = async (id, fileName) => (await API.put(`/rename/${id}`, { fileName })).data;
export const toggleStar = async (id) => (await API.put(`/star/${id}`)).data;
export const deleteFilePermanently = async (id) => (await API.delete(`/delete/${id}`)).data;
export const shareFile = async (id, email) => (await API.post(`/share/${id}`, { email })).data;
export const searchFiles = async (query) => (await API.get(`/search?query=${encodeURIComponent(query)}`)).data;
export const getStorageStats = async () => (await API.get("/storage-stats")).data;
export const downloadFile = async (id) => (await API.get(`/download/${id}`)).data;
export const generateShareLink = async (id, expiresInHours) => (await API.post(`/share-link/${id}`, { expiresInHours })).data;
