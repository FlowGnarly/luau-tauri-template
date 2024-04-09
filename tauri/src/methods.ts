import * as ipc from "./ipc";

let elements: {
  [id: number]: Element;
} = {};

let events: {
  [id: number]: {
    [event: string]: number[];
  };
};

export function getElementId(element: Element | null) {
  for (const [i, v] of Object.entries(elements)) {
    if (element === v) {
      return Number(i);
    }
  }
}

export function getElementById(id: number) {
  for (const [i, v] of Object.entries(elements)) {
    if (id === Number(i)) {
      return v;
    }
  }
}

ipc.on("ready", () => {
  console.log("Lune loaded");
});

ipc.on(
  "invoke:querySelector",
  (_, info: { eventId: number; selector: string }) => {
    let reservedId = Object.keys(elements).length + 1;

    let element = document.querySelector(info.selector);
    let id: number | undefined = getElementId(element);

    if (!id && element) {
      elements[reservedId - 1] = element;
      id = reservedId;
    }

    ipc.sendToLune("invoke:" + info.eventId, {
      id,
      selector: info.selector,
    });
  }
);

ipc.on(
  "invoke:createElement",
  (_, info: { eventId: number; tagName: string; innerHTML?: string }) => {
    let reservedId = Object.keys(elements).length + 1;

    let element = document.createElement(info.tagName);
    let id: number;

    if (info.innerHTML) element.innerHTML = info.innerHTML;

    elements[reservedId - 1] = element;
    id = reservedId;

    ipc.sendToLune("invoke:" + info.eventId, {
      id,
      tagName: info.tagName,
    });
  }
);

ipc.on("setProperty", (_, info: { id: number; k: string; v: any }) => {
  let element = elements[info.id - 1];

  if (info.k === "parent") {
    if (info.v === "null") {
      (element as HTMLElement).parentElement?.removeChild(element);
    } else {
      let parent = elements[Number(info.v) - 1];
      parent.appendChild(element);
    }
  } else if (element) {
    (element as any)[info.k] = info.v;
  }
});

ipc.on(
  "setNestedProperties",
  (_, info: { id: number; k: string; v: { [key: string]: any } }) => {
    let element = elements[info.id - 1];

    function apply(el: any, k: any, v: any) {
      if (typeof v === "object") {
        Object.keys(v).forEach((k) => {
          apply(el[k], k, v[k]);
        });
      } else {
        el[k] = v;
      }
    }

    Object.keys(info.v).forEach((k) => {
      apply((element as any)[info.k], k, info.v[k]);
    });
  }
);

ipc.on(
  "setEvent",
  (_, info: { id: number; event: string; eventId: number }) => {
    let element = elements[info.id - 1];

    if (!events[info.id]) {
      events[info.id] = {};
    }

    if (!events[info.id][info.event]) {
      events[info.id][info.event] = [];
    }

    events[info.id][info.event].push(info.eventId);

    (element as any)[info.event] = function () {
      events[info.id][info.event].forEach((eventId) => {
        ipc.sendToLune("event:" + eventId, {});
      });
    };
  }
);

ipc.on(
  "disconnectEvent",
  (_, info: { id: number; event: string; eventId: number }) => {
    if (!events[info.id]) return;
    if (!events[info.id][info.event]) return;

    events[info.id][info.event] = events[info.id][info.event].filter(
      (eventId) => {
        return eventId == info.eventId ? null : eventId;
      }
    );
  }
);

window.addEventListener("DOMContentLoaded", () => {
  events = [];
  elements = [];
});
