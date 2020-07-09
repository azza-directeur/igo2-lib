import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

import { CollapsibleComponent } from './collapsible.component';
import { CollapseDirective } from './collapse.directive';

describe('CollapsibleComponent', () => {
  let component: CollapsibleComponent;
  let fixture: ComponentFixture<CollapsibleComponent>;

  beforeEach(
    async(() => {
      TestBed.configureTestingModule({
        imports: [MatListModule, MatIconModule],
        declarations: [CollapsibleComponent, CollapseDirective]
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(CollapsibleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
