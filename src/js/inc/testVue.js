import component from './test-component'

new Vue({
    el: '#vue-example',
    render: function (cb) {
        return cb(component);
    }
});