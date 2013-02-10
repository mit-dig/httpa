#!/usr/bin/env python

import sys; 
import hashlib; 
import optparse; 
from xmlrpclib import *

p = optparse.OptionParser(usage="usage: %prog [options] <key> <value> <secret>")
p.add_option("-g", "--gateway", dest="gateway", metavar="GW",
             default="http://localhost:3631/", 
             help="HTTPA gateway URI")
p.add_option("-t", "--ttl", dest="ttl", default="3600", metavar="TTL", 
             type="int", help="must be longer than TTL remaining for value")

(opts, args) = p.parse_args()
if (len(args) < 3): p.print_help(); sys.exit(1)
pxy = ServerProxy(opts.gateway); res = {0:"Success", 1:"Capacity", 2:"Again"}
key = Binary(sha.new(args[0]).digest()); ttl = int(opts.ttl); 
vh = Binary(sha.new(args[1]).digest()); sec = Binary(args[2]) 
print res[pxy.rm(key, vh, "SHA", sec, ttl, "rm.py")]
