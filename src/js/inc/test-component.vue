<template>
    <div class="some-class">
        Vue component:
        <button @click="count++">{{count}}</button>
    </div>
</template>

<script>
    export default {
        name: "test-component",
        data: function () {
            return {
                count: 0
            }
        }
    }
</script>

<style scoped lang="scss">
    .some-class {
        button {
            &:hover {
                background-color: red;
            }
        }
    }
</style>