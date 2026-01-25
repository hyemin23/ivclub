/**
 * DSIG (Dynamic Spec Icon Generator) v2.0 Type Definitions
 * Based on SRS v2.0
 */

export interface FabricAnalysis {
    material: string[];
    texture: string[];
    quality: string[];
    features: string[];
}

export type ShapeType = 'path' | 'circle' | 'rect' | 'line' | 'polyline';

export interface BaseShape {
    type: ShapeType;
    stroke?: string; // Default: currentColor
    fill?: string;   // Default: none
    strokeWidth?: number; // Default: 2
    opacity?: number;
}

export interface PathShape extends BaseShape {
    type: 'path';
    d: string; // SVG Path Data
}

export interface CircleShape extends BaseShape {
    type: 'circle';
    cx: number;
    cy: number;
    r: number;
}

export interface RectShape extends BaseShape {
    type: 'rect';
    x: number;
    y: number;
    width: number;
    height: number;
    rx?: number; // Corner radius
    ry?: number;
}

export interface LineShape extends BaseShape {
    type: 'line';
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

export interface PolylineShape extends BaseShape {
    type: 'polyline';
    points: string; // "x1,y1 x2,y2 ..."
}

export type DsigShape = PathShape | CircleShape | RectShape | LineShape | PolylineShape;

export interface IconSpec {
    icon_id: string; // Unique identifier for the icon (e.g., "soft_touch_v1")
    viewBox?: string; // Default: "0 0 24 24"
    shapes: DsigShape[];
    intent?: string; // The semantic intent this icon represents (Debug purpose)
}
