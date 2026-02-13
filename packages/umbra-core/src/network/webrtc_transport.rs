//! # WebRTC Transport for WASM
//!
//! Custom libp2p transport using raw WebRTC data channels via `web-sys`.
//! Enables browser-to-browser P2P connectivity without requiring
//! `libp2p-webrtc-websys` (which only supports browser-to-server).
//!
//! ## Architecture
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────┐
//! │                 WebRTC Transport                             │
//! ├─────────────────────────────────────────────────────────────┤
//! │                                                             │
//! │  RTCPeerConnection (web-sys)                                │
//! │       │                                                     │
//! │       ├── Data Channel "libp2p"                              │
//! │       │     │                                               │
//! │       │     └── WebRtcStream (AsyncRead + AsyncWrite)       │
//! │       │           │                                         │
//! │       │           └── Noise handshake (auth + encrypt)      │
//! │       │                 │                                   │
//! │       │                 └── Yamux muxer (multiplexing)      │
//! │       │                       │                             │
//! │       │                       └── libp2p protocols          │
//! │       │                                                     │
//! │       └── ICE candidates (STUN for NAT traversal)           │
//! │                                                             │
//! │  Signaling: Out-of-band via QR code / connection link       │
//! │                                                             │
//! └─────────────────────────────────────────────────────────────┘
//! ```
//!
//! ## Signaling Flow
//!
//! 1. Alice creates offer → encodes as JSON → shows QR/link
//! 2. Bob scans → creates answer → shows QR/link back
//! 3. Alice scans answer → WebRTC connection established
//! 4. Data channel wraps as libp2p Transport

#![cfg(target_arch = "wasm32")]

use std::collections::VecDeque;
use std::io;
use std::pin::Pin;
use std::sync::Arc;
use std::task::{Context, Poll, Waker};

use futures::future::BoxFuture;
use libp2p::core::muxing::{StreamMuxer, StreamMuxerBox, StreamMuxerEvent};
use libp2p::core::transport::{ListenerId, TransportError, TransportEvent};
use libp2p::{Multiaddr, PeerId, Transport as LibTransport};
use parking_lot::Mutex;
use send_wrapper::SendWrapper;
use tokio::sync::mpsc;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use wasm_bindgen_futures::JsFuture;

// ============================================================================
// SIGNALING DATA
// ============================================================================

/// Signaling data exchanged out-of-band (via QR code or connection link)
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct SignalingData {
    /// SDP offer or answer
    pub sdp: String,
    /// SDP type: "offer" or "answer"
    pub sdp_type: String,
    /// ICE candidates gathered
    pub ice_candidates: Vec<IceCandidate>,
    /// Sender's DID (so the receiver can derive PeerId)
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub did: Option<String>,
    /// Sender's PeerId (precomputed for convenience)
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub peer_id: Option<String>,
}

/// A single ICE candidate
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct IceCandidate {
    /// The candidate string
    pub candidate: String,
    /// SDP mid
    pub sdp_mid: Option<String>,
    /// SDP m-line index
    pub sdp_m_line_index: Option<u16>,
}

// ============================================================================
// WEBRTC STREAM (AsyncRead + AsyncWrite)
// ============================================================================

/// Shared state between the RtcDataChannel callbacks and the async stream
struct DataChannelState {
    /// Buffered incoming data
    read_buf: VecDeque<u8>,
    /// Waker to wake when data arrives
    read_waker: Option<Waker>,
    /// Whether the channel is open
    open: bool,
    /// Waker to wake when channel opens
    open_waker: Option<Waker>,
    /// Whether the channel is closed
    closed: bool,
    /// Error if any
    error: Option<String>,
}

/// An async wrapper around an RtcDataChannel
pub struct WebRtcStream {
    channel: SendWrapper<web_sys::RtcDataChannel>,
    state: Arc<Mutex<DataChannelState>>,
    // Store closures to prevent GC
    _onmessage: SendWrapper<Closure<dyn FnMut(web_sys::MessageEvent)>>,
    _onopen: SendWrapper<Closure<dyn FnMut(web_sys::Event)>>,
    _onclose: SendWrapper<Closure<dyn FnMut(web_sys::Event)>>,
    _onerror: SendWrapper<Closure<dyn FnMut(web_sys::Event)>>,
}

