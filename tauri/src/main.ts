import { listeners } from "./ipc";
import { listen } from "@tauri-apps/api/event";
import { fetch } from "@tauri-apps/api/http";
import { invoke } from "@tauri-apps/api";
import "./methods";

export const getLuauServerPort = async (): Promise<number> => {
  return await invoke<number>("get_luau_server_port");
};

const appWindow = (window as any).__TAURI__.window;
const devMode = (import.meta as any).env.TAURI_DEBUG;

interface LuneMethodData {
  type: "Method";
  method: string;
  headers: {
    [key: string]: any;
  };
}

interface LuneInvokeData {
  type: "Invoke";
  method: string;
  headers: {
    eventId: number;
    [key: string]: any;
  };
}

type LuneData = LuneMethodData | LuneInvokeData;

listen("message", (e) => {
  let data = e.payload as string;

  if (data.trim() === "") return;

  if (data.startsWith("@")) {
    // json object
    const parsed: LuneData = JSON.parse(data.slice(1));

    if (parsed.type === "Method") {
      if (parsed.method === "ready") {
        // only used in lune-electron
      } else if (parsed.method === "kill") {
        // only used in lune-electron
      }

      let channelListeners = listeners[parsed.method];
      if (channelListeners)
        channelListeners.forEach((callback) => callback(null, parsed.headers));
    } else if (parsed.type === "Invoke") {
      let channelListeners = listeners["invoke:" + parsed.method];
      if (channelListeners)
        channelListeners.forEach((callback) => callback(null, parsed.headers));
    }
  } else {
    // print to console
    console.log(data);
  }
});

async function kill() {
  return fetch(`http://localhost:${await getLuauServerPort()}/kill`, {
    method: "POST",
  }).catch((err) => console.error(err));
}

async function load() {
  if (devMode) await kill();
  await invoke("run_lune");

  fetch(`http://localhost:${await getLuauServerPort()}/load`, {
    method: "POST",
  }).catch((err) => console.error(err));
}

setInterval(async () => {
  fetch(`http://localhost:${await getLuauServerPort()}/keep_alive`, {
    method: "POST",
  }).catch((err) => console.error(err));
}, 10000);

appWindow.getCurrent().listen("tauri://close-requested", async () => {
  kill();
  appWindow.getCurrent().close();
});

load();
