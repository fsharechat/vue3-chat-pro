// @ts-nocheck
import AbstractMessageHandler from "./abstractmessagehandler";
import { PUBLISH, SAI } from "../../constant";
import vuexStore from "../../store";

export default class StreamingAiHandler extends AbstractMessageHandler {
    match(proto) {
        return proto.signal === PUBLISH && proto.subSignal === SAI;
    }

    processMessage(proto) {
        const { i: streamId, d: delta, f: isDone, t: target } = JSON.parse(proto.content);
        vuexStore.commit('appendStreamingContent', { streamId, delta, isDone, target });
    }
}
