import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { ActionStore, EntityStoreFilterSelectionStrategy } from '@igo2/common';
import { StorageService } from '@igo2/core/storage';

import { FeatureDataSource } from '../../../datasource/shared/datasources/feature-datasource';
import {
  FeatureMotion,
  FeatureStore,
  FeatureStoreInMapExtentStrategy,
  FeatureStoreInMapResolutionStrategy,
  FeatureStoreLoadingLayerStrategy,
  FeatureStoreSelectionStrategy
} from '../../../feature/shared';
import { VectorLayer } from '../../../layer/shared';
import { IgoMap } from '../../../map/shared';
import { createFilterInMapExtentOrResolutionStrategy } from '../workspace.utils';
import { NewEditionWorkspace } from './new-edition-workspace';
import { RestAPIEdition } from './rest-api-edition';

@Injectable({
  providedIn: 'root'
})
export class EditionWorkspaceFactoryService {
  get zoomAuto(): boolean {
    return this.storageService.get('zoomAuto') as boolean;
  }

  constructor(
    private storageService: StorageService,
    private http: HttpClient
  ) {}

  createWFSEditionWorkspace(
    layer: VectorLayer,
    map: IgoMap
  ): NewEditionWorkspace {
    return new RestAPIEdition(this.http, {
      id: layer.id,
      title: layer.title,
      layer,
      map,
      entityStore: this.createFeatureStore(layer, map),
      actionStore: new ActionStore([]),
      meta: {
        tableTemplate: undefined
      }
    });
  }

  private createFeatureStore(layer: VectorLayer, map: IgoMap): FeatureStore {
    const store = new FeatureStore([], { map });
    store.bindLayer(layer);

    const loadingStrategy = new FeatureStoreLoadingLayerStrategy({});
    const inMapExtentStrategy = new FeatureStoreInMapExtentStrategy({});
    const inMapResolutionStrategy = new FeatureStoreInMapResolutionStrategy({});
    const selectedRecordStrategy = new EntityStoreFilterSelectionStrategy({});
    const selectionStrategy = new FeatureStoreSelectionStrategy({
      layer: new VectorLayer({
        zIndex: 300,
        source: new FeatureDataSource(),
        style: undefined,
        showInLayerList: false,
        exportable: false,
        browsable: false
      }),
      map,
      hitTolerance: 15,
      motion: this.zoomAuto ? FeatureMotion.Default : FeatureMotion.None,
      many: true,
      dragBox: true
    });
    store.addStrategy(loadingStrategy, true);
    store.addStrategy(inMapExtentStrategy, true);
    store.addStrategy(inMapResolutionStrategy, true);
    store.addStrategy(selectionStrategy, true);
    store.addStrategy(selectedRecordStrategy, false);
    store.addStrategy(createFilterInMapExtentOrResolutionStrategy(), true);
    return store;
  }
}
