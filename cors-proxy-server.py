#!/usr/bin/env python3
import http.server
import socketserver
import urllib.request
import urllib.parse
import json
import os
from urllib.error import HTTPError, URLError

class CORSProxyHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        self.handle_request()
    
    def do_POST(self):
        self.handle_request()
    
    def handle_request(self):
        try:
            if self.path.startswith('/proxy/marin-gis/'):
                # Proxy Marin County GIS requests
                target_path = self.path[16:]  # Remove '/proxy/marin-gis'
                target_url = f'https://gisopendata.marincounty.gov{target_path}'
                self.proxy_request(target_url)
            elif self.path.startswith('/proxy/solar-api/'):
                # Proxy Google Solar API requests
                target_path = self.path[16:]  # Remove '/proxy/solar-api'
                target_url = f'https://solar.googleapis.com{target_path}'
                self.proxy_request(target_url)
            else:
                # Serve static files
                self.serve_static_file()
        except Exception as e:
            self.send_error(500, f"Proxy error: {str(e)}")
    
    def proxy_request(self, target_url):
        try:
            # Read request body if it's a POST
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = None
            if content_length > 0:
                post_data = self.rfile.read(content_length)
            
            # Create request
            req = urllib.request.Request(target_url, data=post_data)
            
            # Copy headers (except host and origin)
            for header, value in self.headers.items():
                if header.lower() not in ['host', 'origin', 'referer']:
                    req.add_header(header, value)
            
            # Make request
            with urllib.request.urlopen(req) as response:
                # Send response headers
                self.send_response(response.status)
                for header, value in response.headers.items():
                    if header.lower() not in ['content-encoding', 'transfer-encoding', 'content-security-policy']:
                        self.send_header(header, value)
                
                # Add CORS headers
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
                self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
                self.end_headers()
                
                # Send response body
                self.wfile.write(response.read())
                
        except HTTPError as e:
            self.send_error(e.code, e.reason)
        except URLError as e:
            self.send_error(500, f"URL error: {str(e)}")
    
    def serve_static_file(self):
        try:
            # Serve static files
            if self.path == '/':
                self.path = '/property-mapper.html'
            
            with open(self.path[1:], 'rb') as f:
                content = f.read()
                self.send_response(200)
                self.send_header('Content-Type', 'text/html')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(content)
        except FileNotFoundError:
            self.send_error(404, "File not found")
        except Exception as e:
            self.send_error(500, f"File error: {str(e)}")

if __name__ == "__main__":
    PORT = 8080
    os.chdir('/Users/morgancantrell/marin-native-garden')
    with socketserver.TCPServer(("", PORT), CORSProxyHandler) as httpd:
        print(f"CORS proxy server running on http://localhost:{PORT}")
        print("Marin GIS proxy: http://localhost:8080/proxy/marin-gis")
        print("Solar API proxy: http://localhost:8080/proxy/solar-api")
        httpd.serve_forever()
