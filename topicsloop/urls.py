"""
URL configuration for topicsloop project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf.urls.static import static
from django.conf import settings
from .views import home, FrontendAppView  # Ensure these views are defined in views.py
from django.views.generic import TemplateView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)    

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),  # URL dla API aplikacji
    path('home/', home, name='home'),  # Path for the home page (zmieniłem na 'home/' dla unikalności)
    path('auth/', include('djoser.urls')),  # Rejestracja, logowanie, JWT authentication
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('frontend/', FrontendAppView.as_view(), name='frontend'),  # Widok dla Reacta
    path('', FrontendAppView.as_view(), name="frontend-home"),
    path('<path:path>', FrontendAppView.as_view(), name="catch-all"),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)