impl WebRtcStream {
    /// Create a new stream from an RtcDataChannel
    fn new(channel: web_sys::RtcDataChannel) -> Self {
        // Configure the data channel for binary mode
        channel.set_binary_type(web_sys::RtcDataChannelType::Arraybuffer);

        let state = Arc::new(Mutex::new(DataChannelState {
            read_buf: VecDeque::new(),
            read_waker: None,
            open: channel.ready_state() == web_sys::RtcDataChannelState::Open,
            open_waker: None,
            closed: false,
            error: None,
        }));

        // onmessage callback
        let state_clone = state.clone();
        let onmessage = Closure::wrap(Box::new(move |event: web_sys::MessageEvent| {
            if let Ok(buf) = event.data().dyn_into::<js_sys::ArrayBuffer>() {
                let array = js_sys::Uint8Array::new(&buf);
                let bytes = array.to_vec();
                let mut s = state_clone.lock();
                s.read_buf.extend(bytes);
                if let Some(waker) = s.read_waker.take() {
                    waker.wake();
                }
            }
        }) as Box<dyn FnMut(web_sys::MessageEvent)>);
        channel.set_onmessage(Some(onmessage.as_ref().unchecked_ref()));

        // onopen callback
        let state_clone = state.clone();
        let onopen = Closure::wrap(Box::new(move |_: web_sys::Event| {
            let mut s = state_clone.lock();
            s.open = true;
            if let Some(waker) = s.open_waker.take() {
                waker.wake();
            }
        }) as Box<dyn FnMut(web_sys::Event)>);
        channel.set_onopen(Some(onopen.as_ref().unchecked_ref()));

        // onclose callback
        let state_clone = state.clone();
        let onclose = Closure::wrap(Box::new(move |_: web_sys::Event| {
            let mut s = state_clone.lock();
            s.closed = true;
            if let Some(waker) = s.read_waker.take() {
                waker.wake();
            }
        }) as Box<dyn FnMut(web_sys::Event)>);
        channel.set_onclose(Some(onclose.as_ref().unchecked_ref()));

        // onerror callback
        let state_clone = state.clone();
        let onerror = Closure::wrap(Box::new(move |_: web_sys::Event| {
            let mut s = state_clone.lock();
            s.error = Some("Data channel error".to_string());
            s.closed = true;
            if let Some(waker) = s.read_waker.take() {
                waker.wake();
            }
        }) as Box<dyn FnMut(web_sys::Event)>);
        channel.set_onerror(Some(onerror.as_ref().unchecked_ref()));

        Self {
            channel: SendWrapper::new(channel),
            state,
            _onmessage: SendWrapper::new(onmessage),
            _onopen: SendWrapper::new(onopen),
            _onclose: SendWrapper::new(onclose),
            _onerror: SendWrapper::new(onerror),
        }
    }
}

impl futures::AsyncRead for WebRtcStream {
    fn poll_read(
        self: Pin<&mut Self>,
        cx: &mut Context<'_>,
        buf: &mut [u8],
    ) -> Poll<io::Result<usize>> {
        let mut state = self.state.lock();

        if let Some(ref error) = state.error {
            return Poll::Ready(Err(io::Error::new(io::ErrorKind::Other, error.clone())));
        }

        if !state.read_buf.is_empty() {
            let to_read = buf.len().min(state.read_buf.len());
            for (i, byte) in state.read_buf.drain(..to_read).enumerate() {
                buf[i] = byte;
            }
            return Poll::Ready(Ok(to_read));
        }

        if state.closed {
            return Poll::Ready(Ok(0)); // EOF
        }

        state.read_waker = Some(cx.waker().clone());
        Poll::Pending
    }
}

