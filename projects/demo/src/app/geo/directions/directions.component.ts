import { Component } from '@angular/core';
import { MatGridListModule } from '@angular/material/grid-list';

import {
  IgoDirectionsModule,
  IgoMap,
  IgoSearchModule,
  LayerOptions,
  LayerService,
  MAP_DIRECTIVES,
  MapService,
  MapViewOptions,
  RoutesFeatureStore,
  StepFeatureStore,
  StopsFeatureStore,
  StopsStore,
  TileLayer
} from '@igo2/geo';

import { Subject } from 'rxjs';

import { DocViewerComponent } from '../../components/doc-viewer/doc-viewer.component';
import { ExampleViewerComponent } from '../../components/example/example-viewer/example-viewer.component';

@Component({
  selector: 'app-directions',
  templateUrl: './directions.component.html',
  styleUrls: ['./directions.component.scss'],
  standalone: true,
  imports: [
    DocViewerComponent,
    ExampleViewerComponent,
    MatGridListModule,
    MAP_DIRECTIVES,
    IgoDirectionsModule,
    IgoSearchModule
  ]
})
export class AppDirectionsComponent {
  public map: IgoMap = new IgoMap({
    controls: {
      attribution: {
        collapsed: true
      }
    }
  });

  public view: MapViewOptions = {
    center: [-73, 47.2],
    zoom: 9,
    geolocate: false
  };

  public stopsStore: StopsStore = new StopsStore([]);
  public stopsFeatureStore: StopsFeatureStore = new StopsFeatureStore([], {
    map: this.map
  });
  public stepFeatureStore: StepFeatureStore = new StepFeatureStore([], {
    map: this.map
  });
  public routesFeatureStore: RoutesFeatureStore = new RoutesFeatureStore([], {
    map: this.map
  });
  public zoomToActiveRoute$: Subject<void> = new Subject();

  constructor(
    private layerService: LayerService,
    private mapService: MapService
  ) {
    this.mapService.setMap(this.map);
    this.layerService
      .createAsyncLayer({
        title: 'OSM',
        baseLayer: true,
        visible: true,
        sourceOptions: {
          type: 'osm'
        }
      } satisfies LayerOptions)
      .subscribe((layer: TileLayer) => this.map.addLayer(layer));
  }
}
