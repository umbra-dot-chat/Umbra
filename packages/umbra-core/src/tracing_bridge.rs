//! # Tracing Bridge
//!
//! A custom `tracing::Subscriber` that captures trace events into a
//! thread-safe ring buffer. On WASM this buffer is drained by
//! `flush_trace_events()` (exposed via `#[wasm_bindgen]`) and sent
//! to the debug TUI over WebSocket.
//!
//! ## Design
//!
//! - Ring buffer capacity: 5000 events (oldest dropped on overflow).
//! - Timestamps are set to `0.0` on the Rust side; the JS caller
//!   stamps them with `performance.now()` during polling.
//! - On WASM (single-threaded) the `Mutex` is uncontended.
//! - On native builds the module compiles but is unused.

use std::collections::VecDeque;
use std::sync::{Arc, Mutex};

/// A single trace event captured from the `tracing` crate.
#[derive(Debug, Clone, serde::Serialize)]
pub struct TraceEvent {
    /// Log level (TRACE, DEBUG, INFO, WARN, ERROR).
    pub level: String,
    /// The module/target that emitted the event.
    pub target: String,
    /// Formatted message string.
    pub message: String,
    /// Formatted key=value fields (excluding `message`).
    pub fields: String,
    /// Timestamp in milliseconds. Set to `0.0` on the Rust side;
    /// the JS poller overwrites with `performance.now()`.
    pub timestamp_ms: f64,
}

/// Shared ring buffer of captured trace events.
#[derive(Debug, Clone)]
pub struct TraceBuffer {
    inner: Arc<Mutex<VecDeque<TraceEvent>>>,
}

const BUFFER_CAPACITY: usize = 5000;

impl TraceBuffer {
    /// Create a new empty trace buffer.
    pub fn new() -> Self {
        Self {
            inner: Arc::new(Mutex::new(VecDeque::with_capacity(BUFFER_CAPACITY))),
        }
    }

    /// Push an event into the ring buffer, dropping the oldest if full.
    pub fn push(&self, event: TraceEvent) {
        if let Ok(mut buf) = self.inner.lock() {
            if buf.len() >= BUFFER_CAPACITY {
                buf.pop_front();
            }
            buf.push_back(event);
        }
    }

    /// Drain all events from the buffer and return them.
    pub fn drain(&self) -> Vec<TraceEvent> {
        if let Ok(mut buf) = self.inner.lock() {
            buf.drain(..).collect()
        } else {
            Vec::new()
        }
    }
}

impl Default for TraceBuffer {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================================================
// Tracing Subscriber
// ============================================================================

/// A `tracing::Subscriber` that writes events to a `TraceBuffer` and
/// optionally forwards them to the browser console (WASM only).
pub struct BridgeSubscriber {
    buffer: TraceBuffer,
    max_level: tracing::Level,
}

impl BridgeSubscriber {
    /// Create a new bridge subscriber.
    pub fn new(buffer: TraceBuffer, max_level: tracing::Level) -> Self {
        Self { buffer, max_level }
    }

    /// Get a clone of the underlying buffer handle.
    pub fn buffer(&self) -> TraceBuffer {
        self.buffer.clone()
    }
}

impl tracing::Subscriber for BridgeSubscriber {
    fn enabled(&self, metadata: &tracing::Metadata<'_>) -> bool {
        metadata.level() <= &self.max_level
    }

    fn new_span(&self, _span: &tracing::span::Attributes<'_>) -> tracing::span::Id {
        // We don't track spans -- return a dummy ID.
        tracing::span::Id::from_u64(1)
    }

    fn record(&self, _span: &tracing::span::Id, _values: &tracing::span::Record<'_>) {
        // No-op: we only capture events, not span field updates.
    }

    fn record_follows_from(
        &self,
        _span: &tracing::span::Id,
        _follows: &tracing::span::Id,
    ) {
        // No-op.
    }

    fn event(&self, event: &tracing::Event<'_>) {
        let metadata = event.metadata();
        let level = metadata.level().to_string();
        let target = metadata.target().to_string();

        // Extract message and other fields.
        let mut visitor = FieldVisitor::default();
        event.record(&mut visitor);

        let trace_event = TraceEvent {
            level,
            target,
            message: visitor.message,
            fields: visitor.fields,
            timestamp_ms: 0.0,
        };

        // Log to browser console on WASM for parity with tracing-wasm.
        #[cfg(target_arch = "wasm32")]
        {
            let console_msg = if trace_event.fields.is_empty() {
                format!(
                    "[{}] {}: {}",
                    trace_event.level, trace_event.target, trace_event.message
                )
            } else {
                format!(
                    "[{}] {}: {} {{ {} }}",
                    trace_event.level,
                    trace_event.target,
                    trace_event.message,
                    trace_event.fields
                )
            };
            match metadata.level() {
                &tracing::Level::ERROR => web_sys::console::error_1(
                    &wasm_bindgen::JsValue::from_str(&console_msg),
                ),
                &tracing::Level::WARN => web_sys::console::warn_1(
                    &wasm_bindgen::JsValue::from_str(&console_msg),
                ),
                _ => web_sys::console::log_1(
                    &wasm_bindgen::JsValue::from_str(&console_msg),
                ),
            }
        }

        self.buffer.push(trace_event);
    }

