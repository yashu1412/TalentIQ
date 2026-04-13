Add-Type -AssemblyName System.IO.Compression.FileSystem

function Get-DocxText {
    param([string]$Path)
    
    try {
        $zip = [System.IO.Compression.ZipFile]::OpenRead($Path)
        $entry = $zip.Entries | Where-Object { $_.FullName -eq 'word/document.xml' }
        $stream = $entry.Open()
        $reader = New-Object System.IO.StreamReader($stream)
        $xml = $reader.ReadToEnd()
        $reader.Close()
        $stream.Close()
        $zip.Dispose()
        
        [xml]$doc = $xml
        $ns = New-Object System.Xml.XmlNamespaceManager($doc.NameTable)
        $ns.AddNamespace('w', 'http://schemas.openxmlformats.org/wordprocessingml/2006/main')
        
        $paragraphs = @()
        $nodes = $doc.SelectNodes('//w:p', $ns)
        
        foreach ($node in $nodes) {
            $texts = @()
            $textNodes = $node.SelectNodes('.//w:t', $ns)
            foreach ($textNode in $textNodes) {
                if ($textNode.InnerText) {
                    $texts += $textNode.InnerText
                }
            }
            if ($texts.Count -gt 0) {
                $paragraphs += $texts -join ''
            }
        }
        
        return $paragraphs -join "`n"
    }
    catch {
        return "Error: $_"
    }
}

$path = "d:\dev\talent-IQ-master\talent-IQ-master\TalentIQ_UI_Design_With_3D.docx"
Get-DocxText -Path $path
