import { randomRange, clamp } from "./utils";

export interface Scanline {
    y: number;
    x1: number;
    x2: number;
}

export abstract class Shape {
    abstract rasterize(w: number, h: number): Scanline[];
    abstract mutate(w: number, h: number): void;
    abstract clone(): Shape;
    abstract getType(): string;
    abstract getRawShapeData(): number[];
}

export class Rectangle extends Shape {
    x1: number; y1: number; x2: number; y2: number;

    constructor(x1: number, y1: number, x2: number, y2: number) {
        super();
        this.x1 = x1; this.y1 = y1; this.x2 = x2; this.y2 = y2;
    }

    rasterize(w: number, h: number): Scanline[] {
        const lines: Scanline[] = [];
        const sx = Math.min(this.x1, this.x2);
        const sy = Math.min(this.y1, this.y2);
        const ex = Math.max(this.x1, this.x2);
        const ey = Math.max(this.y1, this.y2);
        const xStart = clamp(sx, 0, w - 1);
        const xEnd = clamp(ex, 0, w - 1);
        const yStart = clamp(sy, 0, h - 1);
        const yEnd = clamp(ey, 0, h - 1);
        if (xStart > xEnd || yStart > yEnd) return [];
        for (let y = yStart; y <= yEnd; y++) lines.push({ y, x1: xStart, x2: xEnd });
        return lines;
    }

    mutate(w: number, h: number): void {
        const r = randomRange(0, 1);
        const amount = 16;
        if (r === 0) {
             this.x1 = clamp(this.x1 + randomRange(-amount, amount), 0, w - 1);
             this.y1 = clamp(this.y1 + randomRange(-amount, amount), 0, h - 1);
        } else {
             this.x2 = clamp(this.x2 + randomRange(-amount, amount), 0, w - 1);
             this.y2 = clamp(this.y2 + randomRange(-amount, amount), 0, h - 1);
        }
    }

    clone(): Rectangle { return new Rectangle(this.x1, this.y1, this.x2, this.y2); }
    getType(): string { return "Rectangle"; }
    getRawShapeData(): number[] { return [this.x1, this.y1, this.x2, this.y2]; }
}

export class RotatedRectangle extends Shape {
    x: number; y: number; w: number; h: number; angle: number;

    constructor(x: number, y: number, w: number, h: number, angle: number) {
        super();
        this.x = x; this.y = y; this.w = w; this.h = h; this.angle = angle;
    }

    rasterize(w: number, h: number): Scanline[] {
        const points = this.getPoints();
        return scanlinePolygon(points, w, h);
    }

    getPoints(): {x: number, y: number}[] {
        const rad = this.angle * (Math.PI / 180);
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        const w2 = this.w / 2;
        const h2 = this.h / 2;
        
        // 4 corners relative to center, then rotated and translated
        const pts = [
            {x: -w2, y: -h2}, {x: w2, y: -h2}, {x: w2, y: h2}, {x: -w2, y: h2}
        ];
        
        return pts.map(p => ({
            x: Math.round(this.x + p.x * cos - p.y * sin),
            y: Math.round(this.y + p.x * sin + p.y * cos)
        }));
    }

    mutate(w: number, h: number): void {
        const r = randomRange(0, 2);
        const amount = 16;
        if (r === 0) {
            this.x = clamp(this.x + randomRange(-amount, amount), 0, w - 1);
            this.y = clamp(this.y + randomRange(-amount, amount), 0, h - 1);
        } else if (r === 1) {
            this.w = clamp(this.w + randomRange(-amount, amount), 1, w);
            this.h = clamp(this.h + randomRange(-amount, amount), 1, h);
        } else {
            this.angle = (this.angle + randomRange(-4, 4)) % 360;
        }
    }

    clone(): RotatedRectangle { return new RotatedRectangle(this.x, this.y, this.w, this.h, this.angle); }
    getType(): string { return "RotatedRectangle"; }
    getRawShapeData(): number[] { return [this.x, this.y, this.w, this.h, this.angle]; }
}

export class Ellipse extends Shape {
    x: number; y: number; rx: number; ry: number;

    constructor(x: number, y: number, rx: number, ry: number) {
        super();
        this.x = x; this.y = y; this.rx = rx; this.ry = ry;
    }

    rasterize(w: number, h: number): Scanline[] {
        const lines: Scanline[] = [];
        const yStart = clamp(this.y - this.ry, 0, h - 1);
        const yEnd = clamp(this.y + this.ry, 0, h - 1);
        const ry2 = this.ry * this.ry;
        const rx2 = this.rx * this.rx;

        for (let y = yStart; y <= yEnd; y++) {
            const dy = y - this.y;
            const dy2 = dy * dy;
            if (dy2 >= ry2) continue;
            const wHalf = Math.sqrt((1 - dy2 / ry2) * rx2);
            const x1 = clamp(Math.floor(this.x - wHalf), 0, w - 1);
            const x2 = clamp(Math.floor(this.x + wHalf), 0, w - 1);
            if (x1 <= x2) lines.push({ y, x1, x2 });
        }
        return lines;
    }

    mutate(w: number, h: number): void {
        const r = randomRange(0, 2);
        const amount = 16;
        switch (r) {
            case 0: this.x = clamp(this.x + randomRange(-amount, amount), 0, w - 1); this.y = clamp(this.y + randomRange(-amount, amount), 0, h - 1); break;
            case 1: this.rx = clamp(this.rx + randomRange(-amount, amount), 1, w - 1); break;
            case 2: this.ry = clamp(this.ry + randomRange(-amount, amount), 1, h - 1); break;
        }
    }

    clone(): Ellipse { return new Ellipse(this.x, this.y, this.rx, this.ry); }
    getType(): string { return "Ellipse"; }
    getRawShapeData(): number[] { return [this.x, this.y, this.rx, this.ry]; }
}

export class RotatedEllipse extends Shape {
    x: number; y: number; rx: number; ry: number; angle: number;

    constructor(x: number, y: number, rx: number, ry: number, angle: number) {
        super();
        this.x = x; this.y = y; this.rx = rx; this.ry = ry; this.angle = angle;
    }

    rasterize(w: number, h: number): Scanline[] {
        // Bounding box approximation for optimization
        const rad = this.angle * (Math.PI / 180);
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        
        // Calculate bounding box
        const ux = this.rx * cos; const uy = this.rx * sin;
        const vx = this.ry * -sin; const vy = this.ry * cos;
        const hw = Math.sqrt(ux*ux + vx*vx);
        const hh = Math.sqrt(uy*uy + vy*vy);
        
        const xMin = clamp(Math.floor(this.x - hw), 0, w - 1);
        const xMax = clamp(Math.ceil(this.x + hw), 0, w - 1);
        const yMin = clamp(Math.floor(this.y - hh), 0, h - 1);
        const yMax = clamp(Math.ceil(this.y + hh), 0, h - 1);
        
        const lines: Scanline[] = [];
        const rx2 = this.rx * this.rx;
        const ry2 = this.ry * this.ry;

        for (let y = yMin; y <= yMax; y++) {
            // Find scanline range for this y
            // (x-cx)^2/rx^2 + (y-cy)^2/ry^2 <= 1 (rotated)
            // This is computationally expensive to solve analytically for every line.
            // A simple scan across the bounding box width is acceptable if shapes aren't massive.
            
            let minX = -1, maxX = -1;
            for (let x = xMin; x <= xMax; x++) {
                const dx = x - this.x;
                const dy = y - this.y;
                const tdx = dx * cos + dy * sin;
                const tdy = -dx * sin + dy * cos;
                
                if ((tdx*tdx)/rx2 + (tdy*tdy)/ry2 <= 1) {
                    if (minX === -1) minX = x;
                    maxX = x;
                }
            }
            if (minX !== -1) {
                lines.push({ y, x1: minX, x2: maxX });
            }
        }
        return lines;
    }

