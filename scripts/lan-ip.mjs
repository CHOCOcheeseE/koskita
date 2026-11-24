import { networkInterfaces } from 'node:os';

/** Daftar alamat IPv4 LAN laptop (bukan loopback, bukan adaptor virtual umum). */
export function lanIps() {
  const skip = /(vethernet|virtualbox|vmware|wsl|docker|loopback|hyper-v)/i;
  const result = [];
  for (const [name, addrs] of Object.entries(networkInterfaces())) {
    if (skip.test(name)) continue;
    for (const addr of addrs ?? []) {
      if (addr.family === 'IPv4' && !addr.internal && !addr.address.startsWith('169.254.')) {
        result.push({ name, address: addr.address });
      }
    }
  }
  // Wi-Fi diutamakan karena HP tersambung lewat Wi-Fi.
  return result.sort((a, b) => Number(/wi-?fi|wlan/i.test(b.name)) - Number(/wi-?fi|wlan/i.test(a.name)));
}
