export const BLOCK_SIZE = 16;
export const WIDTH = 1 + BLOCK_SIZE * 2;
export const HEIGHT = 1 + BLOCK_SIZE * 2;

export interface PredictionContext {
    imgCtx: ImageBitmapRenderingContext,
    line: number[], // surrounding line
    mode: number,
}

export const makePred = async (preCtx: PredictionContext): Promise<PredictionContext> => {
    const { imgCtx, line, mode } = preCtx;

    const data = new Uint8ClampedArray(WIDTH * HEIGHT * 4);
    data.fill(255);
    const samples: number[][] = parseLine(line);
    const mid = Math.floor(samples.length / 2);

    // along left side
    for (let i = 0; i < BLOCK_SIZE * 2; i++) {
        const offset = ((HEIGHT - i - 1) * WIDTH) * 4;
        data.set(samples[i], offset);
    }

    // top left corner
    data.set(samples[mid]);

    // along top side
    for (let i = 0; i < BLOCK_SIZE * 2; i++) {
        const offset = (i + 1) * 4;
        data.set(samples[mid + i + 1], offset);
    }

    // create prediction block
    if (mode == 0) {
        const avgColor = averageColor(samples);
        for (let i = 0; i < BLOCK_SIZE * BLOCK_SIZE; i++) {
            const offset = i + (WIDTH + 1);

            const start = BLOCK_SIZE + WIDTH;
            const n = Math.ceil((offset - start) / BLOCK_SIZE)
            const padding = n * (BLOCK_SIZE + 1);
            let color = avgColor;

            const y = Math.floor(i / BLOCK_SIZE);
            const x = i % BLOCK_SIZE;

            // boundary filtering
            if (x === 0 && y === 0) {
                const ct = BLOCK_SIZE - 1;
                const left = ct + BLOCK_SIZE;
                const top = (3 * BLOCK_SIZE) - ct;
                const leftColor = samples[left];
                const topColor = samples[top];

                color = color.map((v,i) => 2*v + leftColor[i] + topColor[i]);
                color = color.map(v => v >> 2); // div by 4
            } else if (y === 0) { // along the topmost row
                const top = x + (2 * BLOCK_SIZE);
                const topColor = samples[top];

                color = color.map((v,i) => 3*v + topColor[i]);
                color = color.map(v => v >> 2); // div by 4
            } else if (x === 0) { // along the leftmost column
                const left = (2 * BLOCK_SIZE) - y;
                const leftColor = samples[left];

                color = color.map((v,i) => 3*v + leftColor[i]);
                color = color.map(v => v >> 2); // div by 4
            }
            data.set(color, (offset + padding) * 4);
        }
    } else {
        throw new Error("mode not implemented!")
    }

    const imageData = new ImageData(data, WIDTH, HEIGHT);
    const imageBitmap = await createImageBitmap(imageData);
    imgCtx.transferFromImageBitmap(imageBitmap);
    return preCtx;
};

// sayood pg 684
// predict from only left and top blocks
export const averageColor = (samples: number[][]) => {
    const sumColor = [0, 0, 0, 0];
    for (let i = 0; i < BLOCK_SIZE; i++) {
        const left = i + BLOCK_SIZE;
        const top = (3 * BLOCK_SIZE) - i;
        const leftColor = samples[left];
        const topColor = samples[top];

        const mixColor = leftColor.map((v, i) => v + topColor[i]);

        sumColor[0] += mixColor[0];
        sumColor[1] += mixColor[1];
        sumColor[2] += mixColor[2];
        sumColor[3] += mixColor[3];
    }

    // equivalent to 1/(2*BLOCK_SIZE)
    return sumColor.map((v) => (v >> (1 + Math.log2(BLOCK_SIZE))))
}

export const parseLine = (line: number[]) => {
    const lineColors: number[][] = [];
    for (let i = 0; i < line.length; i += 4) {
        const r = line[i];
        const g = line[i + 1];
        const b = line[i + 2];
        const count = line[i + 3];
        for (let j = 0; j < count; j++) {
            lineColors.push([r, g, b, 255]);
        }
    }
    return lineColors;
};
