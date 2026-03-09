import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;


export function createAxiosInstance(token: string | null) {
  return axios.create({
    baseURL: API_URL,
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
  });
}