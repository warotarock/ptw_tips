
module Game {

    // Task base class

    export enum TaskState {

        created,
        Active,
        WaitingForDestroy,
    }

    export class TaskClass implements IRecyclableObject {

        recycleIndex: int;
        recycle() {

            // override method
        }

        recyclePool: ITaskRecyclePool = null;

        state: TaskState = TaskState.created;

        onCreate(env: Game.TaskEnvironment) {
        }

        onDestroy(env: Game.TaskEnvironment) {
        }

        run(env: Game.TaskEnvironment) {
        }

        onBeforeRendering(env: Game.TaskEnvironment) {
        }

        onSampleEvent1(env: Game.TaskEnvironment) {
        }

        onSampleEvent2(env: Game.TaskEnvironment) {
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

    // Recycling management

    interface ITaskRecyclePool {
        reset();
        getCount(): int;
        getAt(index: int): TaskClass;
        recycle(obj: TaskClass);
    }

    class ClassRecyclePoolRegistry {

        recyclePool: ITaskRecyclePool;
        name: string;

        constructor(pool: ITaskRecyclePool, name: string) {
            this.recyclePool = pool;
            this.name = name;
        }
    }

    var g_RecyclePoolRegistryList = new List<ClassRecyclePoolRegistry>();

    export class TaskRecyclePool<T extends TaskClass> extends RecyclePool<T> implements ITaskRecyclePool {

        name: string;
        registry: ClassRecyclePoolRegistry;

        constructor(protected ObjectType, poolSize: int, name: string) {
            super(ObjectType, poolSize);

            this.name = name;

            if (!StringIsNullOrEmpty(name)) {
                this.registry = new ClassRecyclePoolRegistry(this, name);
                g_RecyclePoolRegistryList.push(this.registry);
            }
            else {
                this.registry = null;
            }
        }

        unregister() {

            if (this.registry == null) {
                return;
            }

            for (var i = 0; i < g_RecyclePoolRegistryList.length; i++) {
                if (g_RecyclePoolRegistryList[i] === this.registry) {

                    ListRemoveAt(g_RecyclePoolRegistryList, i);
                    break;
                }
            }
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

            for (var i = 0; i < g_RecyclePoolRegistryList.length; i++) {
                var poolReg = g_RecyclePoolRegistryList[i];

                poolReg.recyclePool.reset();
            }
        }

        addTask(task: TaskClass): TaskClass {

            task.state = TaskState.created;

            this.tasks.push(task);

            task.onCreate(this.environment);

            return task;
        }

        addTaskToGroup(task: TaskClass, taskGroupID: Game.TaskGroupID): TaskClass {

            var taskGroup = this.taskGroups[<int>taskGroupID];

            taskGroup.add(task);

            return task;
        }

        destroyTask(task: TaskClass) {

            task.state = TaskState.WaitingForDestroy;
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

        updateTaskState() {

            for (var i = 0; i < this.tasks.length; i++) {
                var task = this.tasks[i];

                if (task.state == TaskState.created) {

                    task.state = TaskState.Active;
                }
            }
        }

        executeDestroyTask() {

            for (var i = this.tasks.length - 1; i >= 0; i--) {
                var task = this.tasks[i];

                if (task.state == TaskState.WaitingForDestroy) {

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

                if (task.state == TaskState.Active) {

                    task.run(this.environment);
                }
            }
        }

        runTasks_onBeforeRendering() {

            for (var i = this.tasks.length - 1; i >= 0; i--) {
                var task = this.tasks[i];

                if (task.state == TaskState.Active) {

                    task.onBeforeRendering(this.environment);
                }
            }
        }

        runTasks_OnSampleEvent1() {

            for (var i = this.tasks.length - 1; i >= 0; i--) {
                var task = this.tasks[i];

                if (task.state == TaskState.Active) {

                    task.onSampleEvent1(this.environment);
                }
            }
        }

        runTasks_OnSampleEvent2() {

            for (var i = this.tasks.length - 1; i >= 0; i--) {
                var task = this.tasks[i];

                if (task.state == TaskState.Active) {

                    task.onSampleEvent2(this.environment);
                }
            }
        }
    }
}