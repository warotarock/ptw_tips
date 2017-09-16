var Game;
(function (Game) {
    var ResourceLoadingstate;
    (function (ResourceLoadingstate) {
        ResourceLoadingstate[ResourceLoadingstate["none"] = 0] = "none";
        ResourceLoadingstate[ResourceLoadingstate["waitingLoading"] = 1] = "waitingLoading";
        ResourceLoadingstate[ResourceLoadingstate["loading"] = 2] = "loading";
        ResourceLoadingstate[ResourceLoadingstate["waitingFinishing"] = 3] = "waitingFinishing";
        ResourceLoadingstate[ResourceLoadingstate["finished"] = 4] = "finished";
    })(ResourceLoadingstate = Game.ResourceLoadingstate || (Game.ResourceLoadingstate = {}));
    var ResourceItem = (function () {
        function ResourceItem() {
            this.loadingWeight = 1.0;
            this.isUsed = false;
            this.loadingState = ResourceLoadingstate.none;
        }
        return ResourceItem;
    }());
    Game.ResourceItem = ResourceItem;
    var ResourceItemLoadingSetting = (function () {
        function ResourceItemLoadingSetting() {
        }
        return ResourceItemLoadingSetting;
    }());
    Game.ResourceItemLoadingSetting = ResourceItemLoadingSetting;
    var ResourceItemLoadingSettingSet = (function () {
        function ResourceItemLoadingSettingSet() {
            this.settings = new List();
        }
        ResourceItemLoadingSettingSet.prototype.add = function (resourceItem) {
            var setting = new ResourceItemLoadingSetting();
            setting.resourceItem = resourceItem;
            this.settings.push(setting);
            return this;
        };
        return ResourceItemLoadingSettingSet;
    }());
    Game.ResourceItemLoadingSettingSet = ResourceItemLoadingSettingSet;
    var ResourceLoader = (function () {
        function ResourceLoader() {
            this.maxParallelLoadingCount = 1;
            this.resourceItems = new List();
            this.waitingResourceItems = null;
            this.loadingResourceItems = null;
            this.finishedResourceItems = null;
        }
        ResourceLoader.prototype.addResourceItems = function (resourceItems) {
            for (var i = 0; i < resourceItems.length; i++) {
                var resourceItem = resourceItems[i];
                if (resourceItem == null || resourceItem == undefined) {
                    continue;
                }
                this.resourceItems.push(resourceItem);
            }
        };
        ResourceLoader.prototype.resetLoadingTargetFlags = function () {
            for (var i = 0; i < this.resourceItems.length; i++) {
                var resourceItem = this.resourceItems[i];
                resourceItem.isUsed = false;
            }
        };
        ResourceLoader.prototype.setLoadingTargetFlags = function (loadingSettingSet) {
            for (var i = 0; i < loadingSettingSet.settings.length; i++) {
                var setting = loadingSettingSet.settings[i];
                setting.resourceItem.isUsed = true;
            }
        };
        ResourceLoader.prototype.startLoading = function () {
            this.waitingResourceItems = new List();
            this.loadingResourceItems = new List();
            this.finishedResourceItems = new List();
            for (var i = 0; i < this.resourceItems.length; i++) {
                var resourceItem = this.resourceItems[i];
                if (resourceItem.isUsed && resourceItem.loadingState == ResourceLoadingstate.none) {
                    resourceItem.loadingState = ResourceLoadingstate.waitingLoading;
                    this.waitingResourceItems.push(resourceItem);
                }
            }
        };
        ResourceLoader.prototype.processLoading = function () {
            // Move waiting item to loading list
            if (this.waitingResourceItems.length > 0
                && this.loadingResourceItems.length < this.maxParallelLoadingCount) {
                var resourceItem = this.waitingResourceItems[0];
                resourceItem.loadingState = ResourceLoadingstate.loading;
                this.startLoadingResourceItem(resourceItem);
                ListRemoveAt(this.waitingResourceItems, 0);
                this.loadingResourceItems.push(resourceItem);
            }
            // Check loading items end
            for (var i = this.loadingResourceItems.length - 1; i >= 0; i--) {
                var resourceItem = this.loadingResourceItems[i];
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
        };
        ResourceLoader.prototype.startLoadingResourceItem = function (resourceItem) {
            // Override method
            // Must call endLoadingResourceItem at end of this method
        };
        ResourceLoader.prototype.endLoadingResourceItem = function (resourceItem) {
            resourceItem.loadingState = ResourceLoadingstate.waitingFinishing;
        };
        ResourceLoader.prototype.getLoadingWeightTotal = function () {
            var sumOfWeight = 0.0;
            for (var i = 0; i < this.loadingResourceItems.length; i++) {
                var resourceItem = this.loadingResourceItems[i];
                sumOfWeight += resourceItem.loadingWeight;
            }
            for (var i = 0; i < this.waitingResourceItems.length; i++) {
                var resourceItem = this.waitingResourceItems[i];
                sumOfWeight += resourceItem.loadingWeight;
            }
            sumOfWeight += this.getLoadedWeightTotal();
            return sumOfWeight;
        };
        ResourceLoader.prototype.getLoadedWeightTotal = function () {
            var sumOfWeight = 0.0;
            for (var i = 0; i < this.finishedResourceItems.length; i++) {
                var resourceItem = this.finishedResourceItems[i];
                sumOfWeight += resourceItem.loadingWeight;
            }
            return sumOfWeight;
        };
        ResourceLoader.prototype.unloadUnusedResources = function () {
            for (var i = 0; i < this.resourceItems.length; i++) {
                var resourceItem = this.resourceItems[i];
                if (!resourceItem.isUsed && resourceItem.loadingState == Game.ResourceLoadingstate.finished) {
                    this.unloadResource(resourceItem);
                    resourceItem.loadingState = Game.ResourceLoadingstate.none;
                }
            }
        };
        ResourceLoader.prototype.unloadResource = function (resourceItem) {
            // Override method
        };
        return ResourceLoader;
    }());
    Game.ResourceLoader = ResourceLoader;
    var ResourceManager = (function () {
        function ResourceManager() {
            this.loaders = new List();
            this.loadingLoaderProgressCount = 0;
        }
        // Loading process
        ResourceManager.prototype.addLoader = function (loader) {
            this.loaders.push(loader);
        };
        ResourceManager.prototype.resetLoadingTargets = function () {
            for (var i = 0; i < this.loaders.length; i++) {
                var loader = this.loaders[i];
                loader.resetLoadingTargetFlags();
            }
        };
        ResourceManager.prototype.addLoadingTarget = function (loadingSettingSet) {
            for (var i = 0; i < this.loaders.length; i++) {
                var loader = this.loaders[i];
                loader.setLoadingTargetFlags(loadingSettingSet);
            }
        };
        ResourceManager.prototype.startLoading = function () {
            this.loadingLoaderProgressCount = 0;
            for (var i = 0; i < this.loaders.length; i++) {
                var loader = this.loaders[i];
                loader.startLoading();
            }
        };
        ResourceManager.prototype.processLoading = function () {
            if (this.loadingLoaderProgressCount >= this.loaders.length) {
                return false;
            }
            var loader = this.loaders[this.loadingLoaderProgressCount];
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
        };
        ResourceManager.prototype.getLoadingProgress = function () {
            var sumOfLoading = 0.0;
            var sumOfLoaded = 0.0;
            for (var i = 0; i < this.loaders.length; i++) {
                var loader = this.loaders[i];
                sumOfLoading += loader.getLoadingWeightTotal();
                sumOfLoaded += loader.getLoadedWeightTotal();
            }
            if (sumOfLoading == 0.0) {
                return -1.0;
            }
            else {
                return sumOfLoaded / sumOfLoading;
            }
        };
        ResourceManager.prototype.unloadUnusedResources = function () {
            for (var i = 0; i < this.loaders.length; i++) {
                var loader = this.loaders[i];
                loader.unloadUnusedResources();
            }
        };
        return ResourceManager;
    }());
    Game.ResourceManager = ResourceManager;
})(Game || (Game = {}));
