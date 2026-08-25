import axiosClient from './axiosClient';

export const signup = (data) => axiosClient.post('/auth/signup', data).then((res) => res.data);

export const login = (data) => axiosClient.post('/auth/login', data).then((res) => res.data);