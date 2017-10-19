var PerformanceTest_TS_Class;
(function (PerformanceTest_TS_Class) {
    var Class1 = (function () {
        function Class1() {
            this.Text = "";
        }
        Class1.prototype.toString = function () { return " " + this.Text; };
        return Class1;
    }());
    var Class2 = (function () {
        function Class2() {
            this.Text = "";
        }
        Class2.prototype.toString00 = function () { return " " + this.Text; };
        Class2.prototype.toString01 = function () { return " " + this.Text; };
        Class2.prototype.toString02 = function () { return " " + this.Text; };
        Class2.prototype.toString03 = function () { return " " + this.Text; };
        Class2.prototype.toString04 = function () { return " " + this.Text; };
        Class2.prototype.toString05 = function () { return " " + this.Text; };
        Class2.prototype.toString06 = function () { return " " + this.Text; };
        Class2.prototype.toString07 = function () { return " " + this.Text; };
        Class2.prototype.toString08 = function () { return " " + this.Text; };
        Class2.prototype.toString09 = function () { return " " + this.Text; };
        Class2.prototype.toString10 = function () { return " " + this.Text; };
        Class2.prototype.toString11 = function () { return " " + this.Text; };
        Class2.prototype.toString12 = function () { return " " + this.Text; };
        Class2.prototype.toString13 = function () { return " " + this.Text; };
        Class2.prototype.toString14 = function () { return " " + this.Text; };
        Class2.prototype.toString15 = function () { return " " + this.Text; };
        Class2.prototype.toString16 = function () { return " " + this.Text; };
        Class2.prototype.toString17 = function () { return " " + this.Text; };
        Class2.prototype.toString18 = function () { return " " + this.Text; };
        Class2.prototype.toString19 = function () { return " " + this.Text; };
        return Class2;
    }());
    function getSecond(date) {
        return date.getMinutes() * 60 + date.getSeconds() + date.getMilliseconds() / 1000;
    }
    function getTimeText(date) {
        return date.getHours() + ":" + date.getMinutes() + " " + (date.getSeconds() + date.getMilliseconds() / 1000).toFixed(4);
    }
    window.onload = function () {
        var date;
        var startTime;
        var endTime;
        var count = Math.pow(10, 9);
        console.log("Generates " + count + " times");
        // Class1: less member functions
        date = new Date();
        startTime = getSecond(date);
        console.log("Class1: start: " + getTimeText(date));
        for (var i = 0; i < count; i++) {
            var class1 = new Class1();
        }
        date = new Date();
        endTime = getSecond(date);
        console.log("Class1: end  : " + getTimeText(date) + " -> " + (endTime - startTime).toFixed(4) + " ms");
        // Class2: more member functions
        date = new Date();
        startTime = getSecond(date);
        console.log("Class2: start: " + getTimeText(date));
        for (var i = 0; i < count; i++) {
            var class2 = new Class2();
        }
        date = new Date();
        endTime = getSecond(date);
        console.log("Class2: end  : " + getTimeText(date) + " -> " + (endTime - startTime).toFixed(4) + " ms");
        // Empty loop: only looping
        date = new Date();
        startTime = getSecond(date);
        console.log("(Referential) Empty loop: start: " + getTimeText(date));
        for (var i = 0; i < count; i++) {
        }
        date = new Date();
        endTime = getSecond(date);
        console.log("(Referential) Empty loop: end  : " + getTimeText(date) + " -> " + (endTime - startTime).toFixed(4) + " ms");
    };
})(PerformanceTest_TS_Class || (PerformanceTest_TS_Class = {}));
