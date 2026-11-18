import urllib.request

url = "https://www.google.com"
urllib.request.urlretrieve(url, "google.html")

print("Downloaded!")