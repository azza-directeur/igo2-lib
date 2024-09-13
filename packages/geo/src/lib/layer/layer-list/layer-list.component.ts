import { SelectionModel } from '@angular/cdk/collections';
import { FlatTreeControl } from '@angular/cdk/tree';
import { AsyncPipe, NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSliderModule } from '@angular/material/slider';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  MatTreeFlatDataSource,
  MatTreeFlattener,
  MatTreeModule
} from '@angular/material/tree';

import {
  DropPermission,
  TreeDragDropDirective,
  TreeDropEvent,
  TreeFlatNode
} from '@igo2/common/drag-drop';
import {
  IconSvg,
  IgoIconComponent,
  VECTOR_SQUARE_ICON
} from '@igo2/common/icon';
import { ListComponent, ListItemDirective } from '@igo2/common/list';
import { PanelComponent } from '@igo2/common/panel';
import { IgoLanguageModule } from '@igo2/core/language';
import { MessageService } from '@igo2/core/message';

import { LayerGroupComponent } from '../layer-group';
import { LayerItemComponent } from '../layer-item';
import { LayerListToolComponent } from '../layer-list-tool';
import type { LayerViewerOptions } from '../layer-viewer/layer-viewer.interface';
import type { LayerController } from '../shared/layer-controller';
import type { AnyLayer } from '../shared/layers/any-layer';
import type { Layer } from '../shared/layers/layer';
import type { LayerGroup } from '../shared/layers/layer-group';
import { isLayerGroup, isLayerItem } from '../utils/layer.utils';

type LayerFlatNode = TreeFlatNode<AnyLayer>;

@Component({
  selector: 'igo-layer-list',
  templateUrl: './layer-list.component.html',
  styleUrls: ['./layer-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    NgTemplateOutlet,
    FormsModule,
    AsyncPipe,
    MatBadgeModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDividerModule,
    MatIconModule,
    MatMenuModule,
    MatSliderModule,
    MatTreeModule,
    MatTooltipModule,
    TreeDragDropDirective,
    LayerListToolComponent,
    LayerGroupComponent,
    ListComponent,
    LayerItemComponent,
    ListItemDirective,
    PanelComponent,
    IgoLanguageModule,
    IgoIconComponent
  ]
})
export class LayerListComponent {
  public toggleOpacity = false;
  disabledModel = new SelectionModel<LayerFlatNode>(true);

  @Input({ required: true }) controller: LayerController;

  @Input({ required: true })
  set layers(layers: AnyLayer[]) {
    this._layers = layers;
    this.updateDatasource(layers ?? []);
  }
  get layers(): AnyLayer[] {
    return this._layers;
  }
  private _layers: AnyLayer[];

  @Input() selectAll: boolean;
  @Input() viewerOptions: LayerViewerOptions;

  @Output() activeChange = new EventEmitter<AnyLayer>();

  private _transformer = (layer: AnyLayer, level: number): LayerFlatNode => {
    return {
      id: layer.id || layer.options.name,
      isGroup: !!isLayerGroup(layer),
      level: level,
      data: layer,
      disabled: false
    };
  };

  treeControl = new FlatTreeControl<LayerFlatNode>(
    (node) => node.level,
    (node) => node.isGroup
  );

  treeFlattener = new MatTreeFlattener(
    this._transformer,
    (node) => node.level,
    (node) => node.isGroup,
    (node) => (node as LayerGroup).children.sort((a, b) => a.zIndex + b.zIndex)
  );

  dataSource: MatTreeFlatDataSource<AnyLayer, LayerFlatNode>;

  constructor(private messageService: MessageService) {
    this.dataSource = new MatTreeFlatDataSource(
      this.treeControl,
      this.treeFlattener,
      []
    );
  }

  isGroup = (_: number, node: LayerFlatNode) => node.isGroup;

  isLayerGroup = isLayerGroup;
  isLayerItem = isLayerItem;

  isSelected = (layer: AnyLayer): boolean => this.controller.isSelected(layer);
  isDescendantSelection = (layer: AnyLayer): boolean =>
    this.controller.isDescendantSelection(layer);

  toggleActive(layer: AnyLayer): void {
    const isSelected = this.controller.isSelected(layer);

    this.controller.clearSelection();

    if (!isSelected) {
      this.controller.select(layer);
    }
    this.activeChange.emit(layer);
  }

