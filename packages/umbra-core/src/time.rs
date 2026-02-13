/// Platform-aware time utilities.
///
/// On native platforms, this uses `chrono::Utc::now()`.
/// On WASM, this uses `js_sys::Date::now()` since `std::time::SystemTime`
/// is not available on `wasm32-unknown-unknown`.

/// Returns the current Unix timestamp in seconds.
pub fn now_timestamp() -> i64 {
    #[cfg(target_arch = "wasm32")]
    {
        (js_sys::Date::now() / 1000.0) as i64
    }
    #[cfg(not(target_arch = "wasm32"))]
    {
        chrono::Utc::now().timestamp()
    }
}

/// Returns the current Unix timestamp in milliseconds.
pub fn now_timestamp_millis() -> i64 {
    #[cfg(target_arch = "wasm32")]
    {
        js_sys::Date::now() as i64
    }
    #[cfg(not(target_arch = "wasm32"))]
    {
        chrono::Utc::now().timestamp_millis()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_now_timestamp_is_reasonable() {
        let ts = now_timestamp();
        // Should be after 2024-01-01 (1704067200)
        assert!(ts > 1704067200, "Timestamp {} is too old", ts);
        // Should be before 2100-01-01 (4102444800)
        assert!(ts < 4102444800, "Timestamp {} is too far in future", ts);
    }

    #[test]
    fn test_now_timestamp_millis_is_reasonable() {
        let ts = now_timestamp_millis();
        // Should be after 2024-01-01 in millis
        assert!(ts > 1704067200_000, "Timestamp {} is too old", ts);
    }
}
