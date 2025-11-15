const snarkjs = require("snarkjs");
const fs = require("fs");

async function testLocationCircuit() {
    console.log("=== Testing Location Verification Circuit ===\n");

    // Test case 1: User is within the circle
    const testCase1 = {
        userX: 100,
        userY: 100,
        centerX: 0,
        centerY: 0,
        maxDistanceSquared: 50000  // 223^2 ≈ 49729, so 100,100 should be within
    };

    // Test case 2: User is outside the circle
    const testCase2 = {
        userX: 300,
        userY: 300,
        centerX: 0,
        centerY: 0,
        maxDistanceSquared: 50000  // 424^2 ≈ 179776, so 300,300 should be outside
    };

    // Test case 3: User is exactly at the center
    const testCase3 = {
        userX: 0,
        userY: 0,
        centerX: 0,
        centerY: 0,
        maxDistanceSquared: 50000
    };

    // Test case 4: User is on the boundary
    const testCase4 = {
        userX: 223,
        userY: 0,
        centerX: 0,
        centerY: 0,
        maxDistanceSquared: 50000  // 223^2 = 49729
    };

    const testCases = [
        { name: "Within Circle", data: testCase1, shouldPass: true },
        { name: "Outside Circle", data: testCase2, shouldPass: false },
        { name: "At Center", data: testCase3, shouldPass: true },
        { name: "On Boundary", data: testCase4, shouldPass: true }
    ];

    for (const testCase of testCases) {
        console.log(`Testing: ${testCase.name}`);
        console.log(`Input: ${JSON.stringify(testCase.data)}`);
        
        try {
            // Create input file
            fs.writeFileSync("input.json", JSON.stringify(testCase.data, null, 2));
            
            // Generate witness
            const witness = await generateWitness(testCase.data);
            console.log(`✓ Witness generated successfully`);
            
            // Calculate actual distance for verification
            const deltaX = testCase.data.userX - testCase.data.centerX;
            const deltaY = testCase.data.userY - testCase.data.centerY;
            const actualDistanceSquared = deltaX * deltaX + deltaY * deltaY;
            const isWithinCircle = actualDistanceSquared <= testCase.data.maxDistanceSquared;
            
            console.log(`Calculated distance squared: ${actualDistanceSquared}`);
            console.log(`Should be within circle: ${isWithinCircle}`);
            
            if (testCase.shouldPass) {
                // Generate and verify proof
                await generateAndVerifyProof();
                console.log(`✓ Proof verified successfully\n`);
            } else {
                console.log(`✗ Expected to fail (user outside circle)\n`);
            }
            
        } catch (error) {
            if (testCase.shouldPass) {
                console.log(`✗ Unexpected error: ${error.message}\n`);
            } else {
                console.log(`✓ Correctly failed: ${error.message}\n`);
            }
        }
    }
}

async function generateWitness(input) {
    // For JavaScript-based witness generation
    const { witness } = await snarkjs.wtns.calculate(
        input,
        "location_js/location.wasm",
        "witness.wtns"
    );
    return witness;
}

async function generateAndVerifyProof() {
    // Generate proof
    const { proof, publicSignals } = await snarkjs.groth16.prove(
        "location_final.zkey",
        "witness.wtns"
    );

    // Save proof and public signals
    fs.writeFileSync("proof.json", JSON.stringify(proof, null, 2));
    fs.writeFileSync("public.json", JSON.stringify(publicSignals, null, 2));

    // Load verification key
    const vkey = JSON.parse(fs.readFileSync("verification_key.json"));

    // Verify proof
    const isValid = await snarkjs.groth16.verify(vkey, publicSignals, proof);
    
    if (!isValid) {
        throw new Error("Proof verification failed");
    }
    
    return { proof, publicSignals, isValid };
}

// Run tests
testLocationCircuit().catch(console.error);