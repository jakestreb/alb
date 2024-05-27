import os
import requests
import time
import redis
import random
from django.utils import timezone
from casestudy.models import Security, WatchlistItem
from celery import shared_task

BASE_URL = os.getenv('BASE_URL')
API_KEY = os.getenv('API_KEY')
TICKER_LIST_KEY = 'tickers_comma_sep'

@shared_task
def update_tickers():
    TickerUpdateJob().run()

@shared_task
def update_prices():
    PriceUpdateJob().run()


class CaseStudyJob():
    """
    Job base class for calling a case study endpoint
    """
    def __init__(self):
        self.redis_inst = redis.Redis(host='redis', decode_responses=True)

    def request_get(self, path):
        headers = { 'Albert-Case-Study-API-Key': API_KEY }
        response = requests.get('{base_url}{path}'.format(base_url=BASE_URL, path=path), headers=headers)
        return response.json()

    def redis_get(self, key):
        return self.redis_inst.get(key)

    def redis_set(self, key, value):
        return self.redis_inst.set(key, value)

    def redis_set_many(self, key_value_dict):
        pipe = self.redis_inst.pipeline()
        for key in key_value_dict.keys():
            if key_value_dict[key] is not None:
                pipe.set(key, key_value_dict[key])
        pipe.execute()


class TickerUpdateJob(CaseStudyJob):
    """
    Job that calls the stock ticker and company name endpoint and updates DB ticker entries, and pushes updates to active users.
    """
    def run(self):
        print("TickerUpdateJob: running")
        company_dict = self.fetch_tickers()
        ticker_iter = company_dict.keys()
        # Bulk create/update securities
        Security.objects.bulk_create(
            [Security(ticker=ticker, name=company_dict[ticker]) for ticker in ticker_iter],
            update_conflicts=True,
            update_fields=['name', 'updated_at'],
            unique_fields=['ticker']
        )
        # Update cached ticker list using only active tickers
        self.redis_set(TICKER_LIST_KEY, ','.join(ticker_iter))
        print('TickerUpdateJob: ran successfully')

    def fetch_tickers(self):
        return self.request_get('/stock/tickers')


class PriceUpdateJob(CaseStudyJob):
    """
    Job that calls the stock price endpoint, updates DB price entries, and pushes updates to active users.
    """
    def run(self):
        print("PriceUpdateJob: running")
        if not self.is_ticker_list_cached():
            print("PriceUpdateJob: no tickers cached while updating prices - starting TickerUpdateJob")
            TickerUpdateJob().run()
        price_dict = self.fetch_prices()
        # Bulk update security prices in redis
        self.redis_set_many(price_dict)
        print("PriceUpdateJob: ran successfully")

    def is_ticker_list_cached(self):
        return bool(self.redis_get(TICKER_LIST_KEY))

    def fetch_prices(self):
        tickers = self.redis_get(TICKER_LIST_KEY)
        price_dict = self.request_get('/stock/prices/?tickers={tickers}'.format(tickers=tickers))
        # Add some randomness for fun to simulate the prices changing
        for key in price_dict.keys():
            if price_dict[key] is not None:
                price_dict[key] = round(price_dict[key] + random.random(), 2)
        return price_dict
