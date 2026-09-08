#!/usr/bin/env python3
"""Read-only HTTP SEO checks against any configured deployment or local build."""
import argparse
import json
import time
from html.parser import HTMLParser
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import urlsplit
from urllib.request import Request, build_opener, HTTPRedirectHandler
from xml.etree import ElementTree as ET


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


class Document(HTMLParser):
    def __init__(self, value):
        super().__init__()
        self.links=[]; self.meta=[]; self.h1=0; self.title=''; self.jsonld=[]
        self.in_title=False; self.in_json=False; self.buffer=''
        self.feed(value)
    def handle_starttag(self, tag, attrs):
        data=dict(attrs)
        if tag=='link': self.links.append(data)
        if tag=='meta': self.meta.append(data)
        if tag=='h1': self.h1+=1
        if tag=='title': self.in_title=True
        if tag=='script' and data.get('type')=='application/ld+json': self.in_json=True; self.buffer=''
    def handle_data(self, data):
        if self.in_title: self.title+=data
        if self.in_json: self.buffer+=data
    def handle_endtag(self, tag):
        if tag=='title': self.in_title=False
        if tag=='script' and self.in_json:
            self.jsonld.append(json.loads(self.buffer)); self.in_json=False


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base-url', required=True)
    parser.add_argument('--origin', required=True)
    parser.add_argument('--locales', default='en,tr')
    parser.add_argument('--default-locale', default='en')
    parser.add_argument('--indexing', choices=['on','off'], default='on')
    parser.add_argument('--expected-sitemap-count', type=int)
    parser.add_argument('--forbidden', action='append', default=[])
    parser.add_argument('--redirect', action='append', default=[], help='Old path=canonical path')
    parser.add_argument('--report')
    args=parser.parse_args()
    base=args.base_url.rstrip('/'); origin=args.origin.rstrip('/'); locales=args.locales.split(',')
    opener=build_opener(NoRedirect()); records=[]; failures=[]
    def fetch(path, agent='Mozilla/5.0'):
        target=urlsplit(path)
        # Never follow or fetch a sitemap's external host while testing a local deployment.
        url=base+(target.path or '/')+('?' + target.query if target.query else '')
        start=time.perf_counter()
        try: response=opener.open(Request(url,headers={'User-Agent':agent}),timeout=30)
        except HTTPError as error: response=error
        value=response.read(); result={'path':path,'status':response.code,'headers':{key.lower():value for key,value in response.headers.items()},'bytes':len(value),'ms':round((time.perf_counter()-start)*1000,1)}
        records.append(result)
        return result,value.decode('utf-8',errors='replace')
    def check(condition, message):
        if not condition: failures.append(message)
    def html(path, expected_canonical=None, noindex=None):
        response,body=fetch(path)
        check(response['status']==200,f'{path}: HTTP {response["status"]}')
        if response['status']!=200: return
        doc=Document(body)
        canonical=[link.get('href') for link in doc.links if link.get('rel')=='canonical']
        check(canonical==[expected_canonical or origin+path],f'{path}: canonical {canonical}')
        check(bool(doc.title.strip()),f'{path}: empty title')
        check(doc.h1==1,f'{path}: H1 count {doc.h1}')
        descriptions=[meta.get('content','') for meta in doc.meta if meta.get('name')=='description']
        check(len(descriptions)==1 and bool(descriptions[0].strip()),f'{path}: description {descriptions}')
        robots=','.join(meta.get('content','') for meta in doc.meta if meta.get('name')=='robots')
        expected_noindex=(args.indexing=='off') if noindex is None else noindex
        check(('noindex' in robots)==expected_noindex,f'{path}: robots {robots}')
        for link in doc.links:
            if link.get('rel')=='alternate' and link.get('hreflang'):
                check(link['href'].startswith(origin+'/'),f'{path}: foreign alternate {link}')
                check(link['hreflang'] in [*locales,'x-default'],f'{path}: inactive hreflang {link}')
        for forbidden in args.forbidden:
            check(forbidden.casefold() not in body.casefold(),f'{path}: contains forbidden value {forbidden}')
        return doc
    paths=['','/properties','/collections','/services','/news','/reviews','/about','/contact','/privacy','/terms']
    for locale in locales:
        for path in paths: html(f'/{locale}{path}')
    response,_=fetch('/')
    check(response['status']==308 and urlsplit(response['headers'].get('location','')).path==f'/{args.default_locale}','Default locale redirect')
    _,robots=fetch('/robots.txt')
    check(('Sitemap: '+origin+'/sitemap.xml' in robots)==(args.indexing=='on'),'robots sitemap origin/indexing')
    sitemap_urls=[]; visited_sitemaps=set()
    def sitemap(path):
        if path in visited_sitemaps or len(visited_sitemaps)>1000:
            check(False,'Cyclic or excessive sitemap index'); return
        visited_sitemaps.add(path)
        response,body=fetch(path)
        check(response['status']==200,f'Sitemap status: {path}')
        if response['status']!=200: return
        root=ET.fromstring(body);ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'}
        if root.tag.endswith('sitemapindex'):
            for node in root.findall('s:sitemap/s:loc',ns):
                check(node.text.startswith(origin+'/sitemaps/'),'Foreign sitemap part')
                sitemap(node.text)
        else:
            sitemap_urls.extend(node.text for node in root.findall('s:url/s:loc',ns))
    sitemap('/sitemap.xml')
    check(len(sitemap_urls)==len(set(sitemap_urls)),'Duplicate sitemap URLs')
    if args.expected_sitemap_count is not None: check(len(sitemap_urls)==args.expected_sitemap_count,f'Sitemap count {len(sitemap_urls)} != {args.expected_sitemap_count}')
    if args.indexing=='off': check(not sitemap_urls,'Disabled indexing sitemap is not empty')
    for url in sitemap_urls:
        check(url.startswith(origin+'/'),'Foreign sitemap origin')
        path=urlsplit(url).path
        check(path.split('/')[1] in locales,'Inactive sitemap locale')
        if path not in [f'/{locale}{route}' for locale in locales for route in paths]: html(path)
    invalid=['0','-1','1.2','Infinity','abc','999999','1&page=2']
    for section in ['properties','news','reviews']:
        for page in invalid:
            for agent in ['Mozilla/5.0','Googlebot']:
                path=f'/{args.default_locale}/{section}?page={page}'
                response,_=fetch(path,agent)
                check(response['status']==404,f'{path} {agent}: expected404 got{response["status"]}')
    html(f'/{args.default_locale}?utm_source=smoke', origin+f'/{args.default_locale}')
    html(f'/{args.default_locale}/reviews?token=fixture', origin+f'/{args.default_locale}/reviews', True)
    for item in args.redirect:
        old,new=item.split('=',1);response,_=fetch(old)
        check(response['status'] in [301,308] and urlsplit(response['headers'].get('location','')).path==new,f'Redirect {old} -> {new}: {response}')
    doc=html(f'/{args.default_locale}')
    icon=next((link.get('href') for link in doc.links if link.get('rel')=='icon'),None) if doc else None
    check(bool(icon),'Missing icon')
    if icon:
        response,_=fetch(icon)
        check(response['status']==200 and 'image/' in response['headers'].get('content-type',''),'Icon is not a 200 image')
    result={'base_url':base,'origin':origin,'sitemap_count':len(sitemap_urls),'requests':len(records),'failures':failures,'records':records}
    if args.report: Path(args.report).write_text(json.dumps(result,ensure_ascii=False,indent=2))
    print(json.dumps({key:value for key,value in result.items() if key!='records'},ensure_ascii=False,indent=2))
    return bool(failures)


if __name__=='__main__': raise SystemExit(main())