  handleSelect(checked: boolean, layer: AnyLayer): void {
    checked ? this.controller.select(layer) : this.controller.deselect(layer);
  }

  getLayerIcon(layer: Layer): string | IconSvg {
    return layer.type === 'raster'
      ? 'image'
      : layer.id.includes('measure')
        ? 'square_foot'
        : VECTOR_SQUARE_ICON;
  }

  handleVisibilityChange(_event: Event, node: LayerFlatNode): void {
    this.handleDisabled(node);

    if (isLayerGroup(node.data)) {
      const descendants = this.treeControl.getDescendants(node);
      descendants.forEach((descendant) => this.handleDisabled(descendant));
    }
  }

  dropNode({ node, ref, position }: TreeDropEvent<AnyLayer>): void {
    let nodesToDrop = this.controller.hasSelection
      ? this.controller.selected
      : [node.data];

    if (node.isGroup) {
      nodesToDrop = nodesToDrop.filter(
        (nodeDrop) => !(node.data as LayerGroup).isDescendant(nodeDrop)
      );
    }

    if (ref.isGroup) {
      const isSelected = nodesToDrop.some((nodeDrop) => nodeDrop.id === ref.id);
      if (isSelected) {
        nodesToDrop = nodesToDrop.filter((nodeDrop) => nodeDrop.id !== ref.id);
      }
    }

    if (!nodesToDrop.includes(node.data)) {
      nodesToDrop.push(node.data);
    }

    switch (position) {
      case 'above':
        this.controller.moveAbove(ref.data, ...nodesToDrop);
        break;
      case 'inside':
        this.controller.moveInside(ref.data as LayerGroup, ...nodesToDrop);
        break;

      default:
        this.controller.moveBelow(ref.data, ...nodesToDrop);
        break;
    }
  }

  dropNodeError(details: DropPermission): void {
    this.messageService.alert(
      details.message,
      'igo.geo.layer.layer',
      null,
      details.params
    );
  }

  dragStart(): void {
    if (this.viewerOptions.mode === 'selection') {
      return;
    }

    this.controller.clearSelection();
  }

  private handleDisabled(node: LayerFlatNode): void {
    const disabled = this.nodeIsDisabled(node);

    disabled
      ? this.disabledModel.select(node)
      : this.disabledModel.deselect(node);
  }

  private nodeIsDisabled(node: LayerFlatNode): boolean {
    const layer = this.findLayerById(node.id);
    const parentDisabled = this.ancestorIsDisabled(node);
    return parentDisabled || !layer.visible;
  }

  private ancestorIsDisabled(node: LayerFlatNode): boolean {
    const parentNode = this.getNodeAncestors(node.id);
    if (!parentNode) {
      return false;
    }

    const parentInModel = Array.from(this.disabledModel['_selection']).some(
      (nodeDisabled: LayerFlatNode) => nodeDisabled.id === parentNode.id
    );
    const parentLayer = this.findLayerById(parentNode.data.id);
    return parentInModel || !parentLayer.visible;
  }

  private getNodeAncestors(id: string): TreeFlatNode | undefined {
    const nodes = this.treeControl.dataNodes;
    const index = nodes.findIndex((node) => node.id === id);
    return nodes
      .slice(0, index)
      .reverse()
      .find((node) => node.level < nodes[index].level);
  }

  private findLayerById(id: string): AnyLayer {
    return this.controller.layersFlattened.find((layer) => layer.id === id);
  }

  private updateDatasource(layers: AnyLayer[]): void {
    const expansionModel = this.treeControl.expansionModel;
    this.dataSource.data = layers;

    this.restoreModel(expansionModel, (node) => this.treeControl.expand(node));
    this.restoreModel(this.disabledModel, (node) =>
      this.disabledModel.select(node)
    );

    this.treeControl.dataNodes.forEach((node) => this.handleDisabled(node));
  }

  private restoreModel(
    model: SelectionModel<LayerFlatNode>,
    callback: (node: LayerFlatNode) => void
  ) {
    const ids: string[] = Array.from(model['_selection']).map(
      (value) => value['id']
    );
    model.clear();
    this.treeControl.dataNodes.forEach((node) => {
      if (model.isSelected(node) || ids.includes(node.id)) {
        callback(node);
      }
    });
  }
}
