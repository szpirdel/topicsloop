from django.http import HttpResponse, Http404
from django.views.generic import View
from django.template.exceptions import TemplateDoesNotExist
import os
from django.conf import settings

def home(request):
    return HttpResponse("<h1>Welcome to TopicsLoop</h1>")


class FrontendAppView(View):
    def get(self, request, *args, **kwargs):
        try:
            # Ścieżka do index.html
            with open(os.path.join(settings.BASE_DIR, 'frontend', 'build', 'index.html')) as file:
                return HttpResponse(file.read())
        except FileNotFoundError:
            return HttpResponse("React build not found. Please run 'npm run build'.", status=501)
