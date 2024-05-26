const BASE_URL = 'http://localhost:8000';

// Calls POST /login endpoint
function postLogin(username) {
  return fetch(`${BASE_URL}/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });
}

// Calls GET /securities (search) endpoint
function getSecurities(searchQuery) {
  return fetch(`${BASE_URL}/securities/?search_query=${encodeURIComponent(searchQuery)}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
}

// Calls POST /watchlist/{ticker} endpoint
function postWatchlistItem(ticker) {
  return fetch(`${BASE_URL}/watchlist/${ticker}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
}

// Calls DELETE /watchlist/{ticker} endpoint
function deleteWatchlistItem(ticker) {
  return fetch(`${BASE_URL}/watchlist/${ticker}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
}
  
module.exports = {
  postLogin,
  getSecurities,
  postWatchlistItem,
  deleteWatchlistItem,
}
