import { LayerListControlsOptions } from '../layer-list-tool/layer-list-tool.interface';

export interface LayerViewerOptions {
  maxHierarchyLevel?: number;
  mode?: LayerToolMode;
  queryBadge?: boolean;
  legend?: Partial<ViewerLegendOptions>;
  filterAndSortOptions?: LayerListControlsOptions;
}

interface ViewerLegendOptions {
  showOnVisibilityChange: boolean;
  updateOnResolutionChange: boolean;
  showForVisibleLayers: boolean;
}

export type LayerToolMode = 'selection';