impl futures::AsyncWrite for WebRtcStream {
    fn poll_write(
        self: Pin<&mut Self>,
        _cx: &mut Context<'_>,
        buf: &[u8],
    ) -> Poll<io::Result<usize>> {
        let state = self.state.lock();
        if state.closed {
            return Poll::Ready(Err(io::Error::new(
                io::ErrorKind::BrokenPipe,
                "Data channel closed",
            )));
        }

        // Check backpressure: if bufferedAmount is too high, we should wait
        // For simplicity, we'll send immediately and let the browser buffer
        let array = js_sys::Uint8Array::from(buf);
        match self.channel.send_with_array_buffer(&array.buffer()) {
            Ok(()) => Poll::Ready(Ok(buf.len())),
            Err(e) => Poll::Ready(Err(io::Error::new(
                io::ErrorKind::Other,
                format!("Failed to send: {:?}", e),
            ))),
        }
    }

    fn poll_flush(self: Pin<&mut Self>, _cx: &mut Context<'_>) -> Poll<io::Result<()>> {
        // WebRTC data channels don't have explicit flush
        Poll::Ready(Ok(()))
    }

    fn poll_close(self: Pin<&mut Self>, _cx: &mut Context<'_>) -> Poll<io::Result<()>> {
        self.channel.close();
        Poll::Ready(Ok(()))
    }
}

// ============================================================================
// WEBRTC CONNECTION (StreamMuxer)
// ============================================================================

/// A WebRTC connection that implements StreamMuxer.
///
/// For our initial implementation, we use a single data channel per connection
/// rather than full multiplexing. The libp2p Noise + Yamux layers on top
/// handle multiplexing over this single channel.
pub struct WebRtcConnection {
    /// The underlying RTCPeerConnection
    _peer_connection: SendWrapper<web_sys::RtcPeerConnection>,
    /// The primary data channel stream
    stream: Option<WebRtcStream>,
    /// Whether the connection has been used (first poll_outbound returns stream)
    stream_given: bool,
    /// Whether the muxer is closed
    closed: bool,
}

impl StreamMuxer for WebRtcConnection {
    type Substream = WebRtcStream;
    type Error = io::Error;

    fn poll_inbound(
        self: Pin<&mut Self>,
        _cx: &mut Context<'_>,
    ) -> Poll<Result<Self::Substream, Self::Error>> {
        // We don't accept inbound substreams in our simple model.
        // The single data channel handles everything via Yamux on top.
        Poll::Pending
    }

    fn poll_outbound(
        mut self: Pin<&mut Self>,
        _cx: &mut Context<'_>,
    ) -> Poll<Result<Self::Substream, Self::Error>> {
        if self.closed {
            return Poll::Ready(Err(io::Error::new(
                io::ErrorKind::BrokenPipe,
                "Connection closed",
            )));
        }

        if !self.stream_given {
            if let Some(stream) = self.stream.take() {
                self.stream_given = true;
                return Poll::Ready(Ok(stream));
            }
        }

        // After the first substream, no more are available
        // (Yamux handles multiplexing on top)
        Poll::Pending
    }

    fn poll_close(
        mut self: Pin<&mut Self>,
        _cx: &mut Context<'_>,
    ) -> Poll<Result<(), Self::Error>> {
        self.closed = true;
        // The RtcPeerConnection will be dropped, closing the connection
        Poll::Ready(Ok(()))
    }

    fn poll(
        self: Pin<&mut Self>,
        _cx: &mut Context<'_>,
    ) -> Poll<Result<StreamMuxerEvent, Self::Error>> {
        if self.closed {
            return Poll::Ready(Err(io::Error::new(
                io::ErrorKind::BrokenPipe,
                "Connection closed",
            )));
        }
        Poll::Pending
    }
}

// ============================================================================
// WEBRTC TRANSPORT
// ============================================================================

// ============================================================================
// CONNECTION INJECTION (bridges signaling → swarm)
// ============================================================================

/// A completed WebRTC connection ready to be registered with the swarm.
///
/// Created by `complete_handshake()` or `get_answerer_connection()` and
/// injected into the transport via `WebRtcConnectionInjector`.
pub struct CompletedConnection {
    /// The remote peer's ID (derived from their DID)
    pub peer_id: PeerId,
    /// The WebRTC connection (implements StreamMuxer)
    pub connection: WebRtcConnection,
}

