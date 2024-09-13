import { AuthInterceptor } from '@igo2/auth';
import { Message, MessageService } from '@igo2/core/message';
import { SubjectStatus } from '@igo2/utils';

import olLayer from 'ol/layer/Layer';
import olSource from 'ol/source/Source';

import {
  BehaviorSubject,
  Observable,
  Subject,
  Subscription,
  combineLatest
} from 'rxjs';
import { map } from 'rxjs/operators';

import { DataSource } from '../../../datasource/shared/datasources/datasource';
import { Legend } from '../../../datasource/shared/datasources/datasource.interface';
import type { MapBase } from '../../../map/shared/map.abstract';
import { getResolutionFromScale } from '../../../map/shared/map.utils';
import { GeoDBService } from '../../../offline/geoDB/geoDB.service';
import { LayerDBService } from '../../../offline/layerDB/layerDB.service';
import { LayerOptions } from './layer.interface';

export abstract class Layer {
  public collapsed: boolean;
  public dataSource: DataSource;
  public legend: Legend[];
  public legendCollapsed = true;
  public firstLoadComponent = true;
  public map: MapBase;
  public ol: olLayer<olSource>;
  public olLoadingProblem = false;
  public status$: Subject<SubjectStatus>;
  public hasBeenVisible$ = new BehaviorSubject<boolean>(undefined);
  private hasBeenVisible$$: Subscription;
  private resolution$$: Subscription;

  /**
   * Define if a layer is generated by code OR defined by layer/context user layer.
   * Useful for filtering layers list in mapOffline.directive or in the sharemap...
   * return false by default.
   */
  get isIgoInternalLayer(): boolean {
    return this.options.isIgoInternalLayer || false;
  }

  get id(): string {
    return String(this.options.id || this.dataSource.id);
  }

  get alias(): string {
    return this.options.alias;
  }

  get title(): string {
    return this.options.title;
  }

  set title(title: string) {
    this.options.title = title;
  }

  get zIndex(): number {
    return this.ol.getZIndex();
  }

  set zIndex(zIndex: number) {
    this.ol.setZIndex(zIndex);
  }

  get baseLayer(): boolean {
    return this.options.baseLayer;
  }

  set baseLayer(baseLayer: boolean) {
    this.options.baseLayer = baseLayer;
  }

  get opacity(): number {
    return this.ol.get('opacity');
  }

  set opacity(opacity: number) {
    this.ol.setOpacity(opacity);
  }

  set isInResolutionsRange(value: boolean) {
    this.isInResolutionsRange$.next(value);
  }
  get isInResolutionsRange(): boolean {
    return this.isInResolutionsRange$.value;
  }
  readonly isInResolutionsRange$ = new BehaviorSubject<boolean>(false);

  set maxResolution(value: number) {
    this.ol.setMaxResolution(value === 0 ? 0 : value || Infinity);
    this.updateInResolutionsRange();
  }
  get maxResolution(): number {
    return this.ol.getMaxResolution();
  }

  set minResolution(value: number) {
    this.ol.setMinResolution(value || 0);
    this.updateInResolutionsRange();
  }
  get minResolution(): number {
    return this.ol.getMinResolution();
  }

  set visible(value: boolean) {
    this.ol.setVisible(value);
    this.visible$.next(value);
    if (!this.hasBeenVisible$.value && value) {
      this.hasBeenVisible$.next(value);
    }
    if (this.options?.messages && value) {
      this.options?.messages
        .filter((m) => m.options?.showOnEachLayerVisibility)
        .map((message) => this.showMessage(message));
    }
  }
  get visible(): boolean {
    return this.visible$.value;
  }
  readonly visible$ = new BehaviorSubject<boolean>(undefined);

  get displayed(): boolean {
    return this.visible && this.isInResolutionsRange;
  }
  readonly displayed$: Observable<boolean> = combineLatest([
    this.isInResolutionsRange$,
    this.visible$
  ]).pipe(map((bunch: [boolean, boolean]) => bunch[0] && bunch[1]));

  get showInLayerList(): boolean {
    return this.options.showInLayerList !== false;
  }

  get saveableOptions(): Partial<LayerOptions> {
    return {
      title: this.options.title,
      zIndex: this.zIndex,
      visible: this.visible,
      security: this.options.security,
      opacity: this.opacity
    };
  }

  constructor(
    public options: LayerOptions,
    protected messageService?: MessageService,
    protected authInterceptor?: AuthInterceptor,
    protected geoDBService?: GeoDBService,
    public layerDBService?: LayerDBService
  ) {
    this.dataSource = options.source;

    this.ol = this.createOlLayer();
    if (options.zIndex !== undefined) {
      this.zIndex = options.zIndex;
    }

    if (options.baseLayer && options.visible === undefined) {
      options.visible = false;
    }

    this.maxResolution =
      options.maxResolution ||
      getResolutionFromScale(Number(options.maxScaleDenom));
    this.minResolution =
      options.minResolution ||
      getResolutionFromScale(Number(options.minScaleDenom));

    this.visible = options.visible === undefined ? true : options.visible;
    this.opacity = options.opacity === undefined ? 1 : options.opacity;

    if (
      options.legendOptions &&
      (options.legendOptions.url || options.legendOptions.html)
    ) {
      this.legend = this.dataSource.setLegend(options.legendOptions);
    }

    this.legendCollapsed = options.legendOptions
      ? options.legendOptions.collapsed
        ? options.legendOptions.collapsed
        : true
      : true;

    this.ol.set('_layer', this, true);
  }

  protected abstract createOlLayer(): olLayer<olSource>;

  setMap(map: MapBase | undefined) {
    this.map = map;

    this.unobserveResolution();
    if (map !== undefined) {
      this.observeResolution();
      this.hasBeenVisible$$ = this.hasBeenVisible$.subscribe(() => {
        if (this.options.messages && this.visible) {
          this.options.messages.map((message) => {
            this.showMessage(message);
          });
        }
      });
    }
  }

  private showMessage(message: Message) {
    if (!this.messageService) {
      return;
    }
    this.messageService.message(message as Message);
  }

  private observeResolution() {
    this.resolution$$ = this.map.viewController.resolution$.subscribe(() =>
      this.updateInResolutionsRange()
    );
  }

  private unobserveResolution() {
    if (this.resolution$$ !== undefined) {
      this.resolution$$.unsubscribe();
      this.resolution$$ = undefined;
    }
  }

  private updateInResolutionsRange() {
    if (this.map !== undefined) {
      const resolution = this.map.viewController.getResolution();
      const minResolution = this.minResolution;
      const maxResolution =
        this.maxResolution === undefined ? Infinity : this.maxResolution;
      this.isInResolutionsRange =
        resolution >= minResolution && resolution <= maxResolution;
    } else {
      this.isInResolutionsRange = false;
    }
  }
}
