from django.contrib.auth.decorators import login_required
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.http import HttpResponseRedirect, HttpResponse
from django.core.urlresolvers import reverse
from django import forms
from django.contrib.auth.forms import UserCreationForm

from httpa.demo.models import Document
from httpa.demo.forms import DocumentForm
from httpa.settings import *

import warnings
warnings.filterwarnings("ignore", category=DeprecationWarning)
import sys
import sha
from xmlrpclib import *

from django.utils import simplejson
from time import gmtime, strftime

def register(request):
    if request.method == "POST":
        form = UserCreationForm(request.POST)
        if form.is_valid():
            new_user = form.save()
            return HttpResponseRedirect("/list")
    else:
        form = UserCreationForm()
    return render_to_response("registration/register.html", {'form': form}, context_instance=RequestContext(request))
        

@login_required
def list(request):
    form = DocumentForm()
    #Handle file upload
    if request.method == 'POST':
        form = DocumentForm(request.POST, request.FILES)
        if form.is_valid():
            newdoc = Document(docfile = request.FILES['docfile'])
            newdoc.ur = request.POST['ur']
            newdoc.owner = request.user.username
            newdoc.sources = request.POST['sources']
            newdoc.timestamp = strftime("%Y-%m-%d %H:%M:%S")
            newdoc.save()
            
            #Put the document information in the DHT as well
            pxy = ServerProxy("http://httpa.csail.mit.edu:3631/")
            res = {0: "Success", 1: "Capacity", 2: "Again"}
            document_uri = "http://" + request.get_host() + MEDIA_URL + newdoc.docfile.name
            data = {"usage_restrictions": newdoc.ur, "owner": request.user.username, "timestamp": strftime("%Y-%m-%d %H:%M:%S"), "sources": newdoc.sources}
            key = Binary(sha.new(document_uri).digest())
            val = Binary(simplejson.dumps(data))
            shash = Binary(sha.new("secret").digest())
            if res[pxy.put(key, val,  3600, "httpa.demo.views.views")] == "Success":
                #Redirect to the document list after POST
                return HttpResponseRedirect(reverse('httpa.demo.views.list'))
            else:
                raise Exception("Unable to update the accountability log record in the DHT")


    #Load documents for the list page
    documents = Document.objects.all()

    #Render list page with the documents and the form
    response = render_to_response('demo/list.html',
                              {'documents': documents, 'form': form},
                              context_instance=RequestContext(request))
    response['usage-restictions'] = "Not Available"
    return response


def color(request):

    if "color" in request.GET:
        response = HttpResponse("Your favorite color is now %s" %request.GET["color"])
        response.set_cookie("color", request.GET["color"])
        return response
    elif "color" in request.COOKIES:
        return HttpResponse("Your favorite color is %s" %request.COOKIES["color"])
    else:
        return HttpResponse("you have not given a favorite color")
