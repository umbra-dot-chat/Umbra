mod state;
mod commands;

use state::AppState;
use tauri::webview::NewWindowResponse;
use tauri::window::Color;
use tauri::WebviewUrl;

pub fn run() {
    // Set up tracing for native desktop
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info,umbra_core=debug".into()),
        )
        .init();

    tracing::info!("Starting Umbra Desktop v{}", umbra_core::version());

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_deep_link::init())
        .setup(|app| {
            let handle = app.handle().clone();
            let handle2 = handle.clone();

            // Build the main window+webview manually so we can attach navigation handlers.
            // The window config was removed from tauri.conf.json to enable this.
            let window = tauri::WebviewWindowBuilder::new(app, "main", WebviewUrl::default())
                .title("Umbra")
                .inner_size(1280.0, 800.0)
                .resizable(true)
                .fullscreen(false)
                .title_bar_style(tauri::TitleBarStyle::Overlay)
                .hidden_title(true)
                .decorations(true)
                .theme(Some(tauri::Theme::Dark))
                // Block external navigations — open them in the system browser instead.
                // This prevents OAuth flows (Discord, etc.) from taking over the app window.
                .on_navigation(move |url| {
                    let scheme = url.scheme();
                    let host = url.host_str().unwrap_or("");

                    // Allow internal navigations
                    if scheme == "tauri" || scheme == "asset" {
                        return true;
                    }
                    if host == "localhost" || host == "127.0.0.1" {
                        return true;
                    }

                    // External URL — open in system browser and block
                    tracing::info!("Blocking external navigation, opening in browser: {}", url);
                    let _ = tauri_plugin_shell::ShellExt::shell(&handle)
                        .open(url.as_str(), None::<tauri_plugin_shell::open::Program>);
                    false
                })
                // Handle window.open() calls — open in system browser instead of blocking.
                // This fixes OAuth popups (Discord sign-in, bot invite, etc.).
                .on_new_window(move |url, _features| {
                    tracing::info!("Intercepting window.open, opening in browser: {}", url);
                    let _ = tauri_plugin_shell::ShellExt::shell(&handle2)
                        .open(url.as_str(), None::<tauri_plugin_shell::open::Program>);
                    NewWindowResponse::Deny
                })
                .build()?;

            let _ = window.set_background_color(Some(Color(0, 0, 0, 255)));

            Ok(())
        })
        .manage(AppState::new())
        .invoke_handler(tauri::generate_handler![
            // Initialization
            commands::identity::init,
            commands::identity::init_database,
            commands::identity::version,

            // Identity
            commands::identity::create_identity,
            commands::identity::restore_identity,
            commands::identity::set_identity,
            commands::identity::get_did,
            commands::identity::get_profile,
            commands::identity::update_profile,

            // Discovery
            commands::network::get_connection_info,
            commands::network::parse_connection_info,

            // Friends
            commands::friends::send_friend_request,
            commands::friends::accept_friend_request,
            commands::friends::reject_friend_request,
            commands::friends::list_friends,
            commands::friends::pending_requests,
            commands::friends::remove_friend,
            commands::friends::block_user,
            commands::friends::unblock_user,

            // Messaging (core)
            commands::messaging::get_conversations,
            commands::messaging::get_messages,
            commands::messaging::send_message,
            commands::messaging::mark_read,

            // Messaging (extended stubs)
            commands::messaging::edit_message,
            commands::messaging::delete_message,
            commands::messaging::pin_message,
            commands::messaging::unpin_message,
            commands::messaging::add_reaction,
            commands::messaging::remove_reaction,
            commands::messaging::forward_message,
            commands::messaging::get_thread,
            commands::messaging::reply_thread,
            commands::messaging::get_pinned,

            // Network
            commands::network::network_status,
            commands::network::start_network,
            commands::network::stop_network,
            commands::network::create_offer,
            commands::network::accept_offer,
            commands::network::complete_handshake,
            commands::network::complete_answerer,

            // Relay
            commands::network::relay_connect,
            commands::network::relay_disconnect,
            commands::network::relay_create_session,
            commands::network::relay_accept_session,
            commands::network::relay_send,
            commands::network::relay_fetch_offline,

            // Crypto
            commands::crypto::sign,
            commands::crypto::verify,

            // Plugin KV Storage
            commands::storage::plugin_kv_get,
            commands::storage::plugin_kv_set,
            commands::storage::plugin_kv_delete,
            commands::storage::plugin_kv_list,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Umbra Desktop");
}
