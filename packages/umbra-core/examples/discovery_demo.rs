//! # Discovery Module Demo
//!
//! This example demonstrates peer discovery and connection sharing:
//! 1. Generate shareable connection info for QR codes/links
//! 2. Parse connection info from a link
//! 3. Validate connection data
//!
//! ## Run
//!
//! ```bash
//! cargo run --example discovery_demo
//! ```

use umbra_core::discovery::{
    ConnectionInfo, DiscoveryConfig, DiscoveryService, CONNECTION_INFO_VERSION,
};

fn main() {
    println!("=================================================");
    println!("          UMBRA DISCOVERY MODULE DEMO");
    println!("=================================================\n");

    // =========================================================================
    // STEP 1: Create connection info manually (simulating network service)
    // =========================================================================
    println!("1. Creating connection info for sharing...\n");

    // In production, this would come from Identity + NetworkService
    // Here we create it manually for demonstration
    let connection_info = ConnectionInfo::new(
        "did:key:z6MkhaXgBZDvotDUGRy7K9L7M2yvCpREH5Y5yCCpREH5Y5yC".to_string(),
        "12D3KooWGzh7bPVdRtQKDyNJrCwANqgBQxmXLCqf7MBwxwGE1234".to_string(),
        vec![
            "/ip4/192.168.1.100/tcp/4001".to_string(),
            "/ip4/1.2.3.4/tcp/4001".to_string(),
        ],
        "Alice".to_string(),
    );

    println!("   Version: {}", connection_info.version);
    println!("   DID: {}", connection_info.did);
    println!("   Peer ID: {}", connection_info.peer_id);
    println!("   Display Name: {}", connection_info.display_name);
    println!("   Addresses:");
    for addr in &connection_info.addresses {
        println!("     - {}", addr);
    }
    println!("   Timestamp: {}", connection_info.timestamp);
    println!();

    // =========================================================================
    // STEP 2: Generate shareable link
    // =========================================================================
    println!("2. Generating shareable link (umbra:// protocol)...\n");

    let link = connection_info.to_link().expect("Failed to generate link");

    println!("   Link: {}", link);
    println!("   Link length: {} characters", link.len());
    println!();
    println!("   This link can be:");
    println!("   - Shared via messaging apps");
    println!("   - Encoded as a QR code");
    println!("   - Posted on social media");
    println!();

    // =========================================================================
    // STEP 3: Generate base64 for compact sharing
    // =========================================================================
    println!("3. Generating base64 encoding...\n");

    let base64 = connection_info
        .to_base64()
        .expect("Failed to generate base64");

    println!("   Base64: {}...", &base64[..60]);
    println!("   Base64 length: {} characters", base64.len());
    println!();

    // =========================================================================
    // STEP 4: Parse connection info from link
    // =========================================================================
    println!("4. Parsing connection info from link...\n");

    let parsed = ConnectionInfo::from_link(&link).expect("Failed to parse link");

    println!("   Parsed successfully!");
    println!("   DID matches: {}", parsed.did == connection_info.did);
    println!(
        "   Peer ID matches: {}",
        parsed.peer_id == connection_info.peer_id
    );
    println!(
        "   Name matches: {}",
        parsed.display_name == connection_info.display_name
    );
    println!();

    // =========================================================================
    // STEP 5: Demonstrate JSON serialization
    // =========================================================================
    println!("5. JSON serialization...\n");

    let json = connection_info
        .to_json()
        .expect("Failed to serialize to JSON");

    println!("   JSON (pretty-printed):");
    let pretty: serde_json::Value = serde_json::from_str(&json).unwrap();
    println!("{}", serde_json::to_string_pretty(&pretty).unwrap());
    println!();

    // =========================================================================
    // STEP 6: Demonstrate expiry checking
    // =========================================================================
    println!("6. Connection info expiry...\n");

    // Current info should not be expired
    let max_age = 3600; // 1 hour
    if connection_info.is_expired(max_age) {
        println!(
            "   Connection info has expired (older than {} seconds)",
            max_age
        );
    } else {
        println!(
            "   Connection info is still valid (within {} seconds)",
            max_age
        );
    }
    println!();

    // =========================================================================
    // STEP 7: DHT key derivation
    // =========================================================================
    println!("7. DHT key derivation from DID...\n");

    let did = "did:key:z6MkhaXgBZDvotDUGRy7K9L7M2yvCpREH5Y5yCCpREH5Y5yC";
    let dht_key = DiscoveryService::did_to_dht_key(did);

    println!("   DID: {}", did);
    println!("   DHT Key (SHA256 hash): {}", hex::encode(dht_key));
    println!();
    println!("   The DHT key is used to:");
    println!("   - Announce peer presence on the network");
    println!("   - Look up peers by their DID");
    println!("   - Store routing information in Kademlia DHT");
    println!();

    // =========================================================================
    // STEP 8: Discovery configuration
    // =========================================================================
    println!("8. Discovery configuration options...\n");

    let config = DiscoveryConfig::default();

    println!("   Default configuration:");
    println!("   - Bootstrap nodes: {:?}", config.bootstrap_nodes);
    println!("   - DHT enabled: {}", config.enable_dht);
    println!("   - mDNS enabled: {}", config.enable_mdns);
    println!("   - Auto-announce: {}", config.auto_announce);
    println!();

    let custom_config = DiscoveryConfig {
        bootstrap_nodes: vec![
            "/dns/bootstrap1.umbra.chat/tcp/4001/p2p/12D3Koo...".to_string(),
            "/dns/bootstrap2.umbra.chat/tcp/4001/p2p/12D3Koo...".to_string(),
        ],
        enable_dht: true,
        enable_mdns: true,
        auto_announce: true,
    };

    println!("   Custom configuration:");
    println!(
        "   - Bootstrap nodes: {} configured",
        custom_config.bootstrap_nodes.len()
    );
    println!("   - DHT enabled: {}", custom_config.enable_dht);
    println!(
        "   - mDNS enabled: {} (local network discovery)",
        custom_config.enable_mdns
    );
    println!("   - Auto-announce: {}", custom_config.auto_announce);
    println!();

    // =========================================================================
    // Summary
    // =========================================================================
    println!("=================================================");
    println!("                    SUMMARY");
    println!("=================================================\n");
    println!("  Connection Info:");
    println!(
        "  - Version {} format for forward compatibility",
        CONNECTION_INFO_VERSION
    );
    println!("  - Contains DID, PeerId, and multiaddresses");
    println!("  - Can be shared as QR codes or umbra:// links");
    println!();
    println!("  Discovery Methods:");
    println!("  - DHT lookup: Find peers by DID on the network");
    println!("  - Direct connect: Use shared connection info");
    println!("  - Bootstrap: Connect to known reliable nodes");
    println!("  - mDNS (future): Local network discovery");
    println!();
    println!("  Security:");
    println!("  - Connection info is timestamped for freshness");
    println!("  - DIDs are verifiable (contain public key)");
    println!("  - No sensitive data in connection info");
    println!();
}