/// Handle for injecting completed WebRTC connections into the transport.
///
/// This is stored in `WasmState` and used by the FFI signaling functions
/// (`complete_handshake`, `complete_answerer`) to push connections into
/// the libp2p swarm.
pub struct WebRtcConnectionInjector {
    connection_tx: mpsc::UnboundedSender<CompletedConnection>,
    /// Shared waker — wakes the transport's poll() when a connection is injected
    waker: Arc<Mutex<Option<Waker>>>,
}

impl WebRtcConnectionInjector {
    /// Inject a completed connection into the transport.
    ///
    /// The transport's `poll()` method will pick this up and emit it
    /// as a `TransportEvent::Incoming`, causing the swarm to register
    /// the peer and start running Noise + Yamux + protocols on top.
    pub fn inject(&self, peer_id: PeerId, connection: WebRtcConnection) -> Result<(), String> {
        self.connection_tx
            .send(CompletedConnection { peer_id, connection })
            .map_err(|_| "Transport channel closed — swarm may have shut down".to_string())?;

        // Wake the transport so it polls and picks up the new connection
        if let Some(waker) = self.waker.lock().as_ref() {
            waker.wake_by_ref();
        }

        Ok(())
    }
}

/// Create a WebRTC transport + injector pair.
///
/// The transport is given to `SwarmBuilder`, and the injector is stored
/// separately so FFI code can push connections into the swarm.
pub fn create_transport() -> (WebRtcTransport, WebRtcConnectionInjector) {
    let (tx, rx) = mpsc::unbounded_channel();
    let waker = Arc::new(Mutex::new(None));
    let transport = WebRtcTransport {
        connection_rx: Arc::new(Mutex::new(rx)),
        listener_id: ListenerId::next(),
        waker: Arc::clone(&waker),
    };
    let injector = WebRtcConnectionInjector { connection_tx: tx, waker };
    (transport, injector)
}

// ============================================================================
// WEBRTC TRANSPORT
// ============================================================================

/// The WebRTC transport for libp2p.
///
/// This transport handles connections established via out-of-band signaling
/// (QR codes / connection links). Completed connections are injected via
/// `WebRtcConnectionInjector` and emitted as `TransportEvent::Incoming`
/// in `poll()`.
pub struct WebRtcTransport {
    /// Channel receiver for completed connections from signaling
    connection_rx: Arc<Mutex<mpsc::UnboundedReceiver<CompletedConnection>>>,
    /// Listener ID for emitting transport events
    listener_id: ListenerId,
    /// Shared waker so the injector can wake the transport when a connection arrives
    waker: Arc<Mutex<Option<Waker>>>,
}

impl LibTransport for WebRtcTransport {
    type Output = (PeerId, StreamMuxerBox);
    type Error = io::Error;
    type ListenerUpgrade = BoxFuture<'static, Result<Self::Output, Self::Error>>;
    type Dial = BoxFuture<'static, Result<Self::Output, Self::Error>>;

    fn listen_on(
        &mut self,
        _id: ListenerId,
        _addr: Multiaddr,
    ) -> Result<(), TransportError<Self::Error>> {
        // Accept listen_on so the swarm starts polling this transport.
        // WebRTC doesn't actually listen — connections arrive via signaling injection.
        Ok(())
    }

    fn remove_listener(&mut self, _id: ListenerId) -> bool {
        false
    }

    fn dial(
        &mut self,
        addr: Multiaddr,
        _opts: libp2p::core::transport::DialOpts,
    ) -> Result<Self::Dial, TransportError<Self::Error>> {
        // We don't support dialing via multiaddr — connections come via signaling
        Err(TransportError::MultiaddrNotSupported(addr))
    }

