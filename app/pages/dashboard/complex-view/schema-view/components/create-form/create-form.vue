<template>
   <a-drawer
     :visible="isShow"
     :title="name"
     :width="550"
     :unmount-on-close="true"
   >    
   </a-drawer>
</template>

<script setup>
import { ref } from "vue" 

const name = ref("createForm")

const isShow = ref(false)
const show = (rowData)=>{
    isShow.value = true
    console.log(rowData)
}

defineExpose({
    name,
    show
})

</script>

<style lang="less" scoped>

</style>