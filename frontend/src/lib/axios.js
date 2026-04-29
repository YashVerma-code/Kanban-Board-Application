import axios from "axios";

const backendUrl = import.meta.env.VITE_BACKEND_API_URL ||"http://localhost:8080";
// console.log("Base api URL:", backendUrl);

export const axiosInstance = axios.create({
    baseURL: backendUrl,
    withCredentials: true,
});

