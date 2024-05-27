import './Search.css';
import { useCallback, useState } from 'react';
import debounce from 'lodash/debounce';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import * as similarity from 'jaro-winkler';
import * as http from './client/http';

const SEARCH_DEBOUNCE_MS = 50;

// Sort search results by jaro-winkler similarity (best of ticker/name)
function getSimilarity(searchQuery, security) {
  const q = searchQuery.toLowerCase();
  return Math.max(similarity(q, security.ticker.toLowerCase()), similarity(q, security.name.toLowerCase()));
}

// Autocomplete built for security searching
export function Search({ exclude=[], onSelect=(() => {}) }) {
  // Form control.
  const [options, setOptions] = useState([""]); // Add only hidden default empty string option

  // Make call to backend server to search securities.
  const search = useCallback((searchQuery) => {
    http.getSecurities(searchQuery)
    .then((data) => {
      const options = data.items
        .filter((option) => !exclude.find((listItem) => listItem.ticker === option.ticker))
        .sort((a, b) => getSimilarity(searchQuery, b) - getSimilarity(searchQuery, a))
        .map((option) => ({
          ticker: option.ticker,
          name: option.name
        }));
      setOptions([...options, ""]); // Include hidden empty string option to suppress warning
    })
    .catch((error) => {
      console.error('Unable to search', error);
    });
  });
  const debouncedSearch = debounce((searchQuery) => search(searchQuery), SEARCH_DEBOUNCE_MS);

  return (
    <Autocomplete
      disablePortal
      blurOnSelect={true}
      clearOnBlur={true}
      autoHighlight={true}
      id="search-box"
      // Fix value so that autocomplete never has a set selection
      value={""}
      clearIcon={null}
      options={options}
      noOptionsText={'No matches'}
      filterOptions={(options) => options.filter((x) => x)} // Prevent default filtering
      onOpen={ () => search("") }
      onInputChange={ (event, value) => { debouncedSearch(value); }}
      onChange={ (event, value) => {
        if (value) {
          onSelect(value);
        }
      }}
      renderInput={ (params) => <TextField {...params} label="Add stock to watchlist" />}
      renderOption={(props, option) => (
        <Box component="li" {...props}>
          <span className='option-ticker'>{option.ticker}</span>
          <span className='option-name'>{option.name}</span>
        </Box>
      )}
      getOptionLabel={option => option ? option.ticker : ""}
    />
  );
}

export default Search;
