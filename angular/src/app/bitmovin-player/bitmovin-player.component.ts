import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { Player } from 'bitmovin-player';
import { UIFactory } from 'bitmovin-player/bitmovinplayer-ui';

@Component({
  selector: 'app-bitmovin-player',
  templateUrl: './bitmovin-player.component.html',
  styleUrls: ['./bitmovin-player.component.css']
})
export class BitmovinPlayerComponent implements AfterViewInit {
  @ViewChild('player') playerElement;

  player; playerConfig;

  constructor() {
    this.playerConfig = {
      key: 'YOUR KEY HERE',
      ui: false
    };
  }

  ngAfterViewInit(): void {
     const playerSource = {
      dash: 'https://bitmovin-a.akamaihd.net/content/MI201109210084_1/mpds/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.mpd',
      hls: 'https://bitmovin-a.akamaihd.net/content/MI201109210084_1/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8',
      poster: 'https://bitmovin-a.akamaihd.net/content/MI201109210084_1/poster.jpg'
    };
     this.player = new Player(this.playerElement.nativeElement, this.playerConfig);
     UIFactory.buildDefaultUI(this.player);
     this.player.load(playerSource).then(() => {
      console.log('Successfully loaded source');
    }, () => {
      console.log('Error while loading source');
    });
  }

  ngDestroy(): void{
    if (this.player) {
      this.player.destroy();
    }

  }

}
