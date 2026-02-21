mod state;
mod commands;

use state::AppState;

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
