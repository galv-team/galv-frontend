// Authored by Co-pilot
const os = require('os')
const diskusage = require('diskusage')

// Helper function to convert bytes to megabytes
function bytesToMegabytes(bytes) {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB'
}

// Helper function to convert bytes to gigabytes
function bytesToGigabytes(bytes) {
    return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB'
}

setInterval(() => {
    const cpuUsage = process.cpuUsage()
    const memoryUsage = process.memoryUsage()
    const diskUsage = diskusage.checkSync(
        os.platform() === 'win32' ? 'c:' : '/',
    )

    console.log('---')
    console.log('CPU Usage:', cpuUsage)
    console.log('Memory Usage:', {
        rss: bytesToMegabytes(memoryUsage.rss),
        heapTotal: bytesToMegabytes(memoryUsage.heapTotal),
        heapUsed: bytesToMegabytes(memoryUsage.heapUsed),
        external: bytesToMegabytes(memoryUsage.external),
        arrayBuffers: bytesToMegabytes(memoryUsage.arrayBuffers),
    })
    console.log('Disk Usage:', {
        total: bytesToGigabytes(diskUsage.total),
        free: bytesToGigabytes(diskUsage.free),
        used: bytesToGigabytes(diskUsage.total - diskUsage.free),
    })
}, 30000)
