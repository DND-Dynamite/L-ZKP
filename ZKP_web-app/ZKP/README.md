Below is a complete, minimal “hello-world” example that takes you from zero to a verified Groth16 proof on your laptop in <5 min.  
The circuit simply proves that you know two private factors a, b whose product is a public value c (a “private-multiplication” proof).

------------------------------------------------
1. Install the tools
------------------------------------------------
```bash
# 1. Circom compiler (Linux/Mac; for Windows use the released binary)
git clone https://github.com/iden3/circom.git
cd circom
cargo build --release
cargo install --path circom

# 2. snarkjs
npm install -g snarkjs@latest
```

------------------------------------------------
2. Write the circuit
------------------------------------------------
Create a file named `mult.circom`:

```circom
pragma circom 2.1.6;

template Mult() {
    signal input a;     // private
    signal input b;     // private
    signal output c;    // public

    c <== a * b;        // constraint + witness generation
}

component main = Mult();
```

------------------------------------------------
3. Compile → R1CS → WASM
------------------------------------------------
```bash
circom mult.circom --r1cs --wasm --sym
# produces:
#   mult.r1cs   (rank-1 constraint system)
#   mult.wasm   (witness generator)
#   mult.sym    (debug symbols)
```

------------------------------------------------
4. Trusted-setup (local/dev only!)
------------------------------------------------
```bash
# 1. start a PTAU ceremony (power-of-tau)
snarkjs powersoftau new bn128 12 pot12_0000.ptau -v
snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="first" -v
snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v

# 2. circuit-specific phase 2
snarkjs groth16 setup mult.r1cs pot12_final.ptau mult_0000.zkey
snarkjs zkey contribute mult_0000.zkey mult_final.zkey
snarkjs zkey export verificationkey mult_final.zkey verification_key.json
```

------------------------------------------------
5. Create a proof
------------------------------------------------
Create `input.json` (public output is 35, factors are secret):

```json
{"a": 5, "b": 7}
```

Generate the witness and the proof:

```bash
# 1. witness (.wtns file)
node mult_js/generate_witness.js mult.wasm input.json witness.wtns

# 2. proof + public signals
snarkjs groth16 prove mult_final.zkey witness.wtns proof.json public.json
```

`proof.json` contains the three Groth16 group elements;  
`public.json` is `["35"]`, the public product you committed to.

------------------------------------------------
6. Verify
------------------------------------------------
```bash
snarkjs groth16 verify verification_key.json public.json proof.json
# [INFO]  snarkJS: OK!
```

------------------------------------------------
7. Use it inside JavaScript (optional)
------------------------------------------------
```javascript
const snarkjs = require("snarkjs");
const fs = require("fs");

const vKey = JSON.parse(fs.readFileSync("verification_key.json"));
const proof = JSON.parse(fs.readFileSync("proof.json"));
const pub = JSON.parse(fs.readFileSync("public.json"));

const res = await snarkjs.groth16.verify(vKey, pub, proof);
console.log("Verified:", res); // true
```

------------------------------------------------
8. What you just built
------------------------------------------------
- Private inputs `a`, `b` never left the prover’s machine.  
- Anyone with `verification_key.json` can trustlessly check that the prover knows **some** pair (`a`,`b`) whose product is the published `c`.  
- The proof is 192 bytes and verifies in ~5 ms in browsers or Node.

------------------------------------------------
Next steps
------------------------------------------------
- Replace the toy circuit with your own (hashing, Merkle-trees, EdDSA sigs, etc.).  
- For production, join a real power-of-tau ceremony (Hermez, Filecoin, ENS, …) instead of the local dummy one.  
- Explore circomlib for ready-made gadgets: `comparators`, `escalarmul`, `pedersen`, `miMC`, …

Happy zero-knowledging!
