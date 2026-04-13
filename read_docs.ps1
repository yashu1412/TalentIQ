param($path)
Add-Type -AssemblyName System.IO.Compression.FileSystem

$zip = [System.IO.Compression.ZipFile]::OpenRead($path)
$entry = $zip.Entries | Where-Object { $_.FullName -eq 'word/document.xml' }
if ($entry) {
    $stream = $entry.Open()
    $reader = New-Object System.IO.StreamReader($stream)
    $xmlContent = $reader.ReadToEnd()
    $reader.Close()
    $stream.Close()

    $xml = [xml]$xmlContent
    $ns = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
    $ns.AddNamespace("w", "http://schemas.openxmlformats.org/wordprocessingml/2006/main")

    $textNodes = $xml.SelectNodes("//w:p", $ns)
    foreach ($node in $textNodes) {
        $texts = $node.SelectNodes(".//w:t", $ns)
        $line = ""
        foreach ($t in $texts) {
            $line += $t.InnerText
        }
        if ($line) {
            Write-Output $line
        }
    }
}
$zip.Dispose()
