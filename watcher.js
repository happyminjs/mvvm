// 观察者的目的就是给需要变化的那个元素增加一个观察者，当数据变化后，执行对应的方法
// 用新值和老值进行比对，如果发生变化， 就调用更新方法

class Watcher{
    constructor(vm, expr, cb) {
        this.vm = vm;
        this.expr = expr;
        this.cb = cb;
        // 先获取老的值
        this.value = this.get();
    }
    /**
     * 获取实例上对应的数据
     * @param {MVVM} vm 
     * @param {string} expr 
     */
    getVal(vm, expr) {
        expr = expr.split('.'); 
        return expr.reduce((prev, next) => {
            return prev[next];
        }, vm.$data)
    }
    get() {
        Dep.target = this;
        let value = this.getVal(this.vm, this.expr)
        return value;
    }
    // 对外暴露的方法
    update() {
        let newValue = this.getVal(this.vm, this.expr);
        let oldValue = this.value;
        if (newValue != oldValue) {
            this.cb(newValue); // 调用watch 的callback
        }
    }
}

// vm.$data expr
/*
<input type="text" v-model="message"></input>
{message: 1}
{message: 2}
input.value = message
*/

