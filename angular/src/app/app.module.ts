import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { BitmovinPlayerComponent } from './bitmovin-player/bitmovin-player.component';

@NgModule({
  declarations: [
    AppComponent,
    BitmovinPlayerComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
