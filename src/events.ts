import { emitter } from './event-bus';

var onKeyDown = function (e) {
  switch (e.keyCode) {
    case 37:
    case 39:
    case 38:
    case 40: // Arrow keys
    case 32:
      e.preventDefault();
      break; // Space
    default:
      break; // do not block other keys
  }
};

export function setupEventHandlers() {
 window.addEventListener("keydown", onKeyDown, false);
 window.addEventListener("click", (evt) => {
  emitter.emit("selected", { x: evt.clientX, y: evt.clientY });
 });
 window.addEventListener("keyup", (evt) => {
  emitter.emit("keyup", evt);
 });
}





