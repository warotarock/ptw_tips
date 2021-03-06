
namespace Game {

    export enum ResourceLoadingstate {
        none = 0,
        waitingLoading = 1,
        loading = 2,
        waitingFinishing = 3,
        finished = 4,
    }

    export class ResourceItem {

        loadingWeight = 1.0;
        isUsed = false;
        loadingState: ResourceLoadingstate = ResourceLoadingstate.none;
    }

    export class ResourceItemLoadingSetting {

        resourceItem: ResourceItem;
    }

    export class ResourceItemLoadingSettingSet {

        settings = new List<ResourceItemLoadingSetting>();

        add(resourceItem: ResourceItem): ResourceItemLoadingSettingSet  {

            let setting = new ResourceItemLoadingSetting();
            setting.resourceItem = resourceItem;

            this.settings.push(setting);

            return this;
        }
    }

    export interface IResourceLoader {

        resetLoadingTargetFlags();

        setLoadingTargetFlags(loadingSettingSet: ResourceItemLoadingSettingSet);

        startLoading();

        processLoading(): boolean;

        getLoadingWeightTotal(): float;

        getLoadedWeightTotal(): float;

        unloadUnusedResources();
    }

    export class ResourceLoader<T extends ResourceItem> implements IResourceLoader {

        maxParallelLoadingCount = 1;

        private resourceItems = new List<T>();

        private waitingResourceItems: List<T> = null;
        private loadingResourceItems: List<T> = null;
        private finishedResourceItems: List<T> = null;

        addResourceItems(resourceItems: List<T>) {

            for (let resourceItem of resourceItems) {

                if (resourceItem == null || resourceItem == undefined) {
                    continue;
                }

                this.resourceItems.push(resourceItem);
            }
        }

        resetLoadingTargetFlags() {

            for (let resourceItem of this.resourceItems) {

                resourceItem.isUsed = false;
            }
        }

        setLoadingTargetFlags(loadingSettingSet: ResourceItemLoadingSettingSet) {

            for (let setting of loadingSettingSet.settings) {

                setting.resourceItem.isUsed = true;
            }
        }

        startLoading() {

            this.waitingResourceItems = new List<T>();
            this.loadingResourceItems = new List<T>();
            this.finishedResourceItems = new List<T>();

            for (let resourceItem of this.resourceItems) {

                if (resourceItem.isUsed && resourceItem.loadingState == ResourceLoadingstate.none) {

                    resourceItem.loadingState = ResourceLoadingstate.waitingLoading;

                    this.waitingResourceItems.push(resourceItem);
                }
            }
        }

        processLoading(): boolean {

            // Move waiting item to loading list
            if (this.waitingResourceItems.length > 0
                && this.loadingResourceItems.length < this.maxParallelLoadingCount) {

                let resourceItem = this.waitingResourceItems[0];

                resourceItem.loadingState = ResourceLoadingstate.loading;

                this.startLoadingResourceItem(resourceItem);

                ListRemoveAt(this.waitingResourceItems, 0);
                this.loadingResourceItems.push(resourceItem);
            }

            // Check loading items end
            for (let i = this.loadingResourceItems.length - 1; i >= 0; i--) {
                let resourceItem = this.loadingResourceItems[i];

                if (resourceItem.loadingState == ResourceLoadingstate.waitingFinishing) {

                    resourceItem.loadingState = ResourceLoadingstate.finished;

                    ListRemoveAt(this.loadingResourceItems, 0);
                    this.finishedResourceItems.push(resourceItem);
                }
            }

            // If all is done, exit loading
            if (this.waitingResourceItems.length == 0
                && this.loadingResourceItems.length == 0) {

                return false;
            }
            else {
                return true;

            }
        }

        protected startLoadingResourceItem(resourceItem: T) {

            // Override method

            // Must call endLoadingResourceItem at end of this method
        }

        protected endLoadingResourceItem(resourceItem: T) {

            resourceItem.loadingState = ResourceLoadingstate.waitingFinishing;
        }

        getLoadingWeightTotal(): float {

            let sumOfWeight = 0.0;

            for (let resourceItem of this.loadingResourceItems) {

                sumOfWeight += resourceItem.loadingWeight;
            }

            for (let resourceItem of this.waitingResourceItems) {

                sumOfWeight += resourceItem.loadingWeight;
            }

            sumOfWeight += this.getLoadedWeightTotal();

            return sumOfWeight;
        }

        getLoadedWeightTotal(): float {

            let sumOfWeight = 0.0;

            for (let resourceItem of this.finishedResourceItems) {

                sumOfWeight += resourceItem.loadingWeight;
            }

            return sumOfWeight;
        }

        unloadUnusedResources() {

            for (let resourceItem of this.resourceItems) {

                if (!resourceItem.isUsed && resourceItem.loadingState == Game.ResourceLoadingstate.finished) {

                    this.unloadResource(resourceItem);

                    resourceItem.loadingState = Game.ResourceLoadingstate.none;
                }
            }

        }

        protected unloadResource(resourceItem: T) {

            // Override method
        }
    }

    export class ResourceManager {

        private loaders = new List<IResourceLoader>();

        private loadingLoaderProgressCount = 0;

        // Loading process

        addLoader(loader: IResourceLoader) {

            this.loaders.push(loader);
        }

        resetLoadingTargets() {

            for (let loader of this.loaders) {

                loader.resetLoadingTargetFlags();
            }
        }

        addLoadingTarget(loadingSettingSet: ResourceItemLoadingSettingSet) {

            for (let loader of this.loaders) {

                loader.setLoadingTargetFlags(loadingSettingSet);
            }
        }

        startLoading() {

            this.loadingLoaderProgressCount = 0;

            for (let loader of this.loaders) {

                loader.startLoading();
            }
        }

        processLoading(): boolean {

            if (this.loadingLoaderProgressCount >= this.loaders.length) {
                return false;
            }

            let loader = this.loaders[this.loadingLoaderProgressCount];

            if (loader.processLoading()) {

                return true;
            }
            else {

                this.loadingLoaderProgressCount++;

                if (this.loadingLoaderProgressCount >= this.loaders.length) {

                    return false;
                }
                else {

                    return true;
                }
            }
        }

        getLoadingProgress(): float {

            let sumOfLoading = 0.0;
            let sumOfLoaded = 0.0;

            for (let loader of this.loaders) {

                sumOfLoading += loader.getLoadingWeightTotal();
                sumOfLoaded += loader.getLoadedWeightTotal();
            }

            if (sumOfLoading == 0.0) {

                return -1.0;
            }
            else {

                return sumOfLoaded / sumOfLoading;
            }
        }

        unloadUnusedResources() {

            for (let loader of this.loaders) {

                loader.unloadUnusedResources();
            }
        }
    }
}