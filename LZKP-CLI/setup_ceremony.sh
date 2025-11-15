#!/bin/bash

echo "=== Starting Trusted Setup for Location Circuit ==="

# Step 1: Compile circuit
echo "1. Compiling circuit..."
circom location.circom --r1cs --wasm --sym -l node_modules
if [ $? -ne 0 ]; then
    echo "Error: Circuit compilation failed"
    exit 1
fi

# Step 2: Phase 1 - Powers of Tau
echo "2. Starting Phase 1 - Powers of Tau..."
snarkjs powersoftau new bn128 14 pot14_0000.ptau -v

echo "   Making first contribution..."
snarkjs powersoftau contribute pot14_0000.ptau pot14_0001.ptau --name="First contribution" -v -e="random entropy 1 $(date)"

echo "   Making second contribution..."
snarkjs powersoftau contribute pot14_0001.ptau pot14_0002.ptau --name="Second contribution" -v -e="random entropy 2 $(date)"

echo "   Making third contribution..."
snarkjs powersoftau contribute pot14_0002.ptau pot14_0003.ptau --name="Third contribution" -v -e="random entropy 3 $(date)"

echo "   Applying random beacon..."
snarkjs powersoftau beacon pot14_0003.ptau pot14_beacon.ptau 0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f 10 -n="Final Beacon"

echo "   Preparing Phase 2..."
snarkjs powersoftau prepare phase2 pot14_beacon.ptau pot14_final.ptau -v

echo "   Verifying Phase 1..."
snarkjs powersoftau verify pot14_final.ptau

# Step 3: Phase 2 - Circuit-specific setup
echo "3. Starting Phase 2 - Circuit setup..."
snarkjs groth16 setup location.r1cs pot14_final.ptau location_0000.zkey

echo "   First Phase 2 contribution..."
snarkjs zkey contribute location_0000.zkey location_0001.zkey --name="Phase2 Contributor 1" -v -e="phase2 entropy 1 $(date)"

echo "   Second Phase 2 contribution..."
snarkjs zkey contribute location_0001.zkey location_0002.zkey --name="Phase2 Contributor 2" -v -e="phase2 entropy 2 $(date)"

echo "   Applying Phase 2 beacon..."
snarkjs zkey beacon location_0002.zkey location_final.zkey 0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f 10 -n="Phase2 Final Beacon"

echo "   Verifying final zkey..."
snarkjs zkey verify location.r1cs pot14_final.ptau location_final.zkey

# Step 4: Export verification key
echo "4. Exporting verification key..."
snarkjs zkey export verificationkey location_final.zkey verification_key.json

# Step 5: Generate solidity verifier (optional)
echo "5. Generating Solidity verifier..."
snarkjs zkey export solidityverifier location_final.zkey LocationVerifier.sol

echo "=== Trusted Setup Completed Successfully ==="
echo "Generated files:"
echo " - location.r1cs (constraint system)"
echo " - location_final.zkey (proving key)"
echo " - verification_key.json (verification key)"
echo " - LocationVerifier.sol (Solidity verifier)"