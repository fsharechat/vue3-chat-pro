<script setup lang="ts">
const emit = defineEmits<{ (e: 'close'): void }>()
const show = true
const version = __APP_VERSION__
</script>
<template>
  <n-modal :show="show" @update:show="emit('close')" title="关于飞享" preset="dialog" style="width:320px">
    <div style="text-align:center;padding:16px 0">
      <img src="/favicon.ico" style="width:64px;height:64px;border-radius:12px;margin-bottom:12px;display:block;margin-left:auto;margin-right:auto" />
      <p style="font-size:16px;font-weight:600;color:var(--text-primary)">飞享.{{ version }}</p>
      <p style="font-size:13px;color:var(--text-muted);margin-top:8px">基于 fsharechat 的开源即时通讯 Web 客户端</p>
      <p style="font-size:12px;color:var(--text-muted);margin-top:4px">Vue3 + TypeScript + Naive UI 重写版本</p>
    </div>
  </n-modal>
</template>
