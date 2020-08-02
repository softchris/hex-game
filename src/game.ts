import * as Honeycomb from "honeycomb-grid";
import * as PIXI from "pixi.js";
import { GameTile } from "./types";
import {
  getRandomType,
  log,
  isSelected,
  isGameCursor,
  isHexInList,
  getInfoTileFromHex,
  toolTip
} from "./utils";
import { GameColor } from "./colors";
import { setupEventHandlers } from "./events";

import { emitter } from './event-bus';
emitter.on('selected', handleBoardClick)
emitter.on('keyup', handleKeyPress)

let richText: PIXI.Text;
let gameTiles: Array<GameTile> = [];
const ROWS = 20;
const COLUMNS = 20;
const WIDTH = 1200;
const HEIGHT = 768;
let score = 0;
let basicText;
const app = new PIXI.Application({
  transparent: true,
  width: WIDTH,
  height: HEIGHT,
});
const graphics = new PIXI.Graphics();
const Hex = Honeycomb.extendHex({ size: 30 });
const Grid = Honeycomb.defineGrid(Hex);
const grid = Grid.rectangle({ width: COLUMNS, height: ROWS });
document.body.appendChild(app.view);

let gameCursor = { x: 0, y: 0 };
let selected: Array<Honeycomb.Hex<{ size: number }>> = [];
let infoTiles = [
  {
    x: 5,
    y: 5,
    sprite: PIXI.Sprite.from("assets/port0.gif"),
    text: "Some info",
  },
  {
    x: 7,
    y: 7,
    sprite: PIXI.Sprite.from("assets/port3.gif"),
    text: "Some OTHER info",
  },
];


let showInfoWindow = false;

export function getGameCursor() {
  return gameCursor;
}

function createGameTiles() {
  gameTiles = [];
  for (let i = 0; i < ROWS; i++) {
    for (let j = 0; j < COLUMNS; j++) {
      const tile = <GameTile>{};
      tile.x = i;
      tile.y = j;
      tile.type = getRandomType();
      tile.sprite = spriteFromType(tile.type);
      gameTiles.push(tile);
    }
  }
}

function drawInfoTiles() {
  infoTiles.forEach(tile => {
    const {x,y} = tile;
    const hex = grid.get({ x, y });
    if (hex) {
      const point = hex?.toPoint();
      tile.sprite.x = point.x;
      tile.sprite.y = point.y;
      app.stage.addChild(tile.sprite);
    }
  })
}

function drawTiles() {
  gameTiles.forEach((tile) => {
    tile.sprite = spriteFromType(tile.type);
    // get Hex from coord
    const hex = grid.get(tile);
    if (hex) {
      const point = hex.toPoint();
      tile.sprite.x = point.x;
      tile.sprite.y = point.y;
      app.stage.addChild(tile.sprite);
    }
  });
}

function drawGrid() {
  const cursor = getGameCursor();

  graphics.clear();
  
  infoTiles.forEach(t => {
    if (t.sprite) app.stage.removeChild(t.sprite);
  })

  gameTiles.forEach((t) => {
    if (t.sprite) app.stage.removeChild(t.sprite);
  });

  app.stage.removeChild(basicText);
  app.stage.removeChild(richText);

  if (showInfoWindow) {
    drawInfoScreen();
    return;
  }

  graphics.lineStyle(1, 0x999999);
  drawTiles();
  grid.forEach((hex) => {
    const point = hex.toPoint();
    // add the hex's position to each of its corner points
    const corners = hex.corners().map((corner) => corner.add(point));
    // separate the first from the other corners
    const [firstCorner, ...otherCorners] = corners;

    if (isSelected(hex, selected)) {
      graphics.beginFill(GameColor.green);
    } else if (isGameCursor(hex, cursor)) {
      graphics.beginFill(GameColor.purple);
    }

    graphics.moveTo(firstCorner.x, firstCorner.y);
    // draw lines to the other corners
    otherCorners.forEach(({ x, y }) => graphics.lineTo(x, y));
    // finish at the first corner
    graphics.lineTo(firstCorner.x, firstCorner.y);
    if (isSelected(hex, selected) || isGameCursor(hex, cursor)) {
      graphics.endFill();
    }

    app.stage.addChild(graphics);
  });
  drawInfoTiles();
  drawGameScore();
}

