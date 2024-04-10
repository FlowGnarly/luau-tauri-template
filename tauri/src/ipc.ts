import { fetch } from "@tauri-apps/api/http";
import { luauServerPort } from "./main";

export let listeners: {
  [channel: string]: ((_: null, info: any) => void)[];
} = {};

export function on(channel: string, callback: (_: null, info: any) => void) {
  if (!listeners[channel]) listeners[channel] = [];
  listeners[channel].push(callback);
}

export function sendToLune(channel: string, info: any) {
  fetch(`http://localhost:${luauServerPort}/channel`, {
    method: "POST",
    headers: {
      channel,
      value: JSON.stringify(info),
    },
  }).catch((err) => console.error(err));
}