    fn enter(&self, _span: &tracing::span::Id) {
        // No-op.
    }

    fn exit(&self, _span: &tracing::span::Id) {
        // No-op.
    }
}

// ============================================================================
// Field visitor
// ============================================================================

/// Extracts `message` and other fields from a tracing event.
#[derive(Default)]
struct FieldVisitor {
    message: String,
    fields: String,
}

impl tracing::field::Visit for FieldVisitor {
    fn record_debug(&mut self, field: &tracing::field::Field, value: &dyn std::fmt::Debug) {
        if field.name() == "message" {
            self.message = format!("{:?}", value);
        } else {
            if !self.fields.is_empty() {
                self.fields.push_str(", ");
            }
            self.fields.push_str(&format!("{}={:?}", field.name(), value));
        }
    }

    fn record_str(&mut self, field: &tracing::field::Field, value: &str) {
        if field.name() == "message" {
            self.message = value.to_string();
        } else {
            if !self.fields.is_empty() {
                self.fields.push_str(", ");
            }
            self.fields.push_str(&format!("{}=\"{}\"", field.name(), value));
        }
    }
}

// ============================================================================
// Global buffer accessor (WASM)
// ============================================================================

#[cfg(target_arch = "wasm32")]
use once_cell::sync::OnceCell;

/// Global trace buffer, initialized when the bridge subscriber is installed.
#[cfg(target_arch = "wasm32")]
static GLOBAL_TRACE_BUFFER: OnceCell<TraceBuffer> = OnceCell::new();

/// Install the bridge subscriber as the global default and store the
/// buffer handle for later draining via `flush_trace_events()`.
#[cfg(target_arch = "wasm32")]
pub fn install_bridge_subscriber(max_level: tracing::Level) {
    let buffer = TraceBuffer::new();
    let _ = GLOBAL_TRACE_BUFFER.set(buffer.clone());
    let subscriber = BridgeSubscriber::new(buffer, max_level);
    // tracing::subscriber::set_global_default is the only way to install
    // a subscriber without tracing-subscriber. It can only be called once.
    let _ = tracing::subscriber::set_global_default(subscriber);
}

/// Drain all buffered trace events and return them.
/// Returns an empty vec if the buffer hasn't been initialized.
#[cfg(target_arch = "wasm32")]
pub fn drain_trace_events() -> Vec<TraceEvent> {
    GLOBAL_TRACE_BUFFER
        .get()
        .map(|b| b.drain())
        .unwrap_or_default()
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_trace_buffer_push_and_drain() {
        let buf = TraceBuffer::new();
        buf.push(TraceEvent {
            level: "INFO".into(),
            target: "test".into(),
            message: "hello".into(),
            fields: String::new(),
            timestamp_ms: 0.0,
        });
        let events = buf.drain();
        assert_eq!(events.len(), 1);
        assert_eq!(events[0].message, "hello");
        // Second drain should be empty
        assert!(buf.drain().is_empty());
    }

    #[test]
    fn test_trace_buffer_capacity_overflow() {
        let buf = TraceBuffer::new();
        for i in 0..5010 {
            buf.push(TraceEvent {
                level: "DEBUG".into(),
                target: "test".into(),
                message: format!("msg-{}", i),
                fields: String::new(),
                timestamp_ms: 0.0,
            });
        }
        let events = buf.drain();
        assert_eq!(events.len(), 5000);
        // First event should be msg-10 (0..9 were dropped)
        assert_eq!(events[0].message, "msg-10");
    }

    #[test]
    fn test_field_visitor_message() {
        let mut visitor = FieldVisitor::default();
        use tracing::field::Visit;
        // Simulate recording a "message" field
        let field_set = tracing::field::FieldSet::new(
            &["message"],
            tracing::callsite::Identifier(&TestCallsite),
        );
        let field = field_set.field("message").unwrap();
        visitor.record_str(&field, "test message");
        assert_eq!(visitor.message, "test message");
        assert!(visitor.fields.is_empty());
    }

    // Minimal callsite for tests
    struct TestCallsite;
    impl tracing::callsite::Callsite for TestCallsite {
        fn set_interest(&self, _: tracing::subscriber::Interest) {}
        fn metadata(&self) -> &tracing::Metadata<'_> {
            static META: tracing::Metadata<'static> = tracing::Metadata::new(
                "test",
                "test",
                tracing::Level::INFO,
                Some(file!()),
                Some(line!()),
                Some(module_path!()),
                tracing::field::FieldSet::new(
                    &["message"],
                    tracing::callsite::Identifier(&TestCallsite),
                ),
                tracing::metadata::Kind::EVENT,
            );
            &META
        }
    }
}
