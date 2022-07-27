import { Component, Inject, Input } from '@angular/core';
import { LanguageService } from '@igo2/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GeometryType, LabelType } from '../shared/draw.enum';
import { transform } from 'ol/proj';
import { IgoMap } from '../../map/shared';
import OlFeature from 'ol/Feature';
import {
  measureOlGeometryLength,
  measureOlGeometryArea,
  metersToUnit,
  squareMetersToUnit
} from '../../measure/shared/measure.utils';
import {
  MeasureLengthUnit,
  MeasureLengthUnitAbbreviation,
  MeasureAreaUnit,
  MeasureAreaUnitAbbreviation,
} from '../../measure/shared/measure.enum';

export interface DialogData {
  label: string;
}

@Component({
  selector: 'igo-draw-popup-component',
  templateUrl: './draw-popup.component.html',
  styleUrls: ['./draw-popup.component.scss']
  })
export class DrawPopupComponent {
  @Input() confirmFlag: boolean = false;
  @Input() labelFlag: LabelType = LabelType.Predefined;
  @Input() measureUnit: MeasureLengthUnit | MeasureAreaUnit;

  public geometryType = GeometryType;
  public labelType = LabelType;
  public currentLabel: string;
  public coordinates: string;
  public olGeometryType: GeometryType = undefined;
  public lengthInMeters: string;
  public currentLength: string;
  public areaInMetersSquare: string;
  public currentArea: string;

  constructor(
    private languageService: LanguageService,
    public dialogRef: MatDialogRef<DrawPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { olGeometry: any, map: IgoMap }
    ){
      this.currentLabel = this.data.olGeometry.get('draw');
      if (this.data.olGeometry instanceof OlFeature){
        this.olGeometryType = this.data.olGeometry.getGeometry().getType();
        this.coordinates = '(' + this.data.olGeometry.get('latitude').toFixed(4) + ', '
          + this.data.olGeometry.get('longitude').toFixed(4) + ')';
      }
      else{
        this.olGeometryType = this.data.olGeometry.getType();
        if(this.olGeometryType === GeometryType.Point || this.olGeometryType === GeometryType.Circle){
          const projection = this.data.map.ol.getView().getProjection();
          let point4326 = transform(
            this.data.olGeometry.getFlatCoordinates(),
            projection,
            'EPSG:4326'
          );
          this.coordinates =
            '(' + point4326[1].toFixed(4) + ', ' + point4326[0].toFixed(4) + ')';
        }
        else if (this.olGeometryType === GeometryType.LineString){
          this.lengthInMeters = measureOlGeometryLength(this.data.olGeometry, this.data.map.ol.getView().getProjection().getCode()).toFixed(2).toString();
          this.currentLength = this.lengthInMeters;
        }
        else if (this.olGeometryType === GeometryType.Polygon){
          this.lengthInMeters = measureOlGeometryLength(this.data.olGeometry, this.data.map.ol.getView().getProjection().getCode()).toFixed(2).toString();
          this.currentLength = this.lengthInMeters;
          this.areaInMetersSquare = measureOlGeometryArea(this.data.olGeometry,this.data.map.ol.getView().getProjection().getCode()).toFixed(2).toString();
          this.currentArea = this.areaInMetersSquare;
        }

      }
    }
  cancelDrawing() {
    this.dialogRef.close();
  }
  confirm(input?: string) {
    this.confirmFlag = true;
    if(this.labelFlag === LabelType.Predefined){
      this.dialogRef.close();
    }
    else if(this.labelFlag === LabelType.Coordinates){
      this.dialogRef.close(this.coordinates);
    }
    else if (this.labelFlag === LabelType.Length){
      this.dialogRef.close(this.currentLength + ' ' + MeasureLengthUnitAbbreviation[this.measureUnit]);
    }
    else if (this.labelFlag === LabelType.Area){
      this.dialogRef.close(this.currentArea + ' ' + MeasureAreaUnitAbbreviation[this.measureUnit]);
    }
    else if (this.labelFlag === LabelType.Custom){
      this.dialogRef.close(input);
    }
  }
  onLabelTypeChange(labelType: LabelType){
    this.labelFlag = labelType;
    if (labelType === LabelType.Area){
      this.measureUnit = MeasureAreaUnit.SquareMeters;
    }
    else{
      this.measureUnit = MeasureLengthUnit.Meters;
    }
  }
  getLabel(){
    if (this.labelFlag === LabelType.Predefined){
      return this.coordinates;
    }
    else if (this.labelFlag === LabelType.Length){
      return this.currentLength;
    }
    else if (this.labelFlag === LabelType.Area){
      return this.currentArea;
    }
    else{
      return this.currentLabel? this.currentLabel: '';
    }
  }

  get arrayBuiltInType(): string[]{
    let arrayBILabels = [];
    for (const labelType of Object.values(LabelType)){
      if (labelType !== LabelType.Custom && labelType !== LabelType.Predefined){
        arrayBILabels.push(labelType);
      }
    }
    return arrayBILabels;
  }

  noLabelButton(){
    if (this.labelFlag === LabelType.Predefined){
      return this.languageService.translate.instant('igo.geo.draw.noLabel');
    }
    return 'OK';
  }

  optionAvailable(currentOption: LabelType){
    switch(this.olGeometryType){
      case GeometryType.Point:
        if (currentOption === LabelType.Coordinates){
          return false;
        }
        return true;
      case GeometryType.LineString:
        if (currentOption === LabelType.Length){
          return false;
        }
        return true;
      case GeometryType.Polygon:
        if (currentOption === LabelType.Coordinates){
          return true;
        }
        return false;
      default:
        return false;
    }
  }


  onChangeLengthUnit(lengthUnit: MeasureLengthUnit){
    this.measureUnit = lengthUnit;
    this.currentLength = metersToUnit(Number(this.lengthInMeters), lengthUnit).toFixed(2).toString();
  }

  onChangeAreaUnit(areaUnit: MeasureAreaUnit){
    this.measureUnit = areaUnit;
    this.currentArea = squareMetersToUnit(Number(this.areaInMetersSquare), areaUnit).toFixed(2).toString();
  }

  get allLengthUnits(): string[]{
    return Object.values(MeasureLengthUnit);
  }

  getLengthUnitEnum(lengthUnit: MeasureLengthUnit){
    return MeasureLengthUnitAbbreviation[lengthUnit];
  }

  get allAreaUnits(): string[]{
    return Object.values(MeasureAreaUnit);
  }

  getAreaUnitEnum(areaUnit: MeasureAreaUnit){
    return MeasureAreaUnitAbbreviation[areaUnit];
  }

}
