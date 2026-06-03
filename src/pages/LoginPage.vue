<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'
import {
  LOGIN_API, SNED_VERIFY_CODE_API,
  KEY_VUE_DEVICE_ID, KEY_VUE_USER_ID, KEY_VUE_TOKEN
} from '@/constant'
import { useMessage } from 'naive-ui'

const router = useRouter()
const message = useMessage()

const mobile = ref('')
const code = ref('')
const sendBtnText = ref('发送验证码')
const sendBtnDisabled = ref(true)
const loginBtnDisabled = ref(true)
const loginText = ref('登录')
let countDownTimer: ReturnType<typeof setInterval> | null = null

function validatePhoneOrEmail(input: string) {
  return /^1[3-9]\d{9}$/.test(input) || /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(input)
}

function onMobileInput() {
  sendBtnDisabled.value = !(validatePhoneOrEmail(mobile.value) && sendBtnText.value === '发送验证码')
  onCodeInput()
}

function onCodeInput() {
  loginBtnDisabled.value = !(code.value && validatePhoneOrEmail(mobile.value))
}

async function sendVerifyCode() {
  if (!validatePhoneOrEmail(mobile.value)) { message.error('请输入正确的手机号或邮箱'); return }
  sendBtnDisabled.value = true
  try {
    const res = await axios.post(SNED_VERIFY_CODE_API, { mobile: mobile.value }, { headers: { 'Content-Type': 'application/json;charset=UTF-8' } })
    if (res.data.code === 0) {
      let count = 60
      countDownTimer = setInterval(() => {
        sendBtnText.value = `${--count}S`
        if (count === 0) {
          clearInterval(countDownTimer!); sendBtnDisabled.value = false; sendBtnText.value = '发送验证码'
        }
      }, 1000)
    } else { message.error(res.data.message) }
  } catch { message.error('发送失败，请重试') }
}

async function login() {
  let deviceId = localStorage.getItem(KEY_VUE_DEVICE_ID)
  if (!deviceId) { deviceId = uuidv4(); localStorage.setItem(KEY_VUE_DEVICE_ID, deviceId) }
  loginBtnDisabled.value = true; loginText.value = '登录中...'
  try {
    const res = await axios.post(LOGIN_API,
      { mobile: mobile.value, code: code.value, clientId: deviceId },
      { headers: { 'Content-Type': 'application/json;charset=UTF-8' } }
    )
    if (res.data.code === 0) {
      const { userId, token } = res.data.result
      localStorage.setItem(KEY_VUE_USER_ID, userId)
      localStorage.setItem(KEY_VUE_TOKEN, token)
      router.push('/conversation')
    } else {
      message.error(res.data.message)
      loginBtnDisabled.value = false; loginText.value = '登录'
    }
  } catch { message.error('登录失败，请重试'); loginBtnDisabled.value = false; loginText.value = '登录' }
}

function onEnter(e: KeyboardEvent) {
  if (e.key === 'Enter' && !loginBtnDisabled.value) login()
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-logo">
        <img src="/images/vue.jpg" alt="飞享" class="logo-img" />
        <h2>飞享 · 即时通讯</h2>
        <p class="subtitle">输入账号进行安全登录</p>
      </div>
      <div class="form-group">
        <label>手机号码 / 邮箱</label>
        <n-input v-model:value="mobile" placeholder="请输入手机号或邮箱" size="large" @input="onMobileInput" />
      </div>
      <div class="form-group">
        <label>验证码</label>
        <n-input-group>
          <n-input v-model:value="code" placeholder="请输入验证码" size="large" @input="onCodeInput" @keydown="onEnter" style="flex:1" />
          <n-button type="primary" :disabled="sendBtnDisabled" size="large" @click="sendVerifyCode" style="width:120px">
            {{ sendBtnText }}
          </n-button>
        </n-input-group>
      </div>
      <n-button type="primary" block :disabled="loginBtnDisabled" size="large" class="login-btn" @click="login">
        {{ loginText }}
      </n-button>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  width: 100vw; height: 100vh;
  display: flex; align-items: center; justify-content: center;
  background: var(--bg-primary);
}
.login-card {
  width: 360px; padding: 40px 32px;
  background: var(--bg-secondary);
  border-radius: 12px;
  border: 1px solid var(--border);
  box-shadow: 0 8px 32px var(--shadow);
}
.login-logo { text-align: center; margin-bottom: 32px; }
.logo-img { width: 72px; height: 72px; border-radius: 50%; object-fit: cover; margin-bottom: 12px; }
.login-logo h2 { font-size: 20px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px; }
.subtitle { font-size: 13px; color: var(--text-muted); }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; font-size: 12px; color: var(--text-muted); margin-bottom: 6px; }
.login-btn { margin-top: 8px; }
</style>
