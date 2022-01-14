import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatSlider } from '@angular/material/slider';
import {
  DownloadRegionService, DrawEntityStore, DrawFeatureStore, FeatureGeometry,
  RegionDBData, TileDownloaderService, TileGenerationParams, TileToDownload
} from '@igo2/geo';
import { LanguageService, MessageService } from '@igo2/core';
import { Feature, IgoMap } from '@igo2/geo';
import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';
import { map, skip } from 'rxjs/operators';
import { MapState } from '../../map/map.state';
import { DownloadState } from '../download.state';
import { RegionDrawComponent } from '../region-draw/region-draw.component';
import { TileGenerationOptionComponent } from '../tile-generation-option/tile-generation-option.component';
import { TransferedTile } from '../TransferedTile';
import { EditionStrategy, UpdateEditionStrategy } from './editing-strategy';
import { RegionDownloadEstimationComponent } from './region-download-estimation/region-download-estimation.component';
import { RegionEditorController } from './region-editor-controller';
import { AddTileError, AddTileErrors } from './region-editor-utils';
import { EditedRegion, RegionEditorState } from './region-editor.state';


@Component({
  selector: 'igo-region-editor',
  templateUrl: './region-editor.component.html',
  styleUrls: ['./region-editor.component.scss']
})
export class RegionEditorComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() geometryTypes: string[];
  @Input() predefinedRegionsStore: DrawEntityStore;
  @Input() allRegionsStore: DrawFeatureStore;
  @Input() drawControlIsActive$: BehaviorSubject<boolean>;
  @Input() predefinedTypes: string[];
  @Input() minBufferMeters: number;
  @Input() maxBufferMeters: number;
  @Input() selectedPredefinedType: string;
  @ViewChild('depthSlider') slider: MatSlider;
  @ViewChild('progressBar') progressBar: MatProgressBar;
  @ViewChild('genParam') genParamComponent: TileGenerationOptionComponent;
  @ViewChild('regionDraw') regionDrawComponent: RegionDrawComponent;
  @ViewChild('regionDownloadEstimation') regionDownloadEstimation: RegionDownloadEstimationComponent;

  @Output() predefinedTypeChange: EventEmitter<string> = new EventEmitter<string>();

  private controller: RegionEditorController;
  public updateEstimation$: Subject<void> = new Subject();

  private _progression: number = 0;

  isDownloading$: Observable<boolean>;
  isDownloading$$: Subscription;

  private addNewTile$$: Subscription;

  get openedWithMouse() {
    return this.downloadState.openedWithMouse;
  }

  geometries: FeatureGeometry[] = [];

  constructor(
    private tileDownloader: TileDownloaderService,
    private downloadService: DownloadRegionService,
    private downloadState: DownloadState,
    private state: RegionEditorState,
    private messageService: MessageService,
    private cdRef: ChangeDetectorRef,
    private languageService: LanguageService,
    public mapState: MapState
  ) {
    this.initController();

    if (this.openedWithMouse) {
      this.deactivateDrawingTool();
    }

    const numberToSkip = this.openedWithMouse ? 0 : 1;
    this.addNewTile$$ = this.downloadState.addNewTile$
      .pipe(skip(numberToSkip))
      .subscribe((tile: TransferedTile) => {
        if (!tile) {
          return;
        }
        this.addTileToDownload(tile.coord, tile.templateUrl, tile.tileGrid);
      });

    this.isDownloading$ = this.tileDownloader.isDownloading$;

    if (!this.progression$) {
      this.progression$ = this.tileDownloader.progression$
        .pipe(map((value: number) => {
          return Math.round(value * 100);
        }));
    }
  }

  private initController() {
    this.controller = new RegionEditorController(
      this.state,
      this.downloadState,
      this.cdRef
    );
  }

  ngOnInit() {
    this.regionStore.entities$.subscribe((entities) => {
      this.updateEstimation$.next();
      console.log('entities', entities);
      if (!entities || !entities.length) {
        return;
      }
      this.geometries = entities.map(e => e.geometry);
      this.controller.setTileGridAndTemplateUrl();
      this.parentLevel = this.map.getZoom();
      this.cdRef.detectChanges();
      this.genParams = this.genParamComponent.tileGenerationParams;
      this.updateEstimation$.next();
    });
    if (!this.editedTilesFeature) {
      this.regionStore.updateMany(this.editedTilesFeature);
    }
  }

  ngAfterViewInit() {
    if (this.controller.editionStrategy instanceof UpdateEditionStrategy) {
      this.injectGenParamsIntoGenComponent();
    }
  }

  ngOnDestroy() {
    this.addNewTile$$.unsubscribe();
    this.regionStore.clear();
  }

  onSelectedOfflinableLayers(event) {
    this.downloadState.selectedOfflinableLayers$.next(event);
  }

  public onGenerationParamsChange(params: TileGenerationParams) {
    this.updateEstimation$.next();
    this.genParams = params;
  }

  public clearFeatures() {
    this.editedTilesFeature = new Array();
    this.regionStore.clear();
  }

  public showEditedRegionFeatures() {
    this.regionStore.clear();
    if (!this.editedTilesFeature) {
      return;
    }
    this.regionStore.updateMany(this.editedTilesFeature);
  }

  addTileToDownload(coord: [number, number, number], templateUrl, tileGrid) {
    if (this.regionStore.index.size && this.tilesToDownload.length === 0) {
        return;
    }
    this.deactivateDrawingTool();
    try {
      this.controller.addTileToDownload(coord, templateUrl, tileGrid);
      this.showEditedRegionFeatures();
    } catch (e) {
      if (!(e instanceof AddTileError)) {
        console.error(e);
        return;
      }
      this.sendAddTileErrorMessage(e);
    }
  }

  private injectGenParamsIntoGenComponent() {
    this.genParamComponent.tileGenerationParams = this.genParams;
  }

  getAddTileErrorMessage(error): string {
    switch (error.addTileError) {
      case AddTileErrors.CARTO_BACKGROUND:
        return 'igo.integration.download.messages.errors.addTiles.cartoBackground';

      case AddTileErrors.LEVEL:
        return 'igo.integration.download.messages.errors.addTiles.level';

      case AddTileErrors.ALREADY_SELECTED:
        return 'igo.integration.download.messages.errors.addTiles.alreadySelected';

      case AddTileErrors.ALREADY_DOWNLOADING:
        return 'igo.integration.download.messages.errors.addTiles.alreadyDownloading';
    }
  }

  sendAddTileErrorMessage(error: AddTileError) {
    const messageToTranslate = this.getAddTileErrorMessage(error);
    const message = this.languageService.translate.instant(messageToTranslate);
    this.messageService.error(message);
  }

  public onDownloadClick() {
    if (!this.controller.hasEditedRegion()) {
      return;
    }

    if (this.isDrawingMode) {
      this.controller.setTileGridAndTemplateUrl();
      this.cdRef.detectChanges();
      this.controller.loadFeature(this.regionStore.entities$.value);
    }

    this.genParams = this.genParamComponent.tileGenerationParams;
    this.regionStore.clear();

    if (this.isDownloading$$) {
      this.isDownloading$$.unsubscribe();
    }

    this.isDownloading$$ = this.isDownloading$
      .pipe(skip(1))
      .subscribe((value) => {
        this.isDownloading = value;
        if (!value) {
          const messageToTranslate = 'igo.integration.download.messages.completion.download';
          const message = this.languageService.translate.instant(messageToTranslate);
          this.messageService.success(message);
          this.clear();
        }
      });
    this.regionStore.reset$.next();
    this.controller.downloadEditedRegion(this.downloadService);
  }

  private clear() {
    this.controller.clear();
    this.genParamComponent.tileGenerationParams = this.genParams;
  }

  public onCancelClick() {
    if (this.isDownloading) {
      this.controller.cancelDownload(this.downloadService);
    } else {
      this.clear();
    }
  }

  public updateRegion(region: RegionDBData) {
    this.deactivateDrawingTool();
    try {
      this.controller.updateRegion(region);
    } catch (e) {
      if (!(e instanceof AddTileError)) {
        return;
      }
      this.sendAddTileErrorMessage(e);
    }
    this.genParamComponent.tileGenerationParams = {...region.generationParams};
    this.showEditedRegionFeatures();
  }

  private deactivateDrawingTool() {
    this.regionStore.clear();
  }

  get enoughSpace$(): BehaviorSubject<boolean> {
    return this.regionDownloadEstimation.enoughSpace$;
  }

  get isDrawingMode(): boolean {
    return !this.regionStore.empty;
  }

  get igoMap(): IgoMap {
    return this.state.map;
  }

  get downloadButtonTitle(): string{
    return this.editionStrategy.downloadButtonTitle;
  }

  get regionStore(): DrawFeatureStore {
    return this.downloadState.regionStore;
  }

  private get map(): IgoMap {
    return this.downloadState.map;
  }

  set editedRegion(editedRegion: EditedRegion) {
    this.state.editedRegion = editedRegion;
  }

  get editedRegion(): EditedRegion {
    return this.state.editedRegion;
  }

  set tileGrid(tileGrid: any) {
    this.state.editedRegion.tileGrid = tileGrid;
  }

  get tileGrid(): any {
    return this.state.editedRegion.tileGrid;
  }

  set templateUrl(templateUrl: string) {
    this.state.editedRegion.templateUrl = templateUrl;
  }

  get templateUrl(): string {
    return this.state.editedRegion.templateUrl;
  }

  get parentTileUrls(): Array<string> {
    return this.state.parentTileUrls;
  }

  set parentTileUrls(urls: Array<string>) {
    this.state.parentTileUrls = urls;
  }

  set regionName(name: string) {
    this.state.regionName = name;
  }

  get regionName(): string {
    return this.state.regionName;
  }

  set urlsToDownload(urls: Set<string>) {
    this.state.urlsToDownload = urls;
  }

  get urlsToDownload(): Set<string> {
    return this.state.urlsToDownload;
  }

  set tilesToDownload(tiles: TileToDownload[]) {
    this.state.tilesToDownload = tiles;
  }

  get tilesToDownload(): TileToDownload[] {
      return this.state.tilesToDownload;
  }

  set genParams(depth: TileGenerationParams) {
      this.updateEstimation$.next();
      this.state.genParams = depth;
  }

  get genParams(): TileGenerationParams {
      return this.state.genParams;
  }

  get depth(): number {
    const depth = this.genParams.endLevel - this.genParams.startLevel;
    if (Number.isNaN(depth)) {
      return 0;
    }
    return depth;
  }

  set parentLevel(level: number) {
    this.state.parentLevel = level;
  }

  get parentLevel(): number {
    return this.state.parentLevel;
  }

  set editedTilesFeature(features: Feature[]) {
      this.state.editedTilesFeatures = features;
  }

  get editedTilesFeature(): Feature[] {
      return this.state.editedTilesFeatures ;
  }

  set progression$(progression$: Observable<number>) {
    this.state.progression$ = progression$;
  }

  get progression$(): Observable<number> {
    return this.state.progression$;
  }

  set isDownloading(value: boolean) {
    this.state.isDownloading = value;
  }

  get isDownloading(): boolean {
    return this.state.isDownloading;
  }

  get progression(): number {
    return Math.round(this._progression * 100);
  }

  get disableGenerationParamsComponent() {
    return this.controller.disableGenerationParamsComponent;
  }

  get disableDownloadButton() {
    return this.controller.disableDownloadButton;
  }

  get editionStrategy(): EditionStrategy {
    return this.state.editionStrategy;
  }

  set editionStrategy(strategy: EditionStrategy) {
    this.state.editionStrategy = strategy;
  }
}
