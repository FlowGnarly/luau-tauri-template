// Calculate a string representation of a node's DOM path.
const pathToSelector = function (node: HTMLElement) {
  if (!node || !node.outerHTML) {
    return null;
  }

  var path;
  while (node.parentElement) {
    var name = node.localName;
    if (!name) break;
    name = name.toLowerCase();
    var parent = node.parentElement;

    var domSiblings = [];

    if (parent.children && parent.children.length > 0) {
      for (var i = 0; i < parent.children.length; i++) {
        var sibling = parent.children[i];
        if (sibling.localName && sibling.localName.toLowerCase) {
          if (sibling.localName.toLowerCase() === name) {
            domSiblings.push(sibling);
          }
        }
      }
    }

    if (domSiblings.length > 1) {
      name += ":eq(" + domSiblings.indexOf(node) + ")";
    }
    path = name + (path ? ">" + path : "");
    node = parent;
  }

  return path;
};

export const serializeEvent = function (e: any) {
  if (e) {
    var o = {
      eventName: e.toString(),
      altKey: e.altKey,
      bubbles: e.bubbles,
      button: e.button,
      buttons: e.buttons,
      cancelBubble: e.cancelBubble,
      cancelable: e.cancelable,
      clientX: e.clientX,
      clientY: e.clientY,
      composed: e.composed,
      ctrlKey: e.ctrlKey,
      currentTarget: e.currentTarget ? e.currentTarget.outerHTML : null,
      defaultPrevented: e.defaultPrevented,
      detail: e.detail,
      eventPhase: e.eventPhase,
      fromElement: e.fromElement ? e.fromElement.outerHTML : null,
      isTrusted: e.isTrusted,
      layerX: e.layerX,
      layerY: e.layerY,
      metaKey: e.metaKey,
      movementX: e.movementX,
      movementY: e.movementY,
      offsetX: e.offsetX,
      offsetY: e.offsetY,
      pageX: e.pageX,
      pageY: e.pageY,
      path: pathToSelector(e.path && e.path.length ? e.path[0] : null),
      relatedTarget: e.relatedTarget ? e.relatedTarget.outerHTML : null,
      returnValue: e.returnValue,
      screenX: e.screenX,
      screenY: e.screenY,
      shiftKey: e.shiftKey,
      sourceCapabilities: e.sourceCapabilities
        ? e.sourceCapabilities.toString()
        : null,
      target: e.target ? e.target.outerHTML : null,
      timeStamp: e.timeStamp,
      toElement: e.toElement ? e.toElement.outerHTML : null,
      type: e.type,
      view: e.view ? e.view.toString() : null,
      which: e.which,
      x: e.x,
      y: e.y,
    };

    return JSON.stringify(o);
  }
};
