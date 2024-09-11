export interface TreeFlatNode<T = any> {
  id: string;
  isGroup: boolean;
  disabled: boolean;
  level: number;
  data: T;
}

export interface DropPosition {
  x: number;
  y: number;
  level: number;
  type: DropPositionType;
}

export type DropPositionType = 'above' | 'below' | 'inside';
