
namespace Game {

    export class ImageResource extends Game.ResourceItem {

        filePath: string = null;
        mipmapEnabled = false;

        image: RenderImage = null;

        path(filePath: string): ImageResource {

            this.filePath = filePath;
            return this;
        }

        mipmap(enable: boolean): ImageResource {

            this.mipmapEnabled = enable;
            return this;
        }
    }

    export class ModelResource extends Game.ResourceItem {

        filePath: string;

        model: RenderModel = null;
        images: List<RenderImage> = null;

        path(filePath: string): ModelResource {

            this.filePath = filePath;

            return this;
        }
    }
}
