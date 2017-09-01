
namespace Game {

    export class TaskEnvironment {

        render: WebGLRender = null;
        animationSolver: AnimationSolver = null;
        renderObjectManager: RenderObjectManager = null;
        taskManager: Game.TaskManager = null;

        globalAnimationTime = 0.0;
        globalAnimationTimeElapsed = 0.0;
    }
}