import api from "./axios";

const refreshToken = async () => {
  try {
    const refresh = localStorage.getItem("refresh_token");
    const response = await api.post("/api/token/refresh/", { refresh });
    localStorage.setItem("access_token", response.data.access);
    return true;
  } catch (err) {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    return false;
  }
};

export default refreshToken;