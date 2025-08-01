import { io } from 'socket.io-client';
import { SIGNALING_SERVER_URL } from './config';

export const socket = io(SIGNALING_SERVER_URL, {
  secure: true,
  rejectUnauthorized: false,
  autoConnect: true
});
