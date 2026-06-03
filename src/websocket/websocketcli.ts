// @ts-nocheck
class WebSocketClient {
  constructor() {
    this._instance = null
  }

  setInstance(vueWebSocket) {
    this._instance = vueWebSocket
  }

  getDisplayName(userId) {
    return userId
  }

  getPortrait(userId) {
    return 'images/vue.jpg'
  }

  createGroup(groupName, memberIds) {
    return this._instance?.createGroup(groupName, memberIds)
  }

  modifyGroupInfo(info) { return this._instance?.modifyGroupInfo(info) }
  quitGroup(groupId) { return this._instance?.quitGroup(groupId) }
  dismissGroup(groupId) { return this._instance?.dismissGroup(groupId) }
  getGroupMember(groupId) { return this._instance?.getGroupMember(groupId) }
  addMembers(groupId, memberIds) { return this._instance?.addMembers(groupId, memberIds) }
  kickeMembers(groupId, memberIds) { return this._instance?.kickeMembers(groupId, memberIds) }
  recallMessage(messageUid) { return this._instance?.recallMessage(messageUid) }
  getMinioUploadUrl(mediaType, key) { return this._instance?.getMinioUploadUrl(mediaType, key) }
  modifyFriendAlias(targetUid, alias) { return this._instance?.modifyFriendAlias(targetUid, alias) }
  getRemoteMessages(conversation, beforeUid, count) {
    return this._instance?.getRemoteMessages(conversation, beforeUid, count)
  }
  uploadDeliveryReport(date, target) {
    return this._instance?.uploadDeliveryReport(date, target)
  }
  uploadReadReport(date, target, conversationType) {
    return this._instance?.uploadReadReport(date, target, conversationType)
  }
}

export default new WebSocketClient()
