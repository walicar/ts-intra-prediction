import './index.css';
import { HEIGHT, makePred, WIDTH } from './utils';

const root = document.querySelector('#root');

// from bot to right, 16x16 pred block, which means we have 32 + 32 + 1 pixels along the line
const line = [
  255, 0, 0, 8, 127, 0, 0, 8, 64, 0, 0, 8, 32, 0, 0, 8, 0, 0, 0, 1, 0, 0, 32, 8,
  0, 0, 64, 8, 0, 0, 128, 8, 0, 0, 255, 8,
];
// const line = [
//   20, 0, 0, 8,
//   55, 0, 0, 8,
//   110, 0, 0, 8,
//   220, 0, 0, 8,
//   255, 0, 0, 1,
//   220, 0, 0, 8,
//   110, 0, 0, 8,
//   55, 0, 0, 8,
//   20, 0, 0, 8,
// ];

// initialize canvas
const canvas = document.createElement('canvas');
canvas.width = WIDTH;
canvas.height = HEIGHT;
canvas.style.width = '512px';
canvas.style.height = '512px';
const imgCtx = canvas.getContext('bitmaprenderer');
if (!imgCtx) throw new Error('Unable to get bitmaprenderer context');

await makePred({
  imgCtx,
  line,
  mode: 1,
});

root?.append(canvas);
