import { networkInterfaces } from 'os'

const getLocalIPs = () => {
  const interfaces = networkInterfaces()
  const ips = []
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(iface.address)
      }
    }
  }
  
  return ips
}

const port = process.env.VITE_PORT || 5173

const colors = {
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  white: '\x1b[37m',
  bold: '\x1b[1m',
  reset: '\x1b[0m',
}

console.log()
console.log(`${colors.cyan}${colors.bold}═══════════════════════════════════════${colors.reset}`)
console.log(`${colors.cyan}${colors.bold}  🚀 Dev Server URLs${colors.reset}`)
console.log(`${colors.cyan}${colors.bold}═══════════════════════════════════════${colors.reset}`)
console.log()
console.log(`${colors.green}  Localhost:${colors.reset}`)
console.log(`${colors.white}    → http://localhost:${port}${colors.reset}`)
console.log()

const ips = getLocalIPs()
if (ips.length > 0) {
  console.log(`${colors.green}  Network (HP/Device Lain):${colors.reset}`)
  ips.forEach(ip => {
    console.log(`${colors.white}    → http://${ip}:${port}${colors.reset}`)
  })
  console.log()
  console.log(`${colors.yellow}  💡 Tips: Pastikan device lain terhubung ke WiFi yang sama${colors.reset}`)
} else {
  console.log(`${colors.yellow}  ⚠️  Tidak ada network interface yang aktif${colors.reset}`)
}

console.log()
console.log(`${colors.cyan}${colors.bold}═══════════════════════════════════════${colors.reset}`)
console.log()