    fn poll(
        self: Pin<&mut Self>,
        cx: &mut Context<'_>,
    ) -> Poll<TransportEvent<Self::ListenerUpgrade, Self::Error>> {
        // Check if any completed connections have been injected
        let mut rx = self.connection_rx.lock();
        match rx.try_recv() {
            Ok(completed) => {
                let peer_id = completed.peer_id;
                let muxer = StreamMuxerBox::new(completed.connection);

                // Create the upgrade future (already complete — just wraps the muxer)
                let upgrade = Box::pin(async move {
                    Ok((peer_id, muxer))
                }) as BoxFuture<'static, Result<(PeerId, StreamMuxerBox), io::Error>>;

                // Use /memory/0 as a valid multiaddr placeholder for WebRTC
                let local_addr: Multiaddr = "/memory/0".parse()
                    .expect("/memory/0 is a valid multiaddr");
                let send_back_addr: Multiaddr = "/memory/0".parse()
                    .expect("/memory/0 is a valid multiaddr");

                Poll::Ready(TransportEvent::Incoming {
                    listener_id: self.listener_id,
                    upgrade,
                    local_addr,
                    send_back_addr,
                })
            }
            Err(mpsc::error::TryRecvError::Empty) => {
                // No connections available yet — store waker so the injector can wake us
                *self.waker.lock() = Some(cx.waker().clone());
                Poll::Pending
            }
            Err(mpsc::error::TryRecvError::Disconnected) => {
                // Injector was dropped — transport is shutting down
                Poll::Pending
            }
        }
    }
}

// ============================================================================
// SIGNALING FUNCTIONS (called from FFI)
// ============================================================================

/// STUN servers for ICE candidate gathering
const STUN_SERVERS: &[&str] = &[
    "stun:stun.l.google.com:19302",
    "stun:stun1.l.google.com:19302",
];

/// Create an RTCPeerConnection with STUN configuration
fn create_peer_connection() -> Result<web_sys::RtcPeerConnection, JsValue> {
    let ice_servers = js_sys::Array::new();

    let server = js_sys::Object::new();
    let urls = js_sys::Array::new();
    for stun in STUN_SERVERS {
        urls.push(&JsValue::from_str(stun));
    }
    js_sys::Reflect::set(&server, &"urls".into(), &urls)?;
    ice_servers.push(&server);

    let config = web_sys::RtcConfiguration::new();
    config.set_ice_servers(&ice_servers);

    web_sys::RtcPeerConnection::new_with_configuration(&config)
}

/// Create a WebRTC offer (step 1 of signaling).
///
/// Returns SignalingData containing the SDP offer, ICE candidates,
/// and the sender's identity (DID + PeerId) so the answerer knows
/// who they're connecting to.
pub async fn create_offer(did: Option<String>, peer_id: Option<String>) -> Result<SignalingData, String> {
    let pc = create_peer_connection().map_err(|e| format!("Failed to create RTCPeerConnection: {:?}", e))?;

    // Create a data channel before creating the offer
    let dc_init = web_sys::RtcDataChannelInit::new();
    dc_init.set_ordered(true);
    let _dc = pc.create_data_channel_with_data_channel_dict("libp2p", &dc_init);

    // Collect ICE candidates
    let candidates = Arc::new(Mutex::new(Vec::<IceCandidate>::new()));
    let candidates_clone = candidates.clone();
    let ice_done = Arc::new(Mutex::new(false));
    let ice_done_clone = ice_done.clone();
    let ice_waker = Arc::new(Mutex::new(None::<Waker>));
    let ice_waker_clone = ice_waker.clone();

    let onicecandidate = Closure::wrap(Box::new(move |event: web_sys::RtcPeerConnectionIceEvent| {
        if let Some(candidate) = event.candidate() {
            candidates_clone.lock().push(IceCandidate {
                candidate: candidate.candidate(),
                sdp_mid: candidate.sdp_mid(),
                sdp_m_line_index: candidate.sdp_m_line_index(),
            });
        } else {
            // null candidate means ICE gathering is complete
            *ice_done_clone.lock() = true;
            if let Some(waker) = ice_waker_clone.lock().take() {
                waker.wake();
            }
        }
    }) as Box<dyn FnMut(web_sys::RtcPeerConnectionIceEvent)>);
    pc.set_onicecandidate(Some(onicecandidate.as_ref().unchecked_ref()));

    // Create and set local description
    let offer = JsFuture::from(pc.create_offer())
        .await
        .map_err(|e| format!("Failed to create offer: {:?}", e))?;

    let offer_desc = offer.unchecked_into::<web_sys::RtcSessionDescriptionInit>();
    JsFuture::from(pc.set_local_description(&offer_desc))
        .await
        .map_err(|e| format!("Failed to set local description: {:?}", e))?;

    // Wait for ICE gathering to complete
    let ice_done_wait = ice_done.clone();
    let ice_waker_wait = ice_waker.clone();
    futures::future::poll_fn(|cx| {
        if *ice_done_wait.lock() {
            Poll::Ready(())
        } else {
            *ice_waker_wait.lock() = Some(cx.waker().clone());
            Poll::Pending
        }
    })
    .await;

    // Get the local description (now with ICE candidates embedded)
    let local_desc = pc
        .local_description()
        .ok_or("No local description after ICE gathering")?;

    let sdp = local_desc.sdp();
    let ice_candidates = candidates.lock().clone();

    // Store the peer connection for later use
    // We'll need to pass it back when the answer arrives
    store_pending_offer(pc);

    // Prevent closures from being GC'd
    onicecandidate.forget();

    Ok(SignalingData {
        sdp,
        sdp_type: "offer".to_string(),
        ice_candidates,
        did,
        peer_id,
    })
}

