var Game;
(function (Game) {
    var TaskEnvironment = (function () {
        function TaskEnvironment() {
            this.render = null;
            this.animationSolver = null;
            this.renderObjectManager = null;
            this.taskManager = null;
            this.globalAnimationTime = 0.0;
            this.globalAnimationTimeElapsed = 0.0;
        }
        return TaskEnvironment;
    }());
    Game.TaskEnvironment = TaskEnvironment;
})(Game || (Game = {}));
