import urllib.request
import xml.etree.ElementTree as ET
import re
from flask import Flask, jsonify, render_template

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def fetch_and_parse_feed():
    try:
        # Fetch XML content
        req = urllib.request.Request(
            FEED_URL, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        )
        with urllib.request.urlopen(req) as response:
            xml_data = response.read()
        
        # Parse XML
        root = ET.fromstring(xml_data)
        
        # Get Atom namespace
        ns = ""
        if root.tag.startswith("{"):
            ns = root.tag.split("}")[0] + "}"
            
        entries = root.findall(f"{ns}entry")
        parsed_entries = []
        
        for entry in entries:
            # Get Title (which represents the date group)
            title_elem = entry.find(f"{ns}title")
            date_str = title_elem.text.strip() if title_elem is not None else "Unknown Date"
            
            # Get Updated timestamp
            updated_elem = entry.find(f"{ns}updated")
            updated_str = updated_elem.text.strip() if updated_elem is not None else ""
            
            # Get Link
            link_elem = entry.find(f"{ns}link")
            link_str = ""
            if link_elem is not None:
                link_str = link_elem.attrib.get('href', '')
                
            # Get Content HTML
            content_elem = entry.find(f"{ns}content")
            content_html = content_elem.text if content_elem is not None else ""
            
            # Split content HTML into individual updates using <h3> headers
            # Structure matches <h3>Update Type</h3> <p>Update content...</p>
            updates = []
            matches = re.split(r'<h3>(.*?)</h3>', content_html)
            
            if len(matches) <= 1:
                # No <h3> tags found, treat the entire block as one general update
                clean_content = content_html.strip()
                if clean_content:
                    updates.append({
                        "type": "General",
                        "content": clean_content
                    })
            else:
                # We have <h3> headers.
                # matches[0] is everything before the first <h3> (usually empty or whitespace)
                # matches[1] is the first header, matches[2] is the content after it, etc.
                prefix = matches[0].strip()
                if prefix:
                    updates.append({
                        "type": "Info",
                        "content": prefix
                    })
                    
                for i in range(1, len(matches), 2):
                    update_type = matches[i].strip()
                    update_content = matches[i+1].strip() if i+1 < len(matches) else ""
                    if update_type or update_content:
                        updates.append({
                            "type": update_type,
                            "content": update_content
                        })
            
            # Only add entries that have actual updates
            if updates:
                parsed_entries.append({
                    "date": date_str,
                    "updated": updated_str,
                    "link": link_str,
                    "updates": updates
                })
                
        return parsed_entries, None
    except Exception as e:
        return None, str(e)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def get_releases():
    releases, error = fetch_and_parse_feed()
    if error:
        return jsonify({"error": error}), 500
    return jsonify(releases)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
