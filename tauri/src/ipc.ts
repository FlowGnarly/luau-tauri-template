import { fetch } from "@tauri-apps/api/http";
import { getLuauServerPort } from "./main";

export let listeners: {
  [channel: string]: ((_: null, info: any) => void)[];
} = {};

export function on(channel: string, callback: (_: null, info: any) => void) {
  if (!listeners[channel]) listeners[channel] = [];
  listeners[channel].push(callback);
}

export async function sendToLune(channel: string, info: any) {
  fetch(`http://localhost:${await getLuauServerPort()}/channel`, {
    method: "POST",
    headers: {
      channel,
      value: JSON.stringify(info),
    },
  }).catch((err) => console.error(err));
}
