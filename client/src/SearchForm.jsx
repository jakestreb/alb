import { useCallback, useContext, useState } from 'react';
import debounce from 'lodash/debounce';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import Icon from '@mui/material/Icon';

import * as similarity from 'jaro-winkler';

import { openConnection } from './client/websocket';

const SEARCH_DEBOUNCE_MS = 50;
const BASE_URL = 'http://localhost:8000';

// Sort search results by jaro-winkler similarity (best of ticker/name)
function getSimilarity(searchQuery, ticker, name) {
  const q = searchQuery.toLowerCase();
  return Math.max(similarity(q, ticker.toLowerCase()), similarity(q, name.toLowerCase()));
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

export function SearchForm() {
  // Form control.
  const [options, setOptions] = useState([]);
  const [inputText, setInputText] = useState(""); 
  const [watchlist, setWatchlist] = useState([]); // TODO fetch on load

  // Make call to backend server to search securities.
  const search = useCallback((searchQuery) => {
    getSecurities(searchQuery)
    .then((response) => response.json())
    .then((data) => {
      const options = data.items
        .filter((option) => !watchlist.find((listItem) => listItem.ticker === option.ticker))
        .sort((a, b) => getSimilarity(searchQuery, b.ticker, b.name) - getSimilarity(searchQuery, a.ticker, a.name))
        .map((option) => ({
          label: `${option.name} (${option.ticker})`,
          ticker: option.ticker,
          name: option.name
        }));
      setOptions(options);
    })
    .catch((error) => {
      console.error('Unable to search', error);
    });
  });

  const startWatching = useCallback((ticker) => {
    postWatchlistItem(ticker)
    .catch((error) => {
      console.error('Unable to post watchlist item', error);
    });
  });

  const stopWatching = useCallback((ticker) => {
    deleteWatchlistItem(ticker)
    .catch((error) => {
      console.error('Unable to delete watchlist item', error);
    });
  });

  const debouncedSearch = debounce((searchQuery) => search(searchQuery), SEARCH_DEBOUNCE_MS);

  return (
    <div className='search-form'>
      <Autocomplete
        disablePortal
        blurOnSelect={true}
        clearOnBlur={true}
        id="search-box"
        options={options}
        sx={{ width: 600 }}
        noOptionsText={'No matches'}
        filterOptions={(x) => x} // Prevent default filtering
        onOpen={ () => search("") }
        onInputChange={ (event) => debouncedSearch(event.target.value) }
        onChange={ (event, value) => {
          if (value) {
            setWatchlist([...watchlist, value]);
            console.warn('inputText', inputText);
            setInputText("")
            console.warn('inputText2', inputText);
          }
        }}
        renderInput={ (params) =>
          <TextField {...params}
            label="Add stock to watchlist"
            value={inputText}
          />
        }
      />
      <List dense={true}>
      {watchlist.map((security, i) => (
        <ListItem
          key={i}
          secondaryAction={
            <IconButton
              edge="end"
              aria-label="delete"
              onClick={ () => {
                openConnection();
                // watchlist.splice(i, 1);
                // console.warn('watchlist after', watchlist);
                // setWatchlist([...watchlist]);
              }}
            >
              <Icon>delete</Icon>
            </IconButton>
          }
        >
          <ListItemText
            primary={security.ticker}
            secondary={security.name}
          />
        </ListItem>
      ))}
      </List>
    </div>
  );
}
