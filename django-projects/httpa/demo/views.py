from django.shortcuts import render_to_response
from django.template import RequestContext
from django.http import HttpResponseRedirect
from django.core.urlresolvers import reverse

from httpa.demo.models import Document
from httpa.demo.forms import DocumentForm

def list(request):
    form = DocumentForm()
    #Handle file upload
    if request.method == 'POST':
        form = DocumentForm(request.POST, request.FILES)
        if form.is_valid():
            newdoc = Document(docfile = request.FILES['docfile'])
            newdoc.save()

            #Redirect to the document list after POST
            return HttpResponseRedirect(reverse('httpa.demo.views.list'))


    #Load documents for the list page
    documents = Document.objects.all()

    #Render list page with the documents and the form
    response = render_to_response('demo/list.html',
                              {'documents': documents, 'form': form},
                              context_instance=RequestContext(request))
    response['usage-restictions'] = "Not Available"
    return response
