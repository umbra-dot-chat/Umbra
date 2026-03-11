declare module '@roamhq/wrtc' {
  const RTCPeerConnection: typeof globalThis.RTCPeerConnection;
  const RTCSessionDescription: typeof globalThis.RTCSessionDescription;
  const RTCIceCandidate: typeof globalThis.RTCIceCandidate;
  const MediaStream: typeof globalThis.MediaStream;
  const nonstandard: {
    RTCVideoSource: any;
    RTCAudioSource: any;
  };

  const wrtc: {
    RTCPeerConnection: typeof globalThis.RTCPeerConnection;
    RTCSessionDescription: typeof globalThis.RTCSessionDescription;
    RTCIceCandidate: typeof globalThis.RTCIceCandidate;
    MediaStream: typeof globalThis.MediaStream;
    nonstandard: {
      RTCVideoSource: any;
      RTCAudioSource: any;
    };
  };

  export default wrtc;
}
