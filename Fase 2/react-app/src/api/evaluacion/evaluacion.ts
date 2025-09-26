import axios from "@/services/google/axiosInstance";

export async function fetchSubordinados() {
  const res = await axios.get("/evaluacion/api/subordinados/");

  return res.data;
}
