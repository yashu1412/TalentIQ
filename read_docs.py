import zipfile
import xml.etree.ElementTree as ET
import os

def get_docx_text(path):
    """
    Take the path of a docx file as argument, return the text in html.
    """
    document = zipfile.ZipFile(path)
    xml_content = document.read('word/document.xml')
    document.close()
    tree = ET.fromstring(xml_content)
    
    # Namespaces
    ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
    
    text = ""
    for paragraph in tree.findall('.//w:p', ns):
        for run in paragraph.findall('.//w:r', ns):
            t = run.find('.//w:t', ns)
            if t is not None:
                text += t.text
        text += "\n"
    return text

files = [
    r'd:\dev\talent-IQ-master\talent-IQ-master\TalentIQ_Technical_Design_Doc.docx',
    r'd:\dev\talent-IQ-master\talent-IQ-master\TalentIQ_UI_Design_With_3D.docx',
    r'd:\dev\talent-IQ-master\talent-IQ-master\TalentIQ_UI_Design.docx'
]

for f in files:
    if os.path.exists(f):
        print(f"--- CONTENT OF {os.path.basename(f)} ---")
        try:
            print(get_docx_text(f))
        except Exception as e:
            print(f"Error reading {f}: {e}")
        print("\n" + "="*50 + "\n")
    else:
        print(f"File not found: {f}")
