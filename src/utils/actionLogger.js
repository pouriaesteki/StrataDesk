const fs = require('fs');
const path = require('path');

const LOG_PATH = path.join(process.cwd(), 'uploads', 'action-logs.log');
const MAX_DAYS = 30;

function appendLog(userEmail, action, details = '') {
    const now = new Date();
    const logLine = `[${now.toISOString()}] ${userEmail} ${action} ${details}\n`;

    // Ensure log directory exists
    const logDir = path.dirname(LOG_PATH);
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }

    // Append log
    fs.appendFileSync(LOG_PATH, logLine, { encoding: 'utf8' });

    // Clean up old logs
    cleanupOldLogs();
}

function cleanupOldLogs() {
    if (!fs.existsSync(LOG_PATH)) return;
    const lines = fs.readFileSync(LOG_PATH, 'utf8').split('\n');
    const cutoff = Date.now() - MAX_DAYS * 24 * 60 * 60 * 1000;
    const filtered = lines.filter(line => {
        const match = line.match(/^\[(.*?)\]/);
        if (!match) return false;
        const date = new Date(match[1]);
        return date.getTime() >= cutoff;
    });
    fs.writeFileSync(LOG_PATH, filtered.join('\n'), { encoding: 'utf8' });
}

module.exports = { appendLog, LOG_PATH }; 