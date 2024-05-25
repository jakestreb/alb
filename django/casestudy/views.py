"""
For more information on setting up DRF views see docs:
https://www.django-rest-framework.org/api-guide/views/#class-based-views
"""
import os

from rest_framework.views import APIView
from rest_framework import authentication, permissions
from rest_framework.response import Response
from django.contrib.auth.models import User
from casestudy.models import Security


class LoginView(APIView):
    """
    Login view for the API.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, format=None):
        """
        Login view for the API.
        """
        username = request.data['username']
        user = User.objects.get(username=username)
        user_data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
        }
        return Response(user_data)


class SecurityView(APIView):
    """
    Security view for the API.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, format=None):
        """
        Search securities by name or ticker
        """
        query = request.GET.get('search_query')
        # securities = Security.objects.filter(name__contains=query) TODO Implement
        securities = [Security(ticker='AAPL', name='Apple Inc')]
        response = {
            'items': map(self.format_search_result, securities)
        }
        return Response(response)

    def format_search_result(self, security):
        return {
            'ticker': security.ticker,
            'name': security.name
        }

class WatchlistView(APIView):
    """
    Watchlist view for the API.
    """
    permission_classes = [permissions.AllowAny]

    # TODO Should likely be returned via websocket
    def get(self, request):
        """
        Return watchlist securities for a user
        """
        user_securities = WatchlistItem.objects.filter(user_id=user.request.id)
        return Response(user_securities)

    def post(self, request):
        """
        Adds a security to a user's watchlist
        """
        ticker = request.data['ticker']
        watchlist_item = WatchlistItem(user_id=user.request.id, ticker=ticker)
        watchlist_item.save()

    def delete(self, request):
        """
        Removes a security from a user's watchlist
        """
        ticker = request.data['ticker']
        WatchlistItem.objects.get(id=id).delete()
