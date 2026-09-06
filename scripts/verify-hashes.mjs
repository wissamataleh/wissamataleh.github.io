import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";

const EXPECTED = {
  "src/effects/constellation-field/sources/constellation-field.html": "1920ad4fe34f2ed2348e3a52110c37b4969bc45d71ff29f2738cb4542ad9f610",
  "src/effects/constellation-field/sources/particle-drift.html": "7fad6cc8c54c0385c472c2879762b3fd2bfb061820bf925034d7a58a0048eb27",
  "src/effects/constellation-field/sources/particle-network.html": "bc7bffdc48a9019cbba937dab9d335b85f20ac8a472f10dfa3d553da439cfdb7",
  "src/effects/constellation-field/sources/gateway-flow.html": "c5a1de43138ffba96b9f0ecdcf3c054ae251ec94344e88c6ad502bae362b17d0",
  "src/effects/constellation-field/sources/connectivity-graph.html": "98592824dd1109702cd72e9deca1cae7239169396c8245e8bbd786997d9bdf13",
  "src/effects/constellation-field/sources/interface-lines.html": "608cbc6976996b8a5b6c4aaba4bee4d6f2dd44579b819df45914f35bc310d2cc",
  "src/effects/constellation-field/sources/defense-lines.html": "1cd230f6a060023f99cbbe9ebc63e37409bf7ed70507e1ef44edc2342a0b9f91",
  "src/effects/constellation-field/sources/topo-field.html": "70dbdaaec6398be9fcf05843f6c5af65e761d29187e60064673bbeb55888379f",
};

let failed = false;
for (const [file, expected] of Object.entries(EXPECTED)) {
  const data = readFileSync(file);
  const hash = createHash("sha256").update(data).digest("hex");
  if (hash !== expected) {
    console.error(`HASH MISMATCH: ${file}`);
    console.error(`  expected ${expected}`);
    console.error(`  actual   ${hash}`);
    failed = true;
  } else {
    console.log(`ok ${file} (${statSync(file).size} bytes)`);
  }
}
if (failed) process.exit(1);
console.log(`verified ${Object.keys(EXPECTED).length} authored sources`);
