var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var Game;
(function (Game) {
    var ImageResource = (function (_super) {
        __extends(ImageResource, _super);
        function ImageResource() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.filePath = null;
            _this.mipmapEnabled = false;
            _this.image = null;
            return _this;
        }
        ImageResource.prototype.path = function (filePath) {
            this.filePath = filePath;
            return this;
        };
        ImageResource.prototype.mipmap = function (enable) {
            this.mipmapEnabled = enable;
            return this;
        };
        return ImageResource;
    }(Game.ResourceItem));
    Game.ImageResource = ImageResource;
    var ModelResource = (function (_super) {
        __extends(ModelResource, _super);
        function ModelResource() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.model = null;
            _this.images = null;
            return _this;
        }
        ModelResource.prototype.path = function (filePath) {
            this.filePath = filePath;
            return this;
        };
        return ModelResource;
    }(Game.ResourceItem));
    Game.ModelResource = ModelResource;
})(Game || (Game = {}));
