const wc  = require("./witness_calculator.js");
const fs = require("fs");
const { readFileSync, writeFile } = fs;
const path = require("path");

if (process.argv.length != 5) {
	console.log("Usage: node generate_witness.js <file.wasm> <input.json> <output.wtns>");
	process.exit(1);
} else {
	const wasmArg = process.argv[2];
	const inputArg = process.argv[3];
	const outArg = process.argv[4];

	function resolveFile(arg) {
		if (path.isAbsolute(arg)) return arg;
		// try current working directory first
		const pCwd = path.resolve(process.cwd(), arg);
		if (fs.existsSync(pCwd)) return pCwd;
		// then try same directory as this script
		const pScript = path.resolve(__dirname, arg);
		if (fs.existsSync(pScript)) return pScript;
		// fallback to the original cwd-resolved path (will fail later with clearer message)
		return pCwd;
	}

	const inputPath = resolveFile(inputArg);
	if (!fs.existsSync(inputPath)) {
		console.error(`Input file not found: ${inputArg} (tried ${inputPath})`);
		process.exit(1);
	}

	const wasmPath = resolveFile(wasmArg);
	if (!fs.existsSync(wasmPath)) {
		console.error(`WASM file not found: ${wasmArg} (tried ${wasmPath})`);
		process.exit(1);
	}

	const input = JSON.parse(readFileSync(inputPath, "utf8"));
	const buffer = readFileSync(wasmPath);

	wc(buffer).then(async witnessCalculator => {
		const w = await witnessCalculator.calculateWitness(input, 0);
		// optional: inspect witness values
		// for (let i = 0; i < w.length; i++) console.log(w[i]);
		const buff = await witnessCalculator.calculateWTNSBin(input, 0);
		writeFile(outArg, buff, function(err) {
			if (err) throw err;
		});
	}).catch(err => {
		console.error('Error creating witness calculator:', err && err.message ? err.message : err);
		process.exit(1);
	});
}
