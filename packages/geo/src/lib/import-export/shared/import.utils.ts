import * as olStyle from 'ol/style';

import { MessageService, LanguageService } from '@igo2/core';

import { FeatureDataSource } from '../../datasource/shared/datasources/feature-datasource';
import { FeatureDataSourceOptions } from '../../datasource/shared/datasources/feature-datasource.interface';
import { Feature } from '../../feature/shared/feature.interfaces';
import { featureToOl, moveToOlFeatures } from '../../feature/shared/feature.utils';
import { VectorLayer } from '../../layer/shared/layers/vector-layer';
import { IgoMap } from '../../map/shared/map';
import { QueryableDataSourceOptions } from '../../query/shared/query.interfaces';

export function addLayerAndFeaturesToMap(features: Feature[], map: IgoMap, layerTitle: string): VectorLayer {
  const olFeatures = features.map((feature: Feature) => featureToOl(feature, map.projection));

  const r = Math.floor(Math.random() * 255);
  const g = Math.floor(Math.random() * 255);
  const b = Math.floor(Math.random() * 255);
  const stroke = new olStyle.Stroke({
    color: [r, g, b, 1],
    width: 2
  });

  const fill = new olStyle.Fill({
    color: [r, g, b, 0.4]
  });
  const sourceOptions: FeatureDataSourceOptions & QueryableDataSourceOptions = {
    queryable: true
  };
  const source = new FeatureDataSource(sourceOptions);
  source.ol.addFeatures(olFeatures);
  const layer = new VectorLayer({
    title: layerTitle,
    source,
    style: new olStyle.Style({
      stroke,
      fill,
      image: new olStyle.Circle({
        radius: 5,
        stroke,
        fill
      })
    })
  });
  map.addLayer(layer);
  moveToOlFeatures(map, olFeatures);

  return layer;
}

export function handleFileImportSuccess(
  file: File,
  features: Feature[],
  map: IgoMap,
  messageService: MessageService,
  languageService: LanguageService
) {
  if (features.length === 0) {
    handleNothingToImportError(file, messageService, languageService);
    return;
  }

  const layerTitle = computeLayerTitleFromFile(file);
  addLayerAndFeaturesToMap(features, map, layerTitle);

  const translate = languageService.translate;
  const messageTitle = translate.instant('igo.geo.dropGeoFile.success.title');
  const message = translate.instant('igo.geo.dropGeoFile.success.text', {
      value: layerTitle
  });
  messageService.success(message, messageTitle);
}

export function handleFileImportError(
  file: File,
  error: Error,
  messageService: MessageService,
  languageService: LanguageService
) {
  const errMapping = {
    "Invalid file": handleInvalidFileImportError,
    "File is too large": handleSizeFileImportError,
    "Failed to read file": handleUnreadbleFileImportError,
    "Invalid SRS definition": handleSRSImportError
  }
  errMapping[error.message](file, error, messageService, languageService);
}

export function handleInvalidFileImportError(
  file: File,
  error: Error,
  messageService: MessageService,
  languageService: LanguageService
) {
  const translate = languageService.translate;
  const title = translate.instant('igo.geo.dropGeoFile.invalid.title');
  const message = translate.instant('igo.geo.dropGeoFile.invalid.text', {
      value: file.name,
      mimeType: file.type
  });
  messageService.error(message, title);
}

export function handleUnreadbleFileImportError(
  file: File,
  error: Error,
  messageService: MessageService,
  languageService: LanguageService
) {
  const translate = languageService.translate;
  const title = translate.instant('igo.geo.dropGeoFile.unreadable.title');
  const message = translate.instant('igo.geo.dropGeoFile.unreadable.text', {
      value: file.name
  });
  messageService.error(message, title);
}

export function handleSizeFileImportError(
  file: File,
  error: Error,
  messageService: MessageService,
  languageService: LanguageService
) {
  const translate = languageService.translate;
  const title = translate.instant('igo.geo.dropGeoFile.tooLarge.title');
  const message = translate.instant('igo.geo.dropGeoFile.tooLarge.text', {
      value: file.name
  });
  messageService.error(message, title);
}

export function handleNothingToImportError(
  file: File,
  messageService: MessageService,
  languageService: LanguageService
) {
  const translate = languageService.translate;
  const title = translate.instant('igo.geo.dropGeoFile.empty.title');
  const message = translate.instant('igo.geo.dropGeoFile.empty.text', {
      value: file.name,
      mimeType: file.type
  });
  messageService.error(message, title);
}

export function handleSRSImportError(
  file: File,
  messageService: MessageService,
  languageService: LanguageService
) {
  const translate = languageService.translate;
  const title = translate.instant('igo.geo.dropGeoFile.invalidSRS.title');
  const message = translate.instant('igo.geo.dropGeoFile.invalidSRS.text', {
      value: file.name,
      mimeType: file.type
  });
  messageService.error(message, title);
}

export function getFileExtension(file: File): string {
  return file.name.split('.').pop().toLowerCase();
}

export function computeLayerTitleFromFile(file: File): string {
  return file.name.substr(0, file.name.lastIndexOf('.'));
}
