import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:3000/api/folders",
  withCredentials: true,
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("user");
      window.location.href = "/";
    }
    return Promise.reject(err);
  }
);

export const getFolders = async (parent = null) =>
  (await API.get(parent ? `/?parent=${parent}` : "/")).data;


export const createFolder = async (name, parent = null) =>
  (await API.post("/", { name, parent })).data;


export const renameFolder = async (id, name) =>
  (await API.put(`/rename/${id}`, { name })).data;

// Move folder to trash
export const deleteFolderToTrash = async (id) =>
  (await API.put(`/trash/${id}`)).data;

// Restore folder
export const restoreFolder = async (id) =>
  (await API.put(`/restore/${id}`)).data;

// Permanently delete folder
export const deleteFolderPermanently = async (id) =>
  (await API.delete(`/delete/${id}`)).data;

// Get trash folders
export const getTrashFolders = async () =>
  (await API.get("/trash")).data;