declare const SpotiKit: any;

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

interface LiquifyGlassControls {
  enable(): void;
  disable(): void;
  toggle(): void;
  readonly enabled: boolean;
}

interface Window {
  liquifyGlass?: LiquifyGlassControls;
}
