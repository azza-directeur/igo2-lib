import { Injectable } from '@angular/core';
import { Observable, zip } from 'rxjs';
import { DBRegion, GeoDataDBService, RegionDBService } from '../storage';
import { TileDownloaderService } from './tile-downloader.service';
// need to make region db
// need to ajust download method of TileDownloaderService
// need to create regionDBService
// need to create geodata-db delete method
// need to create geodata-db deleteRegion by id or name wtv method

interface TileToDownload {
  url: string;
  coord: [number, number, number];
  templateUrl: string;
  tileGrid;
}

@Injectable({
  providedIn: 'root'
})
export class DownloadRegionService {
  constructor(
    private tileDownloader: TileDownloaderService,
    private tileDB: GeoDataDBService,
    private regionDB: RegionDBService
  ) { }
  // need on right click method for the controler
  public downloadSelectedRegion(
    tilesToDownload: TileToDownload[],
    regionName: string,
    depth: number
  ) {
    const parentUrls = tilesToDownload.map((item: TileToDownload) => {
      return item.url;
    });

    const numberOfTiles = this.tileDownloader.numberOfTiles(depth) * tilesToDownload.length;
    this.regionDB.add({name: regionName, parentUrls, numberOfTiles})
      .subscribe((regionID: number) => {
        console.log("done adding regionId: ", regionID);
        for (let tile of tilesToDownload) {
           // need to change tileDonwloader download method
          this.tileDownloader.downloadFromCoord(
            tile.coord, 
            regionID, 
            depth, 
            tile.tileGrid, 
            tile.templateUrl
          );
        }
      });
    
  }

  public addToSelectedRegion(parentCoords: [number, number, number]) {
    // const url = generateUrl
    //
  }

  public updateRegion(name: string) {
    // get region in db
  }

  private getRegionsName() {
    // get all regions names in db
  }

  public createRegion(name: string) {
    // this.selectedRegion = new Region

  }

  public deleteRegion(region: DBRegion): Observable<[boolean, boolean]> {
    const regionDBRequest = this.regionDB.delete(region);
    const tileDBRequest = this.tileDB.deleteByRegionID(region.id);
    return zip(regionDBRequest, tileDBRequest);
  }
}
