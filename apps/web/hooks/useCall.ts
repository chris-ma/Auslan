"use client";

import { useCallback, useEffect, useRef } from "react";
import { useCallStore } from "@/store/callStore";
import { createPeerConnection } from "@/lib/webrtc/peerConnection";
import { signalingClient } from "@/lib/webrtc/signalingClient";
import type { SubtitleMessage } from "@/lib/webrtc/signalingClient";
import type { SignLabel } from "@auslan/vocab";

function generateRoomId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function useCall(localStream: MediaStream | null) {
  const {
    roomId,
    status,
    setRoomId,
    setStatus,
    setRemoteStream,
    addRemoteSubtitle,
    setSubtitlesAvailable,
    setPeerConnection,
    setDataChannel,
    reset,
  } = useCallStore();

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const seqRef = useRef(0);
  const roomRef = useRef<string | null>(null);

  const setupDataChannel = useCallback(
    (dc: RTCDataChannel) => {
      dcRef.current = dc;
      setDataChannel(dc);

      dc.onopen = () => setSubtitlesAvailable(true);
      dc.onclose = () => setSubtitlesAvailable(false);
      dc.onerror = () => setSubtitlesAvailable(false);

      dc.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data as string) as SubtitleMessage;
          if (msg.type === "subtitle") {
            addRemoteSubtitle({
              label: msg.label as SignLabel,
              displayText: msg.displayText,
              confidence: msg.confidence,
              timestampMs: msg.timestamp,
              sequenceId: msg.sequenceId,
            });
          }
        } catch {
          // malformed message — ignore
        }
      };
    },
    [setDataChannel, setSubtitlesAvailable, addRemoteSubtitle]
  );

  const setupPeerConnection = useCallback(
    (pc: RTCPeerConnection, room: string) => {
      pcRef.current = pc;
      setPeerConnection(pc);

      localStream?.getTracks().forEach((track) => pc.addTrack(track, localStream));

      pc.ontrack = (e) => {
        const [remoteStream] = e.streams;
        if (remoteStream) setRemoteStream(remoteStream);
      };

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          signalingClient.sendIceCandidate(room, e.candidate.toJSON());
        }
      };

      pc.onconnectionstatechange = () => {
        switch (pc.connectionState) {
          case "connected":
            setStatus("connected");
            break;
          case "disconnected":
          case "failed":
            setStatus("reconnecting");
            pc.restartIce();
            break;
          case "closed":
            setStatus("ended");
            break;
        }
      };
    },
    [localStream, setPeerConnection, setRemoteStream, setStatus]
  );

  const createRoom = useCallback(async () => {
    setStatus("creating");
    const room = generateRoomId();
    roomRef.current = room;
    setRoomId(room);

    await signalingClient.connect();
    signalingClient.joinRoom(room);
    setStatus("waiting");

    const pc = createPeerConnection();
    setupPeerConnection(pc, room);

    const dc = pc.createDataChannel("subtitles", { ordered: true });
    setupDataChannel(dc);

    signalingClient.on("peer-joined", async () => {
      setStatus("connecting");
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      signalingClient.sendOffer(room, offer);
    });

    signalingClient.on("answer", async (sdp) => {
      await pc.setRemoteDescription(sdp);
    });

    signalingClient.on("ice-candidate", async (c) => {
      await pc.addIceCandidate(c);
    });

    signalingClient.on("peer-left", () => {
      setStatus("ended");
    });
  }, [setStatus, setRoomId, setupPeerConnection, setupDataChannel]);

  const joinRoom = useCallback(
    async (room: string) => {
      roomRef.current = room;
      setRoomId(room);
      setStatus("connecting");

      await signalingClient.connect();
      signalingClient.joinRoom(room);

      const pc = createPeerConnection();
      setupPeerConnection(pc, room);

      pc.ondatachannel = (e) => setupDataChannel(e.channel);

      signalingClient.on("offer", async (sdp) => {
        await pc.setRemoteDescription(sdp);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        signalingClient.sendAnswer(room, answer);
      });

      signalingClient.on("ice-candidate", async (c) => {
        await pc.addIceCandidate(c);
      });

      signalingClient.on("peer-left", () => {
        setStatus("ended");
      });
    },
    [setRoomId, setStatus, setupPeerConnection, setupDataChannel]
  );

  const sendSubtitle = useCallback(
    (label: string, displayText: string, confidence: number) => {
      if (dcRef.current?.readyState !== "open") return;
      const msg: SubtitleMessage = {
        type: "subtitle",
        label,
        displayText,
        confidence,
        timestamp: Date.now(),
        sequenceId: seqRef.current++,
      };
      dcRef.current.send(JSON.stringify(msg));
    },
    []
  );

  const endCall = useCallback(() => {
    dcRef.current?.close();
    pcRef.current?.close();
    signalingClient.disconnect();
    reset();
  }, [reset]);

  useEffect(() => {
    return () => {
      dcRef.current?.close();
      pcRef.current?.close();
      signalingClient.disconnect();
    };
  }, []);

  return { roomId, status, createRoom, joinRoom, sendSubtitle, endCall };
}
