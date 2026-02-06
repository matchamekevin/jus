/**
 * SSE (Server-Sent Events) – bus de diffusion temps-réel.
 *
 * Fonctionnement :
 *   1. Les clients (app + admin) ouvrent une connexion GET /api/events
 *   2. Quand une route fait une mutation (CRUD), elle appelle  broadcast(type, payload)
 *   3. Tous les clients connectés reçoivent l'événement et rafraîchissent les données concernées.
 */

/** @type {Set<import('express').Response>} */
const clients = new Set();

/**
 * Express handler : ouvre un flux SSE pour le client.
 */
export function sseHandler(req, res) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no" // désactive le buffering nginx
  });

  // Heartbeat toutes les 25 s pour garder la connexion vivante
  const heartbeat = setInterval(() => {
    res.write(": heartbeat\n\n");
  }, 25_000);

  clients.add(res);

  // Envoyer un événement de bienvenue
  res.write(`data: ${JSON.stringify({ type: "connected" })}\n\n`);

  req.on("close", () => {
    clearInterval(heartbeat);
    clients.delete(res);
  });
}

/**
 * Diffuser un événement à tous les clients connectés.
 * @param {string} type  - ex: "products", "orders", "zones", "users", "variants", "dashboard"
 * @param {object} [payload] - données optionnelles (ex: { id: 42 })
 */
export function broadcast(type, payload = {}) {
  const message = JSON.stringify({ type, ...payload });
  for (const client of clients) {
    client.write(`data: ${message}\n\n`);
  }
}
