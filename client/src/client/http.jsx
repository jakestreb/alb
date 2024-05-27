
const BASE_URL = 'http://localhost:8000';

// Calls POST /login endpoint
export function postLogin(username, password) {
  return makeRequest('/login/', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
    auth: false,
  });
}

// Calls GET /securities (search) endpoint
export function getSecurities(searchQuery) {
  return makeRequest(`/securities/?search_query=${encodeURIComponent(searchQuery)}`, {
    method: 'GET',
  });
}

// Calls GET /securities/prices endpoint
export function getPrices(tickers) {
  return makeRequest(`/securities/prices/?tickers=${encodeURIComponent(tickers.join(','))}`, {
    method: 'GET',
  });
}

// Calls GET /watchlist endpoint
export function getWatchlist() {
  return makeRequest('/watchlist/', {
    method: 'GET',
  });
}

// Calls POST /watchlist/{ticker} endpoint
export function postWatchlistItem(ticker) {
  return makeRequest(`/watchlist/${ticker}/`, {
    method: 'POST',
  });
}

// Calls DELETE /watchlist/{ticker} endpoint
export function deleteWatchlistItem(ticker) {
  return makeRequest(`/watchlist/${ticker}/`, {
    method: 'DELETE',
  });
}

function makeRequest(path, { method, body, auth = true }) {
  return fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': auth ? `Token ${getToken()}` : undefined,
    },
    method,
    body,
  })
  .then((response) => {
    if (response.status === 401) {
      // Log out on 401 Unauthorized
      clearSession();
      return;
    }
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
      return response.json();
    }
  });
}

function getToken() {
  return localStorage.getItem('token');
}

function clearSession() {
  return localStorage.clear();
}
