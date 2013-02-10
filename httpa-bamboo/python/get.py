#!/usr/bin/env python

import warnings 
warnings.filterwarnings("ignore",category=DeprecationWarning)

import sys; 
import sha; 
import optparse; 
from xmlrpclib import *

p = optparse.OptionParser(usage="usage: %prog [options] <key>")
p.add_option("-g", "--gateway", dest="gateway", metavar="GW",
             default="http://httpa.csail.mit.edu:3631/", 
             help="HTTPA gateway URI")
p.add_option("-d", "--details", dest="details", action="store_true",
             help="print secret hash and TTL remaining for each value")
p.add_option("-m", "--maxvals", dest="max", default="10", metavar="CNT",
             type="int", help="how many values to return")
(opts, args) = p.parse_args()
if (len(args) < 1): p.print_help(); sys.exit(1)
pxy = ServerProxy(opts.gateway); maxvals = int(opts.max)
pm = Binary(""); key = Binary(sha.new(args[0]).digest())
while 1:
    if (opts.details):
        vals, pm = pxy.get_details(key, maxvals, pm, "get.py")
        for v in vals: 
            hex = '0x' + ''.join(["%02x"%ord(x) for x in v[3].data[:4]])
            print v[0].data, v[1], v[2], hex
    else:
        vals, pm = pxy.get(key, maxvals, pm, "get.py")
        for v in vals: print v.data
    if (pm.data == ""): break
