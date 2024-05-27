"""
For more information on setting up DRF views see docs:
https://www.django-rest-framework.org/api-guide/views/#class-based-views
"""
import os
import redis
from rest_framework.views import APIView
from rest_framework import authentication, permissions
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db.models import Q
from casestudy.models import Security, WatchlistItem


class LoginView(APIView):
    """
    Login view for the API.
    """
    authentication_classes = [authentication.TokenAuthentication]
    permission_classes = [permissions.AllowAny]

    def post(self, request, format=None):
        """
        Login view for the API.
        """
        user = authenticate(username=request.data['username'], password=request.data['password'])
        if user:
            token, created = Token.objects.get_or_create(user=user)
            response = {
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name
                },
                'token': token.key
            }
            return Response(response)
        else:
            return Response({ 'error': 'Invalid credentials' }, status=401)

class SecurityView(APIView):
    """
    Security view for the API.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, format=None):
        """
        Search securities by name or ticker
        """
        search_query = request.GET.get('search_query')
        securities = []
        if search_query:
            securities = Security.objects.filter(Q(name__icontains=search_query) | Q(ticker__icontains=search_query))
        else:
            securities = Security.objects.all()
        response = {
            'items': map(self.format_search_result, securities)
        }
        return Response(response)

    def format_search_result(self, security):
        return {
            'ticker': security.ticker,
            'name': security.name
        }


class SecurityPriceView(APIView):
    """
    Security Price view for the API. Fetches data from redis.
    """
    permission_classes = [permissions.IsAuthenticated]

    def __init__(self):
        self.redis_inst = redis.Redis(host='redis', decode_responses=True)

    def get(self, request, format=None):
        """
        Search securities by name or ticker
        """
        comma_sep_tickers = request.GET.get('tickers')
        if not comma_sep_tickers:
            raise Exception('tickers argument is required')
        tickers = comma_sep_tickers.split(',')
        try:
            prices = self.redis_inst.mget(tickers)
            price_dict = {}
            for (i, ticker) in enumerate(tickers):
                price_dict[ticker] = prices[i]
            return Response(price_dict)
        except Exception:
            print('Error fetching prices for tickers {tickers}: {exception}'.format(tickers=tickers, exception=Exception))
            raise Exception('invalid tickers')


class WatchlistView(APIView):
    """
    Watchlist view for the API.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """
        Return the calling user's watchlisted securities
        """
        items = WatchlistItem.objects.filter(user=request.user)
        return Response(map(self.format_watchlist_item, items))

    def post(self, request, ticker):
        """
        Adds a security to a user's watchlist
        """
        watchlist_item = WatchlistItem(user=request.user, security_id=ticker)
        watchlist_item.save()
        return Response()

    def delete(self, request, ticker):
        """
        Removes a security from a user's watchlist
        """
        WatchlistItem.objects.get(security_id=ticker).delete()
        return Response()

    def format_watchlist_item(self, watchlist_item):
        return {
            'ticker': watchlist_item.security.ticker,
            'name': watchlist_item.security.name
        }
