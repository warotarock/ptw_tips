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
    // Task base class
    var TaskState;
    (function (TaskState) {
        TaskState[TaskState["created"] = 0] = "created";
        TaskState[TaskState["Active"] = 1] = "Active";
        TaskState[TaskState["WaitingForDestroy"] = 2] = "WaitingForDestroy";
    })(TaskState = Game.TaskState || (Game.TaskState = {}));
    var TaskClass = (function () {
        function TaskClass() {
            this.recyclePool = null;
            this.state = TaskState.created;
        }
        TaskClass.prototype.recycle = function () {
            // override method
        };
        TaskClass.prototype.onCreate = function (env) {
        };
        TaskClass.prototype.onDestroy = function (env) {
        };
        TaskClass.prototype.run = function (env) {
        };
        TaskClass.prototype.onBeforeRendering = function (env) {
        };
        TaskClass.prototype.onSampleEvent1 = function (env) {
        };
        TaskClass.prototype.onSampleEvent2 = function (env) {
        };
        return TaskClass;
    }());
    Game.TaskClass = TaskClass;
    // Task Group
    var TaskGroupID;
    (function (TaskGroupID) {
        TaskGroupID[TaskGroupID["SystemTask"] = 1] = "SystemTask";
        TaskGroupID[TaskGroupID["UIObject"] = 2] = "UIObject";
        TaskGroupID[TaskGroupID["maxGroupCount"] = 2] = "maxGroupCount";
    })(TaskGroupID = Game.TaskGroupID || (Game.TaskGroupID = {}));
    var TaskGroup = (function () {
        function TaskGroup() {
            this.clear();
        }
        TaskGroup.prototype.add = function (task) {
            this.TaskList.push(task);
        };
        TaskGroup.prototype.remove = function (task) {
            for (var i = 0; i < this.TaskList.length; i++) {
                if (this.TaskList[i] == task) {
                    ListRemoveAt(this.TaskList, i);
                    break;
                }
            }
        };
        TaskGroup.prototype.clear = function () {
            this.TaskList = new List();
        };
        return TaskGroup;
    }());
    var ClassRecyclePoolRegistry = (function () {
        function ClassRecyclePoolRegistry(pool, name) {
            this.recyclePool = pool;
            this.name = name;
        }
        return ClassRecyclePoolRegistry;
    }());
    var g_RecyclePoolRegistryList = new List();
    var TaskRecyclePool = (function (_super) {
        __extends(TaskRecyclePool, _super);
        function TaskRecyclePool(ObjectType, poolSize, name) {
            var _this = _super.call(this, ObjectType, poolSize) || this;
            _this.ObjectType = ObjectType;
            _this.name = name;
            if (!StringIsNullOrEmpty(name)) {
                _this.registry = new ClassRecyclePoolRegistry(_this, name);
                g_RecyclePoolRegistryList.push(_this.registry);
            }
            else {
                _this.registry = null;
            }
            return _this;
        }
        TaskRecyclePool.prototype.unregister = function () {
            if (this.registry == null) {
                return;
            }
            for (var i = 0; i < g_RecyclePoolRegistryList.length; i++) {
                if (g_RecyclePoolRegistryList[i] === this.registry) {
                    ListRemoveAt(g_RecyclePoolRegistryList, i);
                    break;
                }
            }
        };
        TaskRecyclePool.prototype.resetPool = function () {
            this.reset();
        };
        TaskRecyclePool.prototype.get = function () {
            var obj = _super.prototype.get.call(this);
            if (obj != null) {
                obj.recyclePool = this;
            }
            return obj;
        };
        return TaskRecyclePool;
    }(RecyclePool));
    Game.TaskRecyclePool = TaskRecyclePool;
    // Manager
    var TaskManager = (function () {
        function TaskManager() {
            this.tasks = new List();
            this.taskGroups = new List();
            this.environment = new Game.TaskEnvironment();
            this.clearTasks();
            var maxLayer = TaskGroupID.maxGroupCount;
            for (var i = 0; i <= maxLayer; i++) {
                this.taskGroups.push(new TaskGroup());
            }
        }
        // Task and group management
        TaskManager.prototype.clearTasks = function () {
            for (var i = this.tasks.length - 1; i >= 0; i--) {
                var task = this.tasks[i];
                this.deleteOrRecycleTask(task);
            }
            this.tasks = new List();
            for (var i = 0; i < this.taskGroups.length; i++) {
                var taskGroup = this.taskGroups[i];
                taskGroup.clear();
            }
            for (var i = 0; i < g_RecyclePoolRegistryList.length; i++) {
                var poolReg = g_RecyclePoolRegistryList[i];
                poolReg.recyclePool.reset();
            }
        };
        TaskManager.prototype.addTask = function (task) {
            task.state = TaskState.created;
            this.tasks.push(task);
            task.onCreate(this.environment);
            return task;
        };
        TaskManager.prototype.addTaskToGroup = function (task, taskGroupID) {
            var taskGroup = this.taskGroups[taskGroupID];
            taskGroup.add(task);
            return task;
        };
        TaskManager.prototype.destroyTask = function (task) {
            task.state = TaskState.WaitingForDestroy;
        };
        TaskManager.prototype.destroyTaskGroupTasks = function (taskGroupID) {
            var taskGroup = this.taskGroups[taskGroupID];
            for (var i = 0; i < taskGroup.TaskList.length; i++) {
                var task = taskGroup.TaskList[i];
                this.destroyTask(task);
            }
        };
        TaskManager.prototype.destroyTaskPoolTasks = function (taskPool) {
            for (var i = 0; i < taskPool.getCount(); i++) {
                var task = taskPool.getAt(i);
                this.destroyTask(task);
            }
        };
        // Updating methods for all tasks for each frame execution
        TaskManager.prototype.updateTaskState = function () {
            for (var i = 0; i < this.tasks.length; i++) {
                var task = this.tasks[i];
                if (task.state == TaskState.created) {
                    task.state = TaskState.Active;
                }
            }
        };
        TaskManager.prototype.executeDestroyTask = function () {
            for (var i = this.tasks.length - 1; i >= 0; i--) {
                var task = this.tasks[i];
                if (task.state == TaskState.WaitingForDestroy) {
                    this.deleteOrRecycleTask(task);
                    ListRemoveAt(this.tasks, i);
                }
            }
        };
        TaskManager.prototype.deleteOrRecycleTask = function (task) {
            task.onDestroy(this.environment);
            for (var i = 0; i < this.taskGroups.length; i++) {
                var taskGroup = this.taskGroups[i];
                taskGroup.remove(task);
            }
            if (task.recyclePool != null) {
                task.recyclePool.recycle(task);
            }
        };
        // Sample implementation of methods to execute all active tasks
        TaskManager.prototype.runTasks_run = function () {
            for (var i = this.tasks.length - 1; i >= 0; i--) {
                var task = this.tasks[i];
                if (task.state == TaskState.Active) {
                    task.run(this.environment);
                }
            }
        };
        TaskManager.prototype.runTasks_onBeforeRendering = function () {
            for (var i = this.tasks.length - 1; i >= 0; i--) {
                var task = this.tasks[i];
                if (task.state == TaskState.Active) {
                    task.onBeforeRendering(this.environment);
                }
            }
        };
        TaskManager.prototype.runTasks_OnSampleEvent1 = function () {
            for (var i = this.tasks.length - 1; i >= 0; i--) {
                var task = this.tasks[i];
                if (task.state == TaskState.Active) {
                    task.onSampleEvent1(this.environment);
                }
            }
        };
        TaskManager.prototype.runTasks_OnSampleEvent2 = function () {
            for (var i = this.tasks.length - 1; i >= 0; i--) {
                var task = this.tasks[i];
                if (task.state == TaskState.Active) {
                    task.onSampleEvent2(this.environment);
                }
            }
        };
        return TaskManager;
    }());
    Game.TaskManager = TaskManager;
})(Game || (Game = {}));
