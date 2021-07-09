import { AfterViewInit, Component, Input, OnInit, Output, ViewChild } from '@angular/core';
import { MatSlider } from '@angular/material/slider';
import { EventEmitter } from '@angular/core';
import { TransitionCheckState } from '@angular/material/checkbox';
import { SliderGenerationParams, TileGenerationSliderComponent } from '../tile-generation-slider.component';



@Component({
  selector: 'igo-parent-tile-gen-slider',
  templateUrl: './parent-tile-gen-slider.component.html',
  styleUrls: ['./parent-tile-gen-slider.component.scss']
})
export class ParentTileGenSliderComponent extends TileGenerationSliderComponent implements OnInit, AfterViewInit  {
  // @Output() onValueChange: EventEmitter<any>= new EventEmitter();
  
  // @Input('disabled') disabled: boolean = false;
  // @Input('parentLevel') parentLevel: number;

  @ViewChild('depthSlider') slider: MatSlider;

  _sliderValue: number = 0;
  
  protected get endLevel(): number {
    return this._sliderValue + this.parentLevel;
  }

  protected get startLevel(): number {
    return this.parentLevel;
  }

  get value(): SliderGenerationParams {
    return {
      startLevel: this.startLevel,
      endLevel: this.endLevel
    }
  }

  get depth() {
    return this._sliderValue;
  }

  constructor() {
    super()
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
    this.slider.value = this._sliderValue;
  }

  onSliderChange() {
    this._sliderValue = this.slider.value;
    this.emitValue();
  }
}
