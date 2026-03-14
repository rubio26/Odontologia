declare module 'react-signature-canvas' {
  import { Component } from 'react';

  export interface ReactSignatureCanvasProps {
    velocityFilterWeight?: number;
    minWidth?: number;
    maxWidth?: number;
    minDistance?: number;
    dotSize?: number | (() => number);
    penColor?: string;
    backgroundColor?: string;
    onEnd?: () => void;
    onBegin?: () => void;
    canvasProps?: React.CanvasHTMLAttributes<HTMLCanvasElement>;
    clearOnResize?: boolean;
    ref?: React.Ref<SignatureCanvas>;
  }

  export default class SignatureCanvas extends Component<ReactSignatureCanvasProps> {
    clear(): void;
    fromDataURL(base64String: string, options?: any): void;
    toDataURL(type?: string, encoderOptions?: any): string;
    getTrimmedCanvas(): HTMLCanvasElement;
    getCanvas(): HTMLCanvasElement;
    toData(): any;
    fromData(data: any): void;
    isEmpty(): boolean;
  }
}
