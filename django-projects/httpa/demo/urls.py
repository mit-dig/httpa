from django.conf.urls.defaults import patterns, url

urlpatterns = patterns('httpa.demo.views',
                       url(r'^list/$', 'list', name='list')
                       )
