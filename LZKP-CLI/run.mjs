// run.mjs
import { groth16 } from 'snarkjs';
import fs from 'fs';

async function run() {
    console.log("Building ZK-Proof for location...");

    // === Define Inputs ===
    // These inputs must match the signal names in location.circom

    // Public inputs (Verifier knows this)
    const publicZone = {
        centerX: "100",
        centerY: "100",
        // Max distance is 50. (50*50 = 2500)
        maxDistanceSquared: "2500" 
    };

    // Private inputs (Prover's secret)
    // Our location: (120, 80)
    // Distance check: (120-100)^2 + (80-100)^2 = 20^2 + (-20)^2 = 400 + 400 = 800
    // 800 < 2500, so this proof should pass.
    const myLocation = {
        userX: "120",
        userY: "80"
    };

    // Combine all inputs
    const inputs = {
        ...myLocation,
        ...publicZone
    };

    // === Generate Proof (Prover's side) ===
    console.log("Generating proof...");
    const { proof, publicSignals } = await groth16.fullProve(
        inputs,
        "location_js/location.wasm",
        "location_final.zkey"
    );

    console.log("Proof generated:");
    // console.log(JSON.stringify(proof, null, 1)); // Uncomment to see the full proof
    
    console.log("\nPublic Signals (Outputs):");
    console.log(publicSignals);


    // === Verify Proof (Verifier's side) ===
    console.log("\nVerifying proof...");

    // The verifier needs 3 things:
    // 1. The verification key
    const vKey = JSON.parse(fs.readFileSync("verification_key.json"));
    
    // 2. The public signals (which match the public inputs)
    // 3. The proof itself
    
    const isValid = await groth16.verify(
        vKey,
        publicSignals,
        proof
    );

    if (isValid) {
        console.log("✅ Verification SUCCESSFUL: Prover is in the zone.");
    } else {
        console.log("❌ Verification FAILED: Prover is NOT in the zone.");
    }

    // === TEST A FAILED PROOF ===
    console.log("\n--- Testing a FAILED case ---");
    
    // Prover claims to be at (200, 200)
    // Distance check: (200-100)^2 + (200-100)^2 = 100^2 + 100^2 = 10000 + 10000 = 20000
    // 20000 is NOT < 2500, so this will fail to generate a valid proof.
    const farLocation = {
        userX: "200",
        userY: "200"
    };

    try {
        const { proof: badProof, publicSignals: badSignals } = await groth16.fullProve(
            {...farLocation, ...publicZone},
            "location_js/location.wasm",
            "location_final.zkey"
        );
        
        // This part is unlikely to be reached, as fullProve will error
        const isBadValid = await groth16.verify(vKey, badSignals, badProof);
        if (isBadValid) {
            console.log("✅ Verification succeeded (This should not happen!)");
        } else {
            console.log("❌ Verification FAILED (as expected).");
        }

    } catch (error) {
        console.log("❌ Proof generation failed (as expected):");
        console.log(error.message.split('\n')[0]); // Show the concise error
    }
}

run().then(() => {
    process.exit(0);
});