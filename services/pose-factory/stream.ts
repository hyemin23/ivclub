
// stream.ts
// stream.ts
import { CVFStreamEvent_ItemCompleted, CVFStreamEvent_Progress, CVFStreamEvent_ItemFailed } from './types';

type StreamData =
    | { type: 'JOB_PROGRESS', data: CVFStreamEvent_Progress }
    | { type: 'ITEM_COMPLETED', data: CVFStreamEvent_ItemCompleted }
    | { type: 'ITEM_FAILED', data: CVFStreamEvent_ItemFailed }
    | { type: 'JOB_FINISHED', data: any };

// Singleton Stream Registry (In-Memory for Prototype)
// specific to the Runtime (Node/Edge).
export class StreamManager {
    private static listeners: Record<string, ReadableStreamDefaultController<any>[]> = {};

    static register(jobId: string, controller: ReadableStreamDefaultController<any>) {
        if (!this.listeners[jobId]) {
            this.listeners[jobId] = [];
        }
        this.listeners[jobId].push(controller);
    }

    static unregister(jobId: string, controller: ReadableStreamDefaultController<any>) {
        if (!this.listeners[jobId]) return;
        this.listeners[jobId] = this.listeners[jobId].filter(c => c !== controller);
        if (this.listeners[jobId].length === 0) delete this.listeners[jobId];
    }

    static emit(jobId: string, event: StreamData) {
        const targets = this.listeners[jobId];
        if (!targets) return;

        const payload = `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
        const encoder = new TextEncoder();

        targets.forEach(controller => {
            try {
                controller.enqueue(encoder.encode(payload));
            } catch (e) {
                // Controller might be closed
                console.error("Stream closed", e);
            }
        });
    }
}
