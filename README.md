# one.com
Just a simple script to update a given subdomain of yours to your external IP.  
I got this running on my computers at different locations, so I can access them remotely with ease.  
  
The code could be a lot cleaner, error handling could be better (currently non-existing) and the requests are probably  
very verbose, e.g. you can remove most of the headers.  
  
I just want to put it out there for others to use and I'm open to collaborating, so feel free pull requesting and open issues.

## Install
npm install

## Pre-usage
Rename example.env to just .env (remove "example") and change USR and PWD to match your credentials.

## Usage
Suppose your domain is hello.com and you want to have a subdomain foo.hello.com.  
Then you should run the following:  
```bash
node index.js foo
```

This will check your external IP and create/update the given domain to this IP (an A-record will be created).
