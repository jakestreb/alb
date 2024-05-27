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
    # since company tickers can change
    ticker = models.TextField(primary_key=True, null=False, blank=False)

    # The security’s name (e.g. Netflix Inc)
    name = models.TextField(null=False, blank=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class WatchlistItem(models.Model):
    """
    Represents a single Stock or ETF on a single user's watchlist.
    """

    # The user
    user = models.ForeignKey(User, db_index=True, on_delete=models.DO_NOTHING)

    # The watchlisted security
    security = models.ForeignKey(Security, db_index=True, null=False, blank=False, on_delete=models.CASCADE)

    created_at = models.DateTimeField(auto_now_add=True)

    # Prevent users from adding the same security multiple times
    class Meta:
        unique_together = ('user', 'security',)
