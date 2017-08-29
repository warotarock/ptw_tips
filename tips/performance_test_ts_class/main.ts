namespace PerformanceTest_TS_Class {

    class Class1 {

        Text: string = "";

        toString() { return " " + this.Text; }
    }

    class Class2 {

        Text: string = "";

        toString00() { return " " + this.Text; }
        toString01() { return " " + this.Text; }
        toString02() { return " " + this.Text; }
        toString03() { return " " + this.Text; }
        toString04() { return " " + this.Text; }
        toString05() { return " " + this.Text; }
        toString06() { return " " + this.Text; }
        toString07() { return " " + this.Text; }
        toString08() { return " " + this.Text; }
        toString09() { return " " + this.Text; }

        toString10() { return " " + this.Text; }
        toString11() { return " " + this.Text; }
        toString12() { return " " + this.Text; }
        toString13() { return " " + this.Text; }
        toString14() { return " " + this.Text; }
        toString15() { return " " + this.Text; }
        toString16() { return " " + this.Text; }
        toString17() { return " " + this.Text; }
        toString18() { return " " + this.Text; }
        toString19() { return " " + this.Text; }
    }

    function getSecond(date: Date): number {
        return date.getMinutes() * 60 + date.getSeconds() + date.getMilliseconds() / 1000;
    }

    function getTimeText(date: Date): string {
        return date.getHours() + ":" + date.getMinutes() + " " + (date.getSeconds() + date.getMilliseconds() / 1000).toFixed(4);
    }

    window.onload = () => {

        var date: Date;
        var startTime: number;
        var endTime: number;

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
}
