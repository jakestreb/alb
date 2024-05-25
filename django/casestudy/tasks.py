import os
import requests
import time
import redis
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
    print('running update_prices')
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


class TickerUpdateJob(CaseStudyJob):
    """
    Job that calls the stock ticker and company name endpoint and updates DB ticker entries, and pushes updates to active users.
    """
    def run(self):
        print("TickerUpdateJob: running")
        company_dict = self.get_tickers()
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

    def get_tickers(self):
        return self.request_get('/stock/tickers')


class PriceUpdateJob(CaseStudyJob):
    """
    Job that calls the stock price endpoint, updates DB price entries, and pushes updates to active users.
    """
    def run(self):
        # TODO only run when there are currently active users?
        print("PriceUpdateJob: running")
        if not self.is_ticker_list_cached():
            print("PriceUpdateJob: no tickers cached while updating prices - starting TickerUpdateJob")
            TickerUpdateJob().run()
        price_dict = self.get_prices()
        ticker_iter = price_dict.keys()
        # Bulk update security prices
        Security.objects.bulk_update(
            [Security(ticker=ticker, last_price=price_dict[ticker], updated_price_at=timezone.now()) for ticker in ticker_iter],
            ['last_price', 'updated_price_at']
        )
        print("PriceUpdateJob: ran successfully")

    def is_ticker_list_cached(self):
        return bool(self.redis_get(TICKER_LIST_KEY))

    def get_prices(self):
        tickers = self.redis_get(TICKER_LIST_KEY)
        return self.request_get('/stock/prices/?tickers={tickers}'.format(tickers=tickers))
