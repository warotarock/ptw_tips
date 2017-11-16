
namespace Game {

    // State flags to control execution timing of event method

    export enum TaskState {

        created,
        active,
        waitingForDestroy,
    }

    // Task base class

    export class TaskClass implements IRecyclableObject {

        recycleIndex: int;
        recycle() {

            // Override method
        }

        recyclePool: ITaskRecyclePool = null;

        state: TaskState = TaskState.created;

        onCreate(env: Game.TaskEnvironment) {

            // Override method
        }

        onDestroy(env: Game.TaskEnvironment) {

            // Override method
        }

        run(env: Game.TaskEnvironment) {

            // Override method
        }

        onBeforeRendering(env: Game.TaskEnvironment) {

            // Override method
        }

        onSampleEvent1(env: Game.TaskEnvironment) {

            // Override method
        }

        onSampleEvent2(env: Game.TaskEnvironment) {

            // Override method
        }
    }

    // Task Group

    export enum TaskGroupID {

        SystemTask = 1,
        UIObject = 2,
        maxGroupCount = 2,
    }

    class TaskGroup {

        TaskList: List<TaskClass>;

        constructor() {
            this.clear();
        }

        add(task: TaskClass) {
            this.TaskList.push(task);
        }

        remove(task: TaskClass) {
            for (var i = 0; i < this.TaskList.length; i++) {
                if (this.TaskList[i] == task) {
                    ListRemoveAt(this.TaskList, i);
                    break;
                }
            }
        }

        clear() {
            this.TaskList = new List<TaskClass>();
        }
    }

    // For auto recycling tasks

    interface ITaskRecyclePool {
        reset();
        getCount(): int;
        getAt(index: int): TaskClass;
        recycle(obj: TaskClass);
    }

    export class TaskRecyclePool<T extends TaskClass> extends RecyclePool<T> implements ITaskRecyclePool {

        name: string;

        constructor(protected ObjectType, poolSize: int, name: string) {
            super(ObjectType, poolSize);

            this.name = name;
        }

        resetPool() {
            this.reset();
        }

        get(): T {

            var obj = super.get();

            if (obj != null) {
                obj.recyclePool = this;
            }

            return obj;
        }
    }

    // Manager

    export class TaskManager {

        private tasks: List<TaskClass> = new List<TaskClass>();
        private taskGroups: List<TaskGroup> = new List<TaskGroup>();

        environment: TaskEnvironment = new TaskEnvironment();

        constructor() {

            this.clearTasks();

            var maxLayer = <int>TaskGroupID.maxGroupCount;

            for (var i = 0; i <= maxLayer; i++) {

                this.taskGroups.push(new TaskGroup());
            }
        }

        // Task and group management

        clearTasks() {

            for (var i = this.tasks.length - 1; i >= 0; i--) {
                var task = this.tasks[i];

                this.deleteOrRecycleTask(task);
            }

            this.tasks = new List<TaskClass>();

            for (var i = 0; i < this.taskGroups.length; i++) {
                var taskGroup = this.taskGroups[i];

                taskGroup.clear();
            }
        }

        addTask(task: TaskClass): TaskClass {

            this.tasks.push(task);

            task.onCreate(this.environment);

            task.state = TaskState.active

            return task;
        }

        addTaskToGroup(task: TaskClass, taskGroupID: Game.TaskGroupID): TaskClass {

            var taskGroup = this.taskGroups[<int>taskGroupID];

            taskGroup.add(task);

            return task;
        }

        destroyTask(task: TaskClass) {

            task.state = TaskState.waitingForDestroy;
        }

        destroyTaskGroupTasks(taskGroupID: Game.TaskGroupID) {

            var taskGroup = this.taskGroups[<int>taskGroupID];

            for (var i = 0; i < taskGroup.TaskList.length; i++) {
                var task = taskGroup.TaskList[i];

                this.destroyTask(task);
            }
        }

        destroyTaskPoolTasks(taskPool: ITaskRecyclePool) {

            for (var i = 0; i < taskPool.getCount(); i++) {
                var task = taskPool.getAt(i);

                this.destroyTask(task);
            }
        }

        // Updating methods for all tasks for each frame execution

        executeDestroyTask() {

            for (var i = this.tasks.length - 1; i >= 0; i--) {
                var task = this.tasks[i];

                if (task.state == TaskState.waitingForDestroy) {

                    this.deleteOrRecycleTask(task);

                    ListRemoveAt(this.tasks, i);
                }
            }
        }

        private deleteOrRecycleTask(task: TaskClass) {

            task.onDestroy(this.environment);

            for (var i = 0; i < this.taskGroups.length; i++) {
                var taskGroup = this.taskGroups[i];

                taskGroup.remove(task);
            }

            if (task.recyclePool != null) {

                task.recyclePool.recycle(task);
            }
        }

        // Sample implementation of methods to execute all active tasks

        runTasks_run() {

            for (var i = this.tasks.length - 1; i >= 0; i--) {
                var task = this.tasks[i];

                if (task.state != TaskState.waitingForDestroy) {

                    task.run(this.environment);
                }
            }
        }

        runTasks_onBeforeRendering() {

            for (var i = this.tasks.length - 1; i >= 0; i--) {
                var task = this.tasks[i];

                if (task.state != TaskState.waitingForDestroy) {

                    task.onBeforeRendering(this.environment);
                }
            }
        }

        runTasks_OnSampleEvent1() {

            for (var i = this.tasks.length - 1; i >= 0; i--) {
                var task = this.tasks[i];

                if (task.state != TaskState.waitingForDestroy) {

                    task.onSampleEvent1(this.environment);
                }
            }
        }

        runTasks_OnSampleEvent2() {

            for (var i = this.tasks.length - 1; i >= 0; i--) {
                var task = this.tasks[i];

                if (task.state != TaskState.waitingForDestroy) {

                    task.onSampleEvent2(this.environment);
                }
            }
        }
    }
}