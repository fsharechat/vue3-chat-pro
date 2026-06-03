<script setup lang="ts">
import { computed } from 'vue'
import { marked } from 'marked'

const props = defineProps<{
  content: string
  streaming?: boolean
  emojis?: { file: string; code: string; reg: RegExp }[]
}>()

function replaceFace(text: string) {
  if (!text.includes('/:') || !props.emojis) return text
  let result = text
  for (const emoji of props.emojis) {
    result = result.replace(emoji.reg, `<img src="/emoji/${emoji.file}" style="vertical-align:middle;width:24px;height:24px" alt="" />`)
  }
  return result
}

const rendered = computed(() => {
  let text = props.content ?? ''
  text = replaceFace(text)
  return marked.parse(text, { breaks: true }) as string
})
</script>

<template>
  <div class="markdown-text" v-html="rendered"></div>
  <span v-if="streaming" class="streaming-cursor">|</span>
</template>

<style scoped>
.markdown-text { white-space: pre-wrap; word-break: break-word; }
.streaming-cursor { display: inline-block; margin-left: 2px; animation: blink 0.8s step-start infinite; }
@keyframes blink { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }
.markdown-text :deep(a) { color: var(--accent); }
.markdown-text :deep(code) { background: var(--bg-tertiary); padding: 1px 4px; border-radius: 3px; font-family: monospace; }
.markdown-text :deep(pre) { background: var(--bg-tertiary); padding: 12px; border-radius: 6px; overflow-x: auto; }
.markdown-text :deep(p) { margin: 0; }
</style>
