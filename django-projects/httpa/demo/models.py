from django.db import models

class Document(models.Model):
    docfile = models.FileField(upload_to='documents/%Y/%m/%d')
    ur = models.CharField(max_length=100)
    owner = models.CharField(max_length=100)
    sources = models.CharField(max_length=500)
    derivations = models.CharField(max_length=500)
    timestamp = models.CharField(max_length=50)
    