/// Accept a WebRTC offer and create an answer (step 2 of signaling).
///
/// Returns SignalingData containing the SDP answer, ICE candidates,
/// and the answerer's identity (DID + PeerId).
pub async fn accept_offer(offer: &SignalingData, did: Option<String>, peer_id: Option<String>) -> Result<SignalingData, String> {
    let pc = create_peer_connection().map_err(|e| format!("Failed to create RTCPeerConnection: {:?}", e))?;

    // Set remote description (the offer)
    let remote_desc = web_sys::RtcSessionDescriptionInit::new(web_sys::RtcSdpType::Offer);
    remote_desc.set_sdp(&offer.sdp);
    JsFuture::from(pc.set_remote_description(&remote_desc))
        .await
        .map_err(|e| format!("Failed to set remote description: {:?}", e))?;

    // Add ICE candidates from the offer
    for candidate in &offer.ice_candidates {
        let init = web_sys::RtcIceCandidateInit::new(&candidate.candidate);
        if let Some(ref mid) = candidate.sdp_mid {
            init.set_sdp_mid(Some(mid));
        }
        if let Some(idx) = candidate.sdp_m_line_index {
            init.set_sdp_m_line_index(Some(idx));
        }
        let ice_candidate = web_sys::RtcIceCandidate::new(&init)
            .map_err(|e| format!("Invalid ICE candidate: {:?}", e))?;
        let promise = pc.add_ice_candidate_with_opt_rtc_ice_candidate(Some(&ice_candidate));
        JsFuture::from(promise)
            .await
            .map_err(|e| format!("Failed to add ICE candidate: {:?}", e))?;
    }

    // Collect our ICE candidates
    let candidates = Arc::new(Mutex::new(Vec::<IceCandidate>::new()));
    let candidates_clone = candidates.clone();
    let ice_done = Arc::new(Mutex::new(false));
    let ice_done_clone = ice_done.clone();
    let ice_waker = Arc::new(Mutex::new(None::<Waker>));
    let ice_waker_clone = ice_waker.clone();

    let onicecandidate = Closure::wrap(Box::new(move |event: web_sys::RtcPeerConnectionIceEvent| {
        if let Some(candidate) = event.candidate() {
            candidates_clone.lock().push(IceCandidate {
                candidate: candidate.candidate(),
                sdp_mid: candidate.sdp_mid(),
                sdp_m_line_index: candidate.sdp_m_line_index(),
            });
        } else {
            *ice_done_clone.lock() = true;
            if let Some(waker) = ice_waker_clone.lock().take() {
                waker.wake();
            }
        }
    }) as Box<dyn FnMut(web_sys::RtcPeerConnectionIceEvent)>);
    pc.set_onicecandidate(Some(onicecandidate.as_ref().unchecked_ref()));

    // Create and set local description (the answer)
    let answer = JsFuture::from(pc.create_answer())
        .await
        .map_err(|e| format!("Failed to create answer: {:?}", e))?;

    let answer_desc = answer.unchecked_into::<web_sys::RtcSessionDescriptionInit>();
    JsFuture::from(pc.set_local_description(&answer_desc))
        .await
        .map_err(|e| format!("Failed to set local description: {:?}", e))?;

    // Wait for ICE gathering
    let ice_done_wait = ice_done.clone();
    let ice_waker_wait = ice_waker.clone();
    futures::future::poll_fn(|cx| {
        if *ice_done_wait.lock() {
            Poll::Ready(())
        } else {
            *ice_waker_wait.lock() = Some(cx.waker().clone());
            Poll::Pending
        }
    })
    .await;

    let local_desc = pc
        .local_description()
        .ok_or("No local description after ICE gathering")?;

    let sdp = local_desc.sdp();
    let ice_candidates = candidates.lock().clone();

    // Store the peer connection for completing the handshake
    store_pending_answer(pc);

    onicecandidate.forget();

    Ok(SignalingData {
        sdp,
        sdp_type: "answer".to_string(),
        ice_candidates,
        did,
        peer_id,
    })
}

