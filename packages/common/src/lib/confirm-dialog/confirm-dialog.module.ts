import { NgModule, ModuleWithProviders } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';

import { IgoLanguageModule } from '@igo2/core';

import { ConfirmDialogComponent } from './confirm-dialog.component';
import { ConfirmDialogService } from './confirm-dialog.service';

@NgModule({
  imports: [MatButtonModule, MatDialogModule, IgoLanguageModule],
  declarations: [ConfirmDialogComponent],
  exports: [ConfirmDialogComponent],
  providers: [ConfirmDialogService],
  entryComponents: [ConfirmDialogComponent]
})
export class IgoConfirmDialogModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: IgoConfirmDialogModule,
      providers: []
    };
  }
}
