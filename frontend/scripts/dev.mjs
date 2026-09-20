import { spawn } from 'child_process';
import os from 'os';
import path from 'path';

function getLocalIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

const localIp = getLocalIp();
const port = process.env.PORT || 3000;

console.log('\n\x1b[1m\x1b[32m%s\x1b[0m', '🚀 Next.js App Ready & Shared on Network:');
console.log(`   - Local:   \x1b[36mhttp://localhost:${port}\x1b[0m`);
console.log(`   - Network: \x1b[1m\x1b[36mhttp://${localIp}:${port}\x1b[0m\n`);

const nextBin = path.resolve('./node_modules/next/dist/bin/next');
const nextProc = spawn(process.execPath, [nextBin, 'dev', '-H', '0.0.0.0', '-p', String(port)], {
  stdio: 'inherit',
});

nextProc.on('exit', (code) => process.exit(code || 0));
