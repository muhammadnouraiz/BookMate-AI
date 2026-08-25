import axiosClient from './axiosClient';

export const createAppointment = (data) =>
  axiosClient.post('/appointments', data).then((res) => res.data);

export const listAppointments = () =>
  axiosClient.get('/appointments').then((res) => res.data);

export const cancelAppointment = (id) =>
  axiosClient.patch(`/appointments/${id}/cancel`).then((res) => res.data);