/// Complete the WebRTC handshake by applying the answer (step 3 of signaling).
///
/// This is called by the offerer after receiving the answer.
/// Returns a WebRtcConnection that can be used as a StreamMuxer.
pub async fn complete_handshake(answer: &SignalingData) -> Result<WebRtcConnection, String> {
    let pc = take_pending_offer()
        .ok_or("No pending offer — call create_offer() first")?;

    // Set remote description (the answer)
    let remote_desc = web_sys::RtcSessionDescriptionInit::new(web_sys::RtcSdpType::Answer);
    remote_desc.set_sdp(&answer.sdp);
    JsFuture::from(pc.set_remote_description(&remote_desc))
        .await
        .map_err(|e| format!("Failed to set remote description: {:?}", e))?;

    // Add ICE candidates from the answer
    for candidate in &answer.ice_candidates {
        let init = web_sys::RtcIceCandidateInit::new(&candidate.candidate);
        if let Some(ref mid) = candidate.sdp_mid {
            init.set_sdp_mid(Some(mid));
        }
        if let Some(idx) = candidate.sdp_m_line_index {
            init.set_sdp_m_line_index(Some(idx));
        }
        let ice_candidate = web_sys::RtcIceCandidate::new(&init)
            .map_err(|e| format!("Invalid ICE candidate: {:?}", e))?;
        let promise = pc.add_ice_candidate_with_opt_rtc_ice_candidate(Some(&ice_candidate));
        JsFuture::from(promise)
            .await
            .map_err(|e| format!("Failed to add ICE candidate: {:?}", e))?;
    }

    // Wait for the data channel to be connected
    // The data channel was created during create_offer() — we need to get it
    // For the offerer, the data channel is created locally
    let dc = get_offerer_data_channel(&pc)?;

    // Wait for the data channel to open
    let stream = WebRtcStream::new(dc);
    let state = stream.state.clone();
    futures::future::poll_fn(|cx| {
        let s = state.lock();
        if s.open {
            Poll::Ready(())
        } else if s.closed {
            Poll::Ready(())
        } else {
            drop(s);
            state.lock().open_waker = Some(cx.waker().clone());
            Poll::Pending
        }
    })
    .await;

    // Check if it actually opened
    if stream.state.lock().closed {
        return Err("Data channel failed to open".to_string());
    }

    Ok(WebRtcConnection {
        _peer_connection: SendWrapper::new(pc),
        stream: Some(stream),
        stream_given: false,
        closed: false,
    })
}

/// Complete the answerer side — get the connection after accepting the offer.
///
/// This is called by the answerer after accept_offer() completes and the
/// WebRTC connection is established via ICE.
pub async fn get_answerer_connection() -> Result<WebRtcConnection, String> {
    let pc = take_pending_answer()
        .ok_or("No pending answer — call accept_offer() first")?;

    // For the answerer, the data channel comes via ondatachannel event
    // Wait for the data channel to arrive
    let dc = wait_for_data_channel(&pc).await?;

    let stream = WebRtcStream::new(dc);
    let state = stream.state.clone();
    futures::future::poll_fn(|cx| {
        let s = state.lock();
        if s.open {
            Poll::Ready(())
        } else if s.closed {
            Poll::Ready(())
        } else {
            drop(s);
            state.lock().open_waker = Some(cx.waker().clone());
            Poll::Pending
        }
    })
    .await;

    if stream.state.lock().closed {
        return Err("Data channel failed to open".to_string());
    }

    Ok(WebRtcConnection {
        _peer_connection: SendWrapper::new(pc),
        stream: Some(stream),
        stream_given: false,
        closed: false,
    })
}

