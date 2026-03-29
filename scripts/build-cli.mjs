import { writeFileSync } from "node:fs";

const wrapper = `#!/usr/bin/env node
await import('./esm/cli.js');
`;

writeFileSync("dist/cli.js", wrapper);
console.log("Generated dist/cli.js");
