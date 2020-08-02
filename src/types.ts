export interface GameTile {
  x: number;
  y: number;
  sprite?: PIXI.Sprite;
  type: "Water" | "Desert" | "Wood" | "Clay";
}