function spriteFromType(type: "Water" | "Desert" | "Wood" | "Clay") {
  switch (type) {
    case "Desert":
      return PIXI.Sprite.from("assets/clayHex.gif");
    case "Water":
      return PIXI.Sprite.from("assets/waterHex.gif");
    case "Wood":
      return PIXI.Sprite.from("assets/woodHex.gif");
    case "Clay":
      return PIXI.Sprite.from("assets/clayHex.gif");
    default:
      throw new Error("unknown type");
  }
}

function drawGameScore() {
  basicText = new PIXI.Text("Game score: " + score);
  basicText.x = 50;
  basicText.y = 450;

  app.stage.addChild(basicText);
}

function handleBoardClick(point) {
  const { x,y } = point
  const hex = Grid.pointToHex(x,y);
  if (!isSelected(hex, selected)) {
    selected.push(hex);
  } else {
    selected = selected.filter((s) => {
      return !(s.x === hex.x && s.y === hex.y);
    });
  }

  drawGrid();
}

function handleKeyPress(evt) {
  console.log(evt.key);

  // move selected
  if (evt.key === "ArrowUp") {
    gameCursor.y = gameCursor.y - 1 < 0 ? 0 : gameCursor.y - 1;
  } else if (evt.key === "ArrowDown") {
    gameCursor.y = gameCursor.y + 1 > ROWS - 1 ? ROWS - 1 : gameCursor.y + 1;
  } else if (evt.key === "ArrowLeft") {
    gameCursor.x = gameCursor.x - 1 < 0 ? 0 : gameCursor.x - 1;
  } else if (evt.key === "ArrowRight") {
    gameCursor.x =
      gameCursor.x + 1 > COLUMNS - 1 ? COLUMNS - 1 : gameCursor.x + 1;
  } else if (evt.key === "Enter") {
    console.info(gameCursor);
    if (isHexInList(gameCursor, infoTiles)) {
      showInfoWindow = true;
    }
  } else if (evt.key === "Escape") {
    showInfoWindow = false;
  }

  const gameTile = getInfoTileFromHex(gameCursor, gameTiles);
  const infoTile = getInfoTileFromHex(gameCursor, infoTiles);
  if (infoTile) {
    toolTip(`This is a special tile, try hit ENTER`);
  } else {
    toolTip(`Terrain tile of type ${gameTile.type}`);
  }

  if (isSelected(gameCursor, selected)) {
    selected = selected.filter((s) => {
      return !(s.x === gameCursor.x && s.y === gameCursor.y);
    });
    score++;
  }

  drawGrid();
}

export function start() {
  setupEventHandlers();

  log("Creating game tiles");
  createGameTiles();

  log("Drawing grid");
  drawGrid();
}

function drawInfoScreen() {
  graphics.beginFill(GameColor.black);
  graphics.drawRect(0, 0, WIDTH, HEIGHT);
  graphics.endFill();

  const style = new PIXI.TextStyle({
    fontFamily: "Arial",
    fontSize: 36,
    fontStyle: "italic",
    fontWeight: "bold",
    fill: ["#ffffff", "#00ff99"], // gradient
    stroke: "#4a1850",
    strokeThickness: 5,
    dropShadow: true,
    dropShadowColor: "#000000",
    dropShadowBlur: 4,
    dropShadowAngle: Math.PI / 6,
    dropShadowDistance: 6,
    wordWrap: true,
    wordWrapWidth: 440,
  });

  const info = getInfoTileFromHex(gameCursor, infoTiles);
  let text = '';
  if(info) {
    text = info.text;
  }

  richText = new PIXI.Text(
    text,
    style
  );
  richText.x = 50;
  richText.y = 250;

  app.stage.addChild(richText);
}

// TODO open up lightbox at specific coord, ignore movements and clicks at that point..
// black rect that take upp 100%
// image that is anchored at 0.5 0.5
// esc should "close" them both
 