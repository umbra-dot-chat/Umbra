//! # umbra-trace-macro
//!
//! Proc macro crate providing `#[trace_ffi]` for zero-cost FFI tracing.
//!
//! When the `debug-trace` feature is enabled on `umbra-core`, each annotated
//! function emits `tracing::info!` events on entry (`FFI_ENTER`) and exit
//! (`FFI_EXIT`). When the feature is disabled, the attribute compiles away
//! completely — zero overhead.

use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, FnArg, ItemFn, Pat, ReturnType, Type};

/// Classify a parameter type for byte-size computation.
enum ArgKind {
    /// `String` or `&str` — use `.len()`
    StringLike,
    /// `Vec<u8>` or `&[u8]` — use `.len()`
    BytesLike,
    /// Numeric primitive — use `std::mem::size_of_val`
    Numeric,
    /// `JsValue`, `js_sys::Function`, or other opaque types — skip
    Skipped,
}

fn classify_type(ty: &Type) -> ArgKind {
    match ty {
        Type::Reference(r) => {
            // &str
            if let Type::Path(p) = &*r.elem {
                let seg = p.path.segments.last().map(|s| s.ident.to_string());
                if seg.as_deref() == Some("str") {
                    return ArgKind::StringLike;
                }
            }
            // &[u8]
            if let Type::Slice(s) = &*r.elem {
                if is_u8_type(&s.elem) {
                    return ArgKind::BytesLike;
                }
            }
            ArgKind::Skipped
        }
        Type::Path(p) => {
            let seg = p.path.segments.last().map(|s| s.ident.to_string());
            match seg.as_deref() {
                Some("String") => ArgKind::StringLike,
                Some("JsValue" | "Function" | "Promise") => ArgKind::Skipped,
                Some(
                    "u8" | "u16" | "u32" | "u64" | "u128" | "usize" | "i8" | "i16" | "i32"
                    | "i64" | "i128" | "isize" | "f32" | "f64" | "bool",
                ) => ArgKind::Numeric,
                Some("Vec") => {
                    // Check if Vec<u8>
                    if let Some(last) = p.path.segments.last() {
                        if let syn::PathArguments::AngleBracketed(args) = &last.arguments {
                            if let Some(syn::GenericArgument::Type(inner)) = args.args.first() {
                                if is_u8_type(inner) {
                                    return ArgKind::BytesLike;
                                }
                            }
                        }
                    }
                    ArgKind::Skipped
                }
                Some("Option") => {
                    // Option<String> — skip for simplicity (optional args)
                    ArgKind::Skipped
                }
                _ => ArgKind::Skipped,
            }
        }
        _ => ArgKind::Skipped,
    }
}

fn is_u8_type(ty: &Type) -> bool {
    if let Type::Path(p) = ty {
        p.path.segments.last().map(|s| s.ident == "u8").unwrap_or(false)
    } else {
        false
    }
}

/// Attribute macro that wraps a `#[wasm_bindgen]` function with entry/exit
/// tracing, gated behind `#[cfg(feature = "debug-trace")]`.
///
/// Place `#[trace_ffi]` **above** `#[wasm_bindgen]`:
///
/// ```ignore
/// #[trace_ffi]
/// #[wasm_bindgen]
/// pub fn umbra_wasm_foo(json: &str) -> Result<JsValue, JsValue> { ... }
/// ```
#[proc_macro_attribute]
pub fn trace_ffi(_attr: TokenStream, item: TokenStream) -> TokenStream {
    let input = parse_macro_input!(item as ItemFn);

    let fn_name = &input.sig.ident;
    let fn_name_str = fn_name.to_string();
    let vis = &input.vis;
    let attrs = &input.attrs;
    let sig = &input.sig;
    let body = &input.block;
    let ret_type = &sig.output;

    // Build arg_bytes computation statements
    let mut arg_byte_stmts = Vec::new();
    let mut has_measurable_args = false;

    for arg in &sig.inputs {
        if let FnArg::Typed(pat_type) = arg {
            let pat = &pat_type.pat;
            let ty = &pat_type.ty;

            // Extract the identifier name from the pattern
            let ident = match pat.as_ref() {
                Pat::Ident(pi) => &pi.ident,
                _ => continue,
            };

            match classify_type(ty) {
                ArgKind::StringLike => {
                    has_measurable_args = true;
                    arg_byte_stmts.push(quote! { + #ident.len() });
                }
                ArgKind::BytesLike => {
                    has_measurable_args = true;
                    arg_byte_stmts.push(quote! { + #ident.len() });
                }
                ArgKind::Numeric => {
                    has_measurable_args = true;
                    arg_byte_stmts.push(quote! { + std::mem::size_of_val(&#ident) });
                }
                ArgKind::Skipped => {}
            }
        }
    }

    // Build the arg_bytes line
    let arg_bytes_expr = if has_measurable_args {
        quote! {
            let _arg_bytes: usize = 0 #(#arg_byte_stmts)*;
            tracing::info!(fn_name = #fn_name_str, arg_bytes = _arg_bytes, "FFI_ENTER");
        }
    } else {
        quote! {
            tracing::info!(fn_name = #fn_name_str, "FFI_ENTER");
        }
    };

    // Determine if the return type is a Result or not to decide wrapping strategy
    let is_result_or_promise = match ret_type {
        ReturnType::Default => false,
        ReturnType::Type(_, ty) => {
            // Check for Result<...> or Promise
            if let Type::Path(p) = ty.as_ref() {
                let seg = p.path.segments.last().map(|s| s.ident.to_string());
                matches!(seg.as_deref(), Some("Result" | "Promise"))
            } else {
                false
            }
        }
    };

    // For all cases, we wrap in a closure. The closure approach works
    // universally — it captures the return value so we can log FFI_EXIT.
    let wrapped = if is_result_or_promise || matches!(ret_type, ReturnType::Type(_, _)) {
        // Has a return type — capture result
        quote! {
            #(#attrs)*
            #vis #sig {
                #[cfg(feature = "debug-trace")]
                {
                    #arg_bytes_expr
                }
                let _trace_result = (move || #body)();
                #[cfg(feature = "debug-trace")]
                tracing::info!(fn_name = #fn_name_str, "FFI_EXIT");
                _trace_result
            }
        }
    } else {
        // No return type (-> ())
        quote! {
            #(#attrs)*
            #vis #sig {
                #[cfg(feature = "debug-trace")]
                {
                    #arg_bytes_expr
                }
                let _trace_result = (move || #body)();
                #[cfg(feature = "debug-trace")]
                tracing::info!(fn_name = #fn_name_str, "FFI_EXIT");
                _trace_result
            }
        }
    };

    wrapped.into()
}
