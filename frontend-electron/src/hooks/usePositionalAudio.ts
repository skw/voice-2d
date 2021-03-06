import { useEffect, useCallback, useState } from "react";

export default function usePositionalAudio(
    listenerPos: { x: number, y: number },
    sourcePos: { x: number, y: number },
) {
    const [context] = useState<AudioContext>(new AudioContext());
    const [panner, setPanner] = useState<PannerNode | null>(null);
    const [outputStream, setOutputStream] = useState<MediaStream | null>(null);
    useEffect(() => {
        return () => { context.close(); }
    }, []);
    useEffect(() => {
        const panner = context.createPanner();
        panner.distanceModel = "inverse";
        panner.refDistance = 5;
        panner.maxDistance = 1000;
        panner.coneInnerAngle = 360;
        panner.coneOuterAngle = 0;
        panner.coneOuterGain = 0;
        panner.rolloffFactor = 1;
        panner.positionX.value = sourcePos.x;
        panner.positionZ.value = sourcePos.y;
        setPanner(panner);
    }, [sourcePos.x, sourcePos.y]);
    useEffect(() => {
        context.listener.positionX.value = listenerPos.x;
        context.listener.positionZ.value = listenerPos.y;
    }, [listenerPos.x, listenerPos.y]);
    const setPeerConnection = useCallback((pc: RTCPeerConnection | null) => {
        if (!pc) {
            return;
        }
        pc.ontrack = event => {
            const stream = new MediaStream();
            stream.addTrack(event.track);
            setOutputStream(stream);
        };
    }, [setOutputStream]);
    useEffect(() => {
        if (!outputStream || !panner) {
            return;
        }
        const streamNode = context.createMediaStreamSource(outputStream);
        streamNode.connect(panner);
        panner.connect(context.destination);
    }, [outputStream, panner]);
    return { setPeerConnection, srcObject: outputStream }
}