<template>
    <h1>page1</h1>
    <input v-model="content" />
    <div>{{ content }}</div>

    <a-table
        :columns="columns"
        :data="tableData"
        :loading="loading"
        :pagination="false"
        row-key="id"
    />
</template>

<script setup>
import { ref, onMounted } from "vue";
import utils from "$common/utils";
import curl from "$common/curl";
import "./a.css";

console.log(utils);

const content = ref("666");

const columns = [
    { title: "ID", dataIndex: "id", key: "id" },
    { title: "Name", dataIndex: "name", key: "name" },
];

const tableData = ref([]);
const loading = ref(false);

const fetchProjectList = async () => {
    loading.value = true;
    try {
        const res = await curl({
            url: "/api/project/list",
            method: "get",
            query: {
                projectKey: "lggbond",
            },
        });
        if (res.success) {
            tableData.value = res.data || [];
        }
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    console.log("page1 init");
    fetchProjectList();
});
</script>

<style lang="less" scoped>
h1 {
    color: red;
}
</style>
