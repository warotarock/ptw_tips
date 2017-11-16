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
    // State flags to control execution timing of event method
    var TaskState;
    (function (TaskState) {
        TaskState[TaskState["created"] = 0] = "created";
        TaskState[TaskState["active"] = 1] = "active";
        TaskState[TaskState["waitingForDestroy"] = 2] = "waitingForDestroy";
    })(TaskState = Game.TaskState || (Game.TaskState = {}));
    // Task base class
    var TaskClass = (function () {
        function TaskClass() {
            this.recyclePool = null;
            this.state = TaskState.created;
        }
        TaskClass.prototype.recycle = function () {
            // Override method
        };
        TaskClass.prototype.onCreate = function (env) {
            // Override method
        };
        TaskClass.prototype.onDestroy = function (env) {
            // Override method
        };
        TaskClass.prototype.run = function (env) {
            // Override method
        };
        TaskClass.prototype.onBeforeRendering = function (env) {
            // Override method
        };
        TaskClass.prototype.onSampleEvent1 = function (env) {
            // Override method
        };
        TaskClass.prototype.onSampleEvent2 = function (env) {
            // Override method
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
    var TaskRecyclePool = (function (_super) {
        __extends(TaskRecyclePool, _super);
        function TaskRecyclePool(ObjectType, poolSize, name) {
            var _this = _super.call(this, ObjectType, poolSize) || this;
            _this.ObjectType = ObjectType;
            _this.name = name;
            return _this;
        }
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
        };
        TaskManager.prototype.addTask = function (task) {
            this.tasks.push(task);
            task.onCreate(this.environment);
            task.state = TaskState.active;
            return task;
        };
        TaskManager.prototype.addTaskToGroup = function (task, taskGroupID) {
            var taskGroup = this.taskGroups[taskGroupID];
            taskGroup.add(task);
            return task;
        };
        TaskManager.prototype.destroyTask = function (task) {
            task.state = TaskState.waitingForDestroy;
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
        TaskManager.prototype.executeDestroyTask = function () {
            for (var i = this.tasks.length - 1; i >= 0; i--) {
                var task = this.tasks[i];
                if (task.state == TaskState.waitingForDestroy) {
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
                if (task.state != TaskState.waitingForDestroy) {
                    task.run(this.environment);
                }
            }
        };
        TaskManager.prototype.runTasks_onBeforeRendering = function () {
            for (var i = this.tasks.length - 1; i >= 0; i--) {
                var task = this.tasks[i];
                if (task.state != TaskState.waitingForDestroy) {
                    task.onBeforeRendering(this.environment);
                }
            }
        };
        TaskManager.prototype.runTasks_OnSampleEvent1 = function () {
            for (var i = this.tasks.length - 1; i >= 0; i--) {
                var task = this.tasks[i];
                if (task.state != TaskState.waitingForDestroy) {
                    task.onSampleEvent1(this.environment);
                }
            }
        };
        TaskManager.prototype.runTasks_OnSampleEvent2 = function () {
            for (var i = this.tasks.length - 1; i >= 0; i--) {
                var task = this.tasks[i];
                if (task.state != TaskState.waitingForDestroy) {
                    task.onSampleEvent2(this.environment);
                }
            }
        };
        return TaskManager;
    }());
    Game.TaskManager = TaskManager;
})(Game || (Game = {}));
