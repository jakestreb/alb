"""
Django models for the casestudy service.

We have added the initial Security model for you with common fields for a
stock market security. Add any additional fields you need to this model to
complete the case study.

Once you have added a new field to the Security model or created any new
models you can run 'make migrations' to create the new Django migration files
and apply them to the database.

https://docs.djangoproject.com/en/4.2/topics/db/models/
"""

from django.contrib.auth.models import User
from django.db import models


class Security(models.Model):
    """
    Represents a Stock or ETF trading in the US stock market, i.e. Apple,
    Google, SPDR S&P 500 ETF Trust, etc.
    """

    # The security’s ticker (e.g. NFLX)
    # NOTE that this will serve as the primary key for now, but ideally a static id would be used
    # since tickers are liable to change
    ticker = models.TextField(primary_key=True, null=False, blank=False)

    # The security’s name (e.g. Netflix Inc)
    name = models.TextField(null=False, blank=False)

    # This field is used to store the last price of a security
    last_price = models.DecimalField(
        null=True, blank=True, decimal_places=2, max_digits=11,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_price_at = models.DateTimeField(null=True)

class WatchlistItem(models.Model):
    """
    Represents a single Stock or ETF on a single user's watchlist.
    """

    # The user's id
    user_id = models.ForeignKey(User, on_delete=models.DO_NOTHING)

    # The watchlist security’s ticker (e.g. NFLX)
    ticker = models.TextField(null=False, blank=False)

    created_at = models.DateTimeField(auto_now_add=True)
