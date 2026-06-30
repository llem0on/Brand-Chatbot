// Shared anonymous session id - used by the chat widget, cart, and for
// linking pre-login activity to an account once the visitor logs in.
const SESSION_KEY = 'brand_session_id';

function getSessionId() {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = 'web-' + crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}
