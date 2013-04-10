from django.conf.urls.defaults import patterns, include, url
from django.conf import settings
from django.conf.urls.static import static
from django.contrib.auth.views import login, logout
from django.views.generic.simple import direct_to_template
from httpa.views import hello


# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = patterns('',
    # Example:
    # (r'^httpa/', include('httpa.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # (r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    # (r'^admin/', include(admin.site.urls)),

    ('hello/$', hello),
    (r'^$', direct_to_template, {'template': 'index.html'}),
    (r'^demo/', include('httpa.demo.urls')),
    (r'^accounts/login/$', login, {'extra_context': {'next': '/list'}}),
    (r'^accounts/logout/$', logout),
    (r'accounts/register/$', 'httpa.demo.views.register'),
    (r'media/(?P<path>.*)$', 'django.views.static.serve', {
                           'document_root': settings.MEDIA_ROOT,}),
#    (r'media/(?P<path>.*)$', 'django.views.static.serve', {'document_root': settings.MEDIA_ROOT}),
#    (r'(?P<path>.*)$', 'django.views.static.serve', {'document_root': settings.MEDIA_ROOT}),
)
#+ static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