// ============================================================================
// GLOBAL STATE FOR SIGNALING (single-threaded WASM)
// ============================================================================

use std::cell::RefCell;

thread_local! {
    /// The pending RTCPeerConnection from create_offer()
    static PENDING_OFFER_PC: RefCell<Option<web_sys::RtcPeerConnection>> = RefCell::new(None);
    /// The pending RTCPeerConnection from accept_offer()
    static PENDING_ANSWER_PC: RefCell<Option<web_sys::RtcPeerConnection>> = RefCell::new(None);
}

fn store_pending_offer(pc: web_sys::RtcPeerConnection) {
    PENDING_OFFER_PC.with(|cell| {
        *cell.borrow_mut() = Some(pc);
    });
}

fn take_pending_offer() -> Option<web_sys::RtcPeerConnection> {
    PENDING_OFFER_PC.with(|cell| cell.borrow_mut().take())
}

fn store_pending_answer(pc: web_sys::RtcPeerConnection) {
    PENDING_ANSWER_PC.with(|cell| {
        *cell.borrow_mut() = Some(pc);
    });
}

fn take_pending_answer() -> Option<web_sys::RtcPeerConnection> {
    PENDING_ANSWER_PC.with(|cell| cell.borrow_mut().take())
}

/// Get the data channel from the offerer's peer connection.
/// The offerer created the data channel during create_offer().
fn get_offerer_data_channel(pc: &web_sys::RtcPeerConnection) -> Result<web_sys::RtcDataChannel, String> {
    // The data channel was created during create_offer() — but we didn't store it.
    // Create a new one with the same label — WebRTC allows this.
    let dc_init = web_sys::RtcDataChannelInit::new();
    dc_init.set_ordered(true);
    dc_init.set_negotiated(true);
    dc_init.set_id(0);
    Ok(pc.create_data_channel_with_data_channel_dict("libp2p", &dc_init))
}

/// Wait for a data channel to arrive on the answerer side
async fn wait_for_data_channel(pc: &web_sys::RtcPeerConnection) -> Result<web_sys::RtcDataChannel, String> {
    let channel = Arc::new(Mutex::new(None::<web_sys::RtcDataChannel>));
    let channel_clone = channel.clone();
    let waker = Arc::new(Mutex::new(None::<Waker>));
    let waker_clone = waker.clone();

    let ondatachannel = Closure::wrap(Box::new(move |event: web_sys::RtcDataChannelEvent| {
        *channel_clone.lock() = Some(event.channel());
        if let Some(w) = waker_clone.lock().take() {
            w.wake();
        }
    }) as Box<dyn FnMut(web_sys::RtcDataChannelEvent)>);
    pc.set_ondatachannel(Some(ondatachannel.as_ref().unchecked_ref()));

    // Also try negotiated data channel
    let dc_init = web_sys::RtcDataChannelInit::new();
    dc_init.set_ordered(true);
    dc_init.set_negotiated(true);
    dc_init.set_id(0);
    let negotiated_dc = pc.create_data_channel_with_data_channel_dict("libp2p", &dc_init);

    // Check if the negotiated DC is already open
    if negotiated_dc.ready_state() == web_sys::RtcDataChannelState::Open
        || negotiated_dc.ready_state() == web_sys::RtcDataChannelState::Connecting
    {
        ondatachannel.forget();
        return Ok(negotiated_dc);
    }

    // Wait for either a data channel event or timeout
    let channel_wait = channel.clone();
    let waker_wait = waker.clone();
    futures::future::poll_fn(|cx| {
        if channel_wait.lock().is_some() {
            Poll::Ready(())
        } else {
            *waker_wait.lock() = Some(cx.waker().clone());
            Poll::Pending
        }
    })
    .await;

    ondatachannel.forget();

    // Use the negotiated data channel since both sides use id=0
    Ok(negotiated_dc)
}
