import {TaskProgressDTO} from '../../../common/entities/settings/TaskProgressDTO';
import {ObjectManagers} from '../ObjectManagers';
import * as path from 'path';
import * as fs from 'fs';
import {Logger} from '../../Logger';
import {RendererInput, ThumbnailSourceType, ThumbnailWorker} from '../threading/ThumbnailWorker';
import {Config} from '../../../common/config/private/Config';
import {MediaDTO} from '../../../common/entities/MediaDTO';
import {ProjectPath} from '../../ProjectPath';
import {ThumbnailGeneratorMWs} from '../../middlewares/thumbnail/ThumbnailGeneratorMWs';
import {Task} from './Task';
import {DatabaseType} from '../../../common/config/private/IPrivateConfig';
import {ConfigTemplateEntry, DefaultsTasks} from '../../../common/entities/task/TaskDTO';

declare const global: any;
const LOG_TAG = '[IndexingTask]';

export class IndexingTask extends Task<{ createThumbnails: boolean }> {
  public readonly Name = DefaultsTasks[DefaultsTasks.Indexing];
  directoriesToIndex: string[] = [];
  public readonly ConfigTemplate: ConfigTemplateEntry[] = [{
    id: 'createThumbnails',
    type: 'boolean',
    name: 'With thumbnails',
    defaultValue: false
  }];

  public get Supported(): boolean {
    return Config.Server.database.type !== DatabaseType.memory;
  }

  protected async init() {
    this.directoriesToIndex.push('/');
  }

  protected async step(): Promise<TaskProgressDTO> {
    if (this.directoriesToIndex.length === 0) {
      if (global.gc) {
        global.gc();
      }
      return null;
    }
    const directory = this.directoriesToIndex.shift();
    this.progress.comment = directory;
    this.progress.left = this.directoriesToIndex.length;
    const scanned = await ObjectManagers.getInstance().IndexingManager.indexDirectory(directory);
    if (this.running === false) {
      return null;
    }
    this.progress.progress++;
    this.progress.time.current = Date.now();
    for (let i = 0; i < scanned.directories.length; i++) {
      this.directoriesToIndex.push(path.join(scanned.directories[i].path, scanned.directories[i].name));
    }
    if (this.config.createThumbnails) {
      for (let i = 0; i < scanned.media.length; i++) {
        try {
          const media = scanned.media[i];
          const mPath = path.join(ProjectPath.ImageFolder, media.directory.path, media.directory.name, media.name);
          const thPath = path.join(ProjectPath.ThumbnailFolder,
            ThumbnailGeneratorMWs.generateThumbnailName(mPath, Config.Client.Thumbnail.thumbnailSizes[0]));
          if (fs.existsSync(thPath)) { // skip existing thumbnails
            continue;
          }
          await ThumbnailWorker.render(<RendererInput>{
            type: MediaDTO.isVideo(media) ? ThumbnailSourceType.Video : ThumbnailSourceType.Image,
            mediaPath: mPath,
            size: Config.Client.Thumbnail.thumbnailSizes[0],
            thPath: thPath,
            makeSquare: false,
            qualityPriority: Config.Server.thumbnail.qualityPriority
          }, Config.Server.thumbnail.processingLibrary);
        } catch (e) {
          console.error(e);
          Logger.error(LOG_TAG, 'Error during indexing job: ' + e.toString());
        }
      }

    }
    return this.progress;
  }


}
