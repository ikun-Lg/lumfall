<template>
    <h1>page1</h1>
    <input v-model="content" />
    <div>{{ content }}</div>
</template>

<script setup>
import { ref } from "vue";
import utils from "$common/utils";
import './a.css'

console.log(utils)

const content = ref("666");
console.log("page1 init");
</script>

<style lang="less" scoped>
h1 {
    color: red;
}
</style>
