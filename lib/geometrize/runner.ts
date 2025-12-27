import { Bitmap, Rgba } from "./bitmap";
import { Shape, Rectangle, Ellipse, Triangle, RotatedRectangle, RotatedEllipse } from "./shapes";
import { randomRange } from "./utils";

export interface ShapeResult {
    score: number;
    color: Rgba;
    shape: Shape;
}

export class Runner {
    target: Bitmap;
    current: Bitmap;
    width: number;
    height: number;

    constructor(target: Bitmap) {
        this.target = target;
        this.width = target.width;
        this.height = target.height;
        this.current = new Bitmap(this.width, this.height);
        // Fill current with average color of target
        const avg = this.computeAverageColor();
        this.current.fill(avg);
    }

    getAverageColor(): Rgba {
        return this.computeAverageColor();
    }

    computeAverageColor(): Rgba {
        let r = 0, g = 0, b = 0;
        const count = this.width * this.height;
        for (let i = 0; i < this.target.data.length; i += 4) {
            r += this.target.data[i];
            g += this.target.data[i + 1];
            b += this.target.data[i + 2];
        }
        return {
            r: Math.round(r / count),
            g: Math.round(g / count),
            b: Math.round(b / count),
            a: 255
        };
    }

    step(options: { shapeTypes: string[], alpha: number, mutations: number }): ShapeResult[] {
        // 1. Create random shape
        const type = options.shapeTypes[randomRange(0, options.shapeTypes.length - 1)];
        let shape = this.createRandomShape(type);
        
        // 2. Optimization Loop (Hill Climbing)
        let bestShape = shape;
        let bestScore = Infinity; // Lower is better (energy delta)
        let bestColor: Rgba = {r:0, g:0, b:0, a:0};

        // Initial state
        let currentState = this.computeState(shape, options.alpha);
        bestScore = currentState.score;
        bestColor = currentState.color;

        for (let i = 0; i < options.mutations; i++) {
            const mutatedShape = bestShape.clone();
            mutatedShape.mutate(this.width, this.height);
            
            const state = this.computeState(mutatedShape, options.alpha);
            if (state.score < bestScore) {
                bestScore = state.score;
                bestShape = mutatedShape;
                bestColor = state.color;
            }
        }

        // 3. Apply best shape to current if it improves (score < 0 means error decreased)
        if (bestScore < 0) {
             this.drawShape(this.current, bestShape, bestColor);
             return [{
                 score: bestScore,
                 color: bestColor,
                 shape: bestShape
             }];
        }

        return [];
    }

    // Computes the energy delta (NewError - OldError)
    private computeState(shape: Shape, alpha: number): { score: number, color: Rgba } {
        const scanlines = shape.rasterize(this.width, this.height);
        if (scanlines.length === 0) return { score: Infinity, color: {r:0, g:0, b:0, a:0} };

        // 1. Compute average color of target under shape
        let r = 0, g = 0, b = 0, count = 0;
        
        for (const line of scanlines) {
            const idxStart = (line.y * this.width + line.x1) * 4;
            let idx = idxStart;
            for (let x = line.x1; x <= line.x2; x++) {
                r += this.target.data[idx];
                g += this.target.data[idx+1];
                b += this.target.data[idx+2];
                count++;
                idx += 4;
            }
        }

        if (count === 0) return { score: Infinity, color: {r:0, g:0, b:0, a:0} };

        const color: Rgba = {
            r: Math.round(r / count),
            g: Math.round(g / count),
            b: Math.round(b / count),
            a: alpha
        };

        // 2. Compute difference
        let energyDelta = 0;
        
        for (const line of scanlines) {
            const idxStart = (line.y * this.width + line.x1) * 4;
            let idx = idxStart;
            
            for (let x = line.x1; x <= line.x2; x++) {
                const tr = this.target.data[idx];
                const tg = this.target.data[idx+1];
                const tb = this.target.data[idx+2];
                
                const cr = this.current.data[idx];
                const cg = this.current.data[idx+1];
                const cb = this.current.data[idx+2];
                
                // Old error
                const drOld = tr - cr;
                const dgOld = tg - cg;
                const dbOld = tb - cb;
                const errorOld = drOld*drOld + dgOld*dgOld + dbOld*dbOld;
                
                // New pixel color (blend)
                const aNorm = alpha / 255;
                const invA = 1 - aNorm;
                
                const newR = color.r * aNorm + cr * invA;
                const newG = color.g * aNorm + cg * invA;
                const newB = color.b * aNorm + cb * invA;
                
                // New error
                const drNew = tr - newR;
                const dgNew = tg - newG;
                const dbNew = tb - newB;
                const errorNew = drNew*drNew + dgNew*dgNew + dbNew*dbNew;
                
                energyDelta += (errorNew - errorOld);
                idx += 4;
            }
        }
        
        return { score: energyDelta, color };
    }

    private drawShape(bmp: Bitmap, shape: Shape, color: Rgba) {
        const scanlines = shape.rasterize(this.width, this.height);
        const aNorm = color.a / 255;
        const invA = 1 - aNorm;

        for (const line of scanlines) {
            const idxStart = (line.y * this.width + line.x1) * 4;
            let idx = idxStart;
            for (let x = line.x1; x <= line.x2; x++) {
                bmp.data[idx] = color.r * aNorm + bmp.data[idx] * invA;
                bmp.data[idx+1] = color.g * aNorm + bmp.data[idx+1] * invA;
                bmp.data[idx+2] = color.b * aNorm + bmp.data[idx+2] * invA;
                bmp.data[idx+3] = 255;
                idx += 4;
            }
        }
    }

    private createRandomShape(type: string): Shape {
        const w = this.width;
        const h = this.height;
        switch (type) {
            case "Rectangle":
                return new Rectangle(randomRange(0, w), randomRange(0, h), randomRange(0, w), randomRange(0, h));
            case "RotatedRectangle":
                return new RotatedRectangle(randomRange(0, w), randomRange(0, h), randomRange(1, 32), randomRange(1, 32), randomRange(0, 360));
            case "Ellipse":
                return new Ellipse(randomRange(0, w), randomRange(0, h), randomRange(1, 32), randomRange(1, 32));
            case "RotatedEllipse":
                return new RotatedEllipse(randomRange(0, w), randomRange(0, h), randomRange(1, 32), randomRange(1, 32), randomRange(0, 360));
            case "Triangle":
                return new Triangle(
                    randomRange(0, w), randomRange(0, h),
                    randomRange(0, w), randomRange(0, h),
                    randomRange(0, w), randomRange(0, h)
                );
            default:
                return new Rectangle(0,0,10,10);
        }
    }
}
