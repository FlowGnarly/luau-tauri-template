import { Child, Command } from "@tauri-apps/api/shell";
import { listeners } from "./ipc";
import "./methods";
import { exit } from "@tauri-apps/api/process";
import { elements } from "./methods";

const appWindow = (window as any).__TAURI__.window;
let isDevMode = (import.meta as any).env.TAURI_DEBUG;
let luneHandle: Child;

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

const bridge = isDevMode
  ? new Command("run-lune-code", ["run", "dist/bundled.luau"], {
      cwd: "../../",
    })
  : Command.sidecar("bundled", []);

// console.log(debugMode);

bridge.stdout.on("data", (data: string) => {
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

bridge.stderr.on("data", (data) => {
  console.log("error:", data);
});

function kill() {
  return new Promise<undefined>(async (res) => {
    await fetch("http://localhost:3476/kill", {
      method: "POST",
    }).catch((err) => console.error(err));

    if (luneHandle) await luneHandle.kill();
    res(undefined);
  });
}

appWindow.getCurrent().listen("tauri://close-requested", async () => {
  kill();
  await exit(0);
  appWindow.getCurrent().close();
});

window.onbeforeunload = async () => {
  Object.values(elements).forEach((element) => {
    if (element !== document.body) element.remove();
  });

  let header = document.createElement("h1");
  header.innerHTML = "Don't cancel the reload prompt";
  document.body.appendChild(header);

  kill();
};

window.addEventListener("DOMContentLoaded", async () => {
  bridge.spawn().then((handle) => {
    luneHandle = handle;
    console.log("Lune started");
  });
});
