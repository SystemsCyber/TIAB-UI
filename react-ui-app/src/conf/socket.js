// socket.js
import { io } from "socket.io-client";
import config from "./constants";
const socket = io(`${config.API_BASE_URL}`, {
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  transports: ["websocket"],
});

export default socket;
