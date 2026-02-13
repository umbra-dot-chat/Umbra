//! # Friends Module Demo
//!
//! This example demonstrates the friend request and acceptance flow:
//! 1. Alice creates a friend request to Bob
//! 2. Bob verifies and accepts the request
//! 3. Both parties now have each other's encryption keys
//!
//! ## Run
//!
//! ```bash
//! cargo run --example friends_demo
//! ```

use umbra_core::identity::Identity;
use umbra_core::friends::{FriendRequest, FriendResponse, Friend};

fn main() {
    println!("=================================================");
    println!("           UMBRA FRIENDS MODULE DEMO");
    println!("=================================================\n");

    // =========================================================================
    // STEP 1: Create identities for Alice and Bob
    // =========================================================================
    println!("1. Creating identities for Alice and Bob...\n");

    let (alice_identity, _alice_recovery) = Identity::create("Alice".to_string())
        .expect("Failed to create Alice's identity");

    let (bob_identity, _bob_recovery) = Identity::create("Bob".to_string())
        .expect("Failed to create Bob's identity");

    println!("   Alice's DID: {}", alice_identity.did_string());
    println!("   Bob's DID:   {}", bob_identity.did_string());
    println!();

    // =========================================================================
    // STEP 2: Alice creates a friend request to Bob
    // =========================================================================
    println!("2. Alice creates a friend request to Bob...\n");

    let request = FriendRequest::create(
        &alice_identity,
        bob_identity.did_string(),
        Some("Hey Bob! Let's be friends!".to_string()),
    ).expect("Failed to create friend request");

    println!("   Request ID: {}", request.id);
    println!("   From: {} ({})", request.from.display_name, request.from.did);
    println!("   To: {}", request.to_did);
    println!("   Message: {:?}", request.message);
    println!("   Signature (hex): {}...", &request.signature.to_hex()[..32]);
    println!();

    // =========================================================================
    // STEP 3: Serialize request for transmission
    // =========================================================================
    println!("3. Serializing request for network transmission...\n");

    let request_json = request.to_json()
        .expect("Failed to serialize request");

    println!("   JSON size: {} bytes", request_json.len());
    println!("   (Would be sent over libp2p to Bob's peer)");
    println!();

    // =========================================================================
    // STEP 4: Bob receives and verifies the request
    // =========================================================================
    println!("4. Bob receives and verifies the request...\n");

    // Deserialize
    let received_request = FriendRequest::from_json(&request_json)
        .expect("Failed to deserialize request");

    // Verify signature
    match received_request.verify() {
        Ok(()) => println!("   [OK] Signature verification PASSED!"),
        Err(e) => println!("   [FAIL] Signature verification failed: {}", e),
    }

    // Check if expired
    if received_request.is_expired() {
        println!("   [WARN] Request has expired!");
    } else {
        println!("   [OK] Request is still valid (not expired)");
    }

    // Check it's for us
    if received_request.to_did == bob_identity.did_string() {
        println!("   [OK] Request is addressed to Bob");
    }
    println!();

    // =========================================================================
    // STEP 5: Bob accepts the request
    // =========================================================================
    println!("5. Bob accepts the friend request...\n");

    let response = FriendResponse::accept(received_request.id.clone(), &bob_identity)
        .expect("Failed to create response");

    println!("   Response accepted: {}", response.accepted);
    if let Some(ref responder) = response.responder {
        println!("   Responder: {} ({})", responder.display_name, responder.did);
    }
    println!();

    // =========================================================================
    // STEP 6: Alice receives and verifies the response
    // =========================================================================
    println!("6. Alice receives and verifies the response...\n");

    // Serialize and "transmit" the response
    let response_json = response.to_json()
        .expect("Failed to serialize response");

    let received_response = FriendResponse::from_json(&response_json)
        .expect("Failed to deserialize response");

    // Verify the response
    match received_response.verify(&bob_identity.did_string()) {
        Ok(()) => println!("   [OK] Response signature verification PASSED!"),
        Err(e) => println!("   [FAIL] Response verification failed: {}", e),
    }
    println!();

    // =========================================================================
    // STEP 7: Both parties create Friend records
    // =========================================================================
    println!("7. Creating Friend records...\n");

    // Alice creates a Friend record for Bob
    let bob_as_friend = Friend::from_public_identity(
        received_response.responder.as_ref().unwrap()
    );

    // Bob creates a Friend record for Alice
    let alice_as_friend = Friend::from_public_identity(&received_request.from);

    println!("   Alice's friend list now includes:");
    println!("   - DID: {}", bob_as_friend.did);
    println!("   - Name: {}", bob_as_friend.display_name);
    println!("   - Signing key: {}...", hex::encode(&bob_as_friend.signing_public_key[..8]));
    println!("   - Encryption key: {}...", hex::encode(&bob_as_friend.encryption_public_key[..8]));
    println!();

    println!("   Bob's friend list now includes:");
    println!("   - DID: {}", alice_as_friend.did);
    println!("   - Name: {}", alice_as_friend.display_name);
    println!("   - Signing key: {}...", hex::encode(&alice_as_friend.signing_public_key[..8]));
    println!("   - Encryption key: {}...", hex::encode(&alice_as_friend.encryption_public_key[..8]));
    println!();

    // =========================================================================
    // STEP 8: Demonstrate tamper detection
    // =========================================================================
    println!("8. Demonstrating tamper detection...\n");

    // Create a tampered request
    let mut tampered_request = FriendRequest::create(
        &alice_identity,
        bob_identity.did_string(),
        Some("Original message".to_string()),
    ).expect("Failed to create request");

    // Tamper with it
    tampered_request.message = Some("Send me your private keys!".to_string());

    match tampered_request.verify() {
        Ok(()) => println!("   [FAIL] Tampered request was accepted!"),
        Err(_) => println!("   [OK] Tampered request was REJECTED!"),
    }
    println!();

    // =========================================================================
    // STEP 9: Demonstrate self-add prevention
    // =========================================================================
    println!("9. Demonstrating self-add prevention...\n");

    match FriendRequest::create(
        &alice_identity,
        alice_identity.did_string(), // Alice trying to add herself
        None,
    ) {
        Ok(_) => println!("   [FAIL] Self-add was allowed!"),
        Err(e) => println!("   [OK] Self-add prevented: {}", e),
    }
    println!();

    // =========================================================================
    // Summary
    // =========================================================================
    println!("=================================================");
    println!("                    SUMMARY");
    println!("=================================================\n");
    println!("  Friend Request Security:");
    println!("  - Requests are cryptographically signed with Ed25519");
    println!("  - Signatures prove authenticity and prevent tampering");
    println!("  - Requests include full public identity for verification");
    println!();
    println!("  Key Exchange:");
    println!("  - Both signing and encryption keys are exchanged");
    println!("  - Enables immediate E2E encrypted messaging");
    println!("  - X25519 keys for ECDH key agreement");
    println!();
    println!("  Protections:");
    println!("  - Cannot add yourself as a friend");
    println!("  - Requests expire after 7 days");
    println!("  - All data is validated before acceptance");
    println!();
}
