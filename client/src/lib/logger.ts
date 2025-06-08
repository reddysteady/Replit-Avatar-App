// See CHANGELOG.md for 2025-06-10 [Added]

export function clientLog(message: string, source = 'client') {
  if (import.meta.env.VITE_ENABLE_CLIENT_LOGS !== 'true') return;
  const formattedTime = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
