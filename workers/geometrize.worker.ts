import { Runner } from "../lib/geometrize/runner";
import { Bitmap } from "../lib/geometrize/bitmap";

let runner: Runner | null = null;

self.onmessage = (e: MessageEvent) => {
    const { type, data } = e.data;

    switch (type) {
        case "init": {
            const { width, height, pixels } = data;
            // pixels is Uint8ClampedArray
            const bitmap = Bitmap.createFromData(width, height, pixels);
            runner = new Runner(bitmap);
            
            // Send back the initial average color image
            const avgColor = runner.getAverageColor();
            self.postMessage({
                type: "init_result",
                data: {
                    avgColor
                }
            });
            break;
        }
        case "step": {
            if (!runner) return;
            const { shapeTypes, alpha, mutations, count } = data;
            const results: any[] = []; 
            
            for (let i = 0; i < count; i++) {
                const stepResults = runner.step({ shapeTypes, alpha, mutations });
                if (stepResults.length > 0) {
                     const r = stepResults[0];
                     results.push({
                         score: r.score,
                         color: r.color,
                         shapeType: r.shape.getType(),
                         shapeData: r.shape.getRawShapeData()
                     });
                }
            }
            
            self.postMessage({
                type: "step_result",
                data: results
            });
            break;
        }
    }
};
