class MVVM {
    constructor (options) {
        // 一上来先把可用的东西挂载在实例上
        this.$el = options.el;
        this.$data = options.data;

        // 如果有要编译的模板就开始编译
        if (this.$el) {
            // 数据劫持 就是把对象的所有属性 改成get和set方法
            new Observer(this.$data);
            // 用数据和元素进行编译
            new Compile(this.$el, this)
        }
    }
}