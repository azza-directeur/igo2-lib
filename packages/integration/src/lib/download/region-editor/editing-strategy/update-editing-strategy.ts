import { DownloadRegionService, RegionDBData, RegionUpdateParams } from '@igo2/geo';
import { EditedRegion } from '../region-editor.state';
import { EditionStrategy } from './edition-strategy';


export class UpdateEditionStrategy extends EditionStrategy {

    constructor(readonly regionToUpdate: RegionDBData) {
        super();
    }

    get downloadButtonTitle(): string {
        return 'igo.integration.download.regionEditor.buttons.update';
    }

    download(editedRegion: EditedRegion, regionDownloader: DownloadRegionService) {
        const updateParams: RegionUpdateParams = {
            name: editedRegion.name,
            newTiles: editedRegion.tiles,
            tileGrid: editedRegion.tileGrid,
            templateUrl: editedRegion.templateUrl
        };
        regionDownloader.updateRegion(this.regionToUpdate, updateParams);
    }

    cancelDownload(regionDownloader: DownloadRegionService) {
        regionDownloader.cancelRegionUpdate();
    }

    get enableGenEdition() {
        return false;
    }
}
