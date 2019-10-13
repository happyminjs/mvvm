class Compile {
    /**
     * 
     * @param {dom/string} el 
     * @param {Object} vm MVVM 的实例 
     */
    constructor(el, vm) {
        this.el = this.isElementNode(el) ? el : document.querySelector(el);
        this.vm = vm;
        if (this.el) {
            // 如果这个元素能获取到 我们才开始编译
            // 1、先把el内这些真实的dom移动到内存中 fragment
            let fragment = this.nodeToFragment(this.el)
            // 2、编译 => 提取想要的元素节点 v-model 和文本节点 {{}}
            this.compile(fragment);
            // 3、把编译好的fragment在塞回到页面里去
            this.el.appendChild(fragment);
        }
    }

    // 专门写一些辅助的方法
    isElementNode(node) {
        return node.nodeType === 1;
    }
    /**
     * 是否指令
     * @param {*} node 
     */
    isDirective(name) {
        return name.includes('v-');
    }

    // 核心的方法
    /**
     * 编译元素
     * @param {node} node 
     */
    compileElement(node) {
        // 带 v-model v-text 的属性
        let attrs = node.attributes; // 取出当前节点的属性
        // console.log(attrs)
        Array.from(attrs).forEach(attr => {
            // console.log(attr.name, attr.value)
            // 判断属性名字是不是包含v-
            let attrName = attr.name;
            if (this.isDirective(attrName)) {
                // 取到对应的值放到节点中
                let expr = attr.value;  // 可以是表达式、变量
                // node this.vm.$data expr v-model v-text v-html
                let [,type] = attr.name.split('-');
                CompileUtil[type](node, this.vm, expr);
            }
        })
    }
    /**
     * 编译文本
     * @param {string} node 
     */
    compileText(node) {
        // 带 {{}}
        let expr = node.textContent; //    取文本中内容，可以是变量，可以是表达式
        let reg = /\{\{([^}]+)\}\}/g
        if (reg.test(expr)) {
            // node this.vm.$data text
            CompileUtil['text'](node, this.vm, expr);
        }
    }
    compile(fragment) {
        // 需要递归
        let childNodes = fragment.childNodes;
        // console.log(childNodes, fragment.children);
        Array.from(childNodes).forEach(node => {
            if (this.isElementNode(node)) {
                // 是元素节点，则需要继续深入的检查，则递归
                // console.log('element: ', node)
                // 这里需要编译元素
                this.compileElement(node);
                this.compile(node);
            } else {
                // 是文本节点
                // console.log('text: ', node);
                // 这里需要编译文本
                this.compileText(node);
            }
        })
    }
    /**
     * 需要将el中的内容全部放入内存中，将实际dom清空，用 appendChild 是移动原来位置的dom到新位置
     * @param {node} el 
     */
    nodeToFragment(el) {
        // 创建文档碎片，是放在内存中的dom节点，非页面上的
        let fragment = document.createDocumentFragment();
        let firstChild;
        while(firstChild = el.firstChild) {
            fragment.appendChild(firstChild)
        }
        return fragment;
    }
}


CompileUtil = {
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
    },
    getTextVal(vm, expr) {
        return expr.replace(/\{\{([^}]+)\}\}/g, (...arguments) => {
            return this.getVal(vm, arguments[1]);
        })
    },
    text (node, vm, expr) {
        // 文本处理
        let updateFn = this.updater['textUpdater'];
        // // vm.$data[expr]
        let value = this.getTextVal(vm, expr);
        expr.replace(/\{\{([^}]+)\}\}/g, (...arguments) => {
            new Watcher(vm, arguments[1], (newValue) =>{
                // 如果数据变化，文本节点需要重新获取依赖的数据 更新文本中的内容
                updateFn && updateFn(node, this.getTextVal());
            })
        })
        updateFn && updateFn(node, value);
    },
    model (node, vm, expr) {
        // 输入框处理
        let updateFn = this.updater['modelUpdater'];
        // 这里应该加个监控，数据变化了后 应该调用这个watch的callback
        new Watcher(vm, expr, (newValue) => {
            // 当值变化后 会调用callback， 将新值newValue 传递过来
            updateFn && updateFn(node, this.getVal(vm, expr));
        })
        updateFn && updateFn(node, this.getVal(vm, expr));
    },
    html (node, vm, expr) {},
    updater: {
        // 文本更新
        textUpdater (node, value) {
            node.textContent = value;
        },
        // 输入框更新
        modelUpdater (node, value) {
            node.value = value
        },
        htmlUpdater () {}
    }
}