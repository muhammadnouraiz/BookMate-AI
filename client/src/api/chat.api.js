import axiosClient from './axiosClient';

export const sendMessage = (payload) =>
  axiosClient.post('/chat/message', payload).then((res) => res.data);

export const getMessages = (sessionId) =>
  axiosClient.get(`/chat/${sessionId}/messages`).then((res) => res.data);