import './Watchlist.css';
import { useCallback, useEffect, useState } from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import Icon from '@mui/material/Icon';
import * as http from './client/http';
import Search from './Search';

const PRICE_UPDATE_MS = 5000;
const PRICE_FORMAT = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatPrice(price) {
  return price ? PRICE_FORMAT.format(price) : "???";
}

export function Watchlist() {
  const [watchlist, setWatchlist] = useState([]);
  const [priceMap, setPriceMap] = useState({}); // Maps from ticker to last price

  const startWatching = useCallback((item) => {
    http.postWatchlistItem(item.ticker)
    .then(() => {
      setWatchlist([...watchlist, item]);
    })
    .catch((error) => {
      console.error('Unable to add watchlist item', error);
    });
  }, [watchlist]);

  const stopWatching = useCallback((index) => {
    http.deleteWatchlistItem(watchlist[index].ticker)
    .then(() => {
      watchlist.splice(index, 1);
      setWatchlist([...watchlist]);
    })
    .catch((error) => {
      console.error('Unable to remove watchlist item', error);
    });
  }, [watchlist]);

  const fetchPrices = (watchlist) => {
    if (watchlist.length === 0) {
      return;
    }
    console.log('Updating prices');
    http.getPrices(watchlist.map((item) => item.ticker))
    .then((priceMap) => {
      setPriceMap(priceMap);
    })
    .catch((error) => {
      console.error('Unable to fetch watchlist prices', error);
    });
  };

  // Initialize watchlist
  useEffect(() => {
    http.getWatchlist()
    .then((serverWatchlist) => {
      setWatchlist(serverWatchlist)
    })
    .catch((error) => {
      console.error('Unable to fetch watchlist', error);
    });
  }, []);

  // Fetch price updates every 5s
  useEffect(() => {
    fetchPrices(watchlist);
    const interval = setInterval(() => {
      fetchPrices(watchlist);
    }, PRICE_UPDATE_MS);
    // Clean up old interval when re-run
    return () => { clearInterval(interval); };
  }, [watchlist]);

  return (
    <div className='watchlist-form'>
      <div className='search-box'>
        <Search
          exclude={watchlist}
          onSelect={ (item) => startWatching(item) }
        />
      </div>
      <div className='watchlist'>
        <List dense={true}>
        {watchlist.map((security, i) => (
          <ListItem
            className='watchlist-item'
            key={i}
            secondaryAction={
              <IconButton
                edge="end"
                aria-label="delete"
                onClick={ () => { stopWatching(i) }}
              >
                <Icon>delete</Icon>
              </IconButton>
            }
          >
            <ListItemText
              className='watchlist-item-name'
              primary={security.ticker}
              secondary={security.name}
            />
            <ListItemText
              className='watchlist-item-price'
              primary={formatPrice(priceMap[security.ticker])}
            />
          </ListItem>
        ))}
        </List>
      </div>
    </div>
  );
}