    mutate(w: number, h: number): void {
        const r = randomRange(0, 3);
        const amount = 16;
        switch (r) {
            case 0: this.x = clamp(this.x + randomRange(-amount, amount), 0, w - 1); this.y = clamp(this.y + randomRange(-amount, amount), 0, h - 1); break;
            case 1: this.rx = clamp(this.rx + randomRange(-amount, amount), 1, w - 1); break;
            case 2: this.ry = clamp(this.ry + randomRange(-amount, amount), 1, h - 1); break;
            case 3: this.angle = (this.angle + randomRange(-4, 4)) % 360; break;
        }
    }

    clone(): RotatedEllipse { return new RotatedEllipse(this.x, this.y, this.rx, this.ry, this.angle); }
    getType(): string { return "RotatedEllipse"; }
    getRawShapeData(): number[] { return [this.x, this.y, this.rx, this.ry, this.angle]; }
}

export class Triangle extends Shape {
    x1: number; y1: number; x2: number; y2: number; x3: number; y3: number;

    constructor(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) {
        super();
        this.x1 = x1; this.y1 = y1; this.x2 = x2; this.y2 = y2; this.x3 = x3; this.y3 = y3;
    }

    rasterize(w: number, h: number): Scanline[] {
        return scanlinePolygon([
            {x: this.x1, y: this.y1}, {x: this.x2, y: this.y2}, {x: this.x3, y: this.y3}
        ], w, h);
    }

    mutate(w: number, h: number): void {
        const r = randomRange(0, 2);
        const amount = 16;
        if (r === 0) { this.x1 = clamp(this.x1 + randomRange(-amount, amount), 0, w - 1); this.y1 = clamp(this.y1 + randomRange(-amount, amount), 0, h - 1); }
        else if (r === 1) { this.x2 = clamp(this.x2 + randomRange(-amount, amount), 0, w - 1); this.y2 = clamp(this.y2 + randomRange(-amount, amount), 0, h - 1); }
        else { this.x3 = clamp(this.x3 + randomRange(-amount, amount), 0, w - 1); this.y3 = clamp(this.y3 + randomRange(-amount, amount), 0, h - 1); }
    }

    clone(): Triangle { return new Triangle(this.x1, this.y1, this.x2, this.y2, this.x3, this.y3); }
    getType(): string { return "Triangle"; }
    getRawShapeData(): number[] { return [this.x1, this.y1, this.x2, this.y2, this.x3, this.y3]; }
}

function scanlinePolygon(vertices: {x:number, y:number}[], w: number, h: number): Scanline[] {
    const lines: Scanline[] = [];
    if (vertices.length < 3) return lines;

    let minY = h, maxY = 0;
    vertices.forEach(v => {
        if (v.y < minY) minY = v.y;
        if (v.y > maxY) maxY = v.y;
    });
    
    minY = clamp(Math.floor(minY), 0, h - 1);
    maxY = clamp(Math.floor(maxY), 0, h - 1);

    for (let y = minY; y <= maxY; y++) {
        const nodes: number[] = [];
        let j = vertices.length - 1;
        for (let i = 0; i < vertices.length; i++) {
            const vi = vertices[i];
            const vj = vertices[j];
            if ((vi.y < y && vj.y >= y) || (vj.y < y && vi.y >= y)) {
                nodes.push(Math.round(vi.x + (y - vi.y) / (vj.y - vi.y) * (vj.x - vi.x)));
            }
            j = i;
        }
        
        nodes.sort((a, b) => a - b);
        for (let i = 0; i < nodes.length; i += 2) {
            if (i + 1 >= nodes.length) break;
            const xStart = clamp(nodes[i], 0, w - 1);
            const xEnd = clamp(nodes[i + 1], 0, w - 1);
            if (xStart <= xEnd) lines.push({ y, x1: xStart, x2: xEnd });
        }
    }
    return lines;
}