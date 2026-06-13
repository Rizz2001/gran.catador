$root = Get-Location
$extensions = '*.html','*.htm','*.css','*.js','*.php','*.txt','*.json'
$badPatterns = @('Ã¡','Ã©','Ã­','Ã³','Ãº','Ã±','Â¿','Â¡','â€“','â€”','â€˜','â€™','â€œ','â€�','Ã¼','Ã‘','Ã’','Ã“','Ãš','Ã‰','Ã€','Â©')
$files = Get-ChildItem -Path $root -Recurse -File -Include $extensions
$fixedCount = 0
foreach ($file in $files) {
    try {
        $content = Get-Content -Path $file.FullName -Raw -ErrorAction Stop
    } catch {
        continue
    }
    if ($badPatterns | ForEach-Object { $content.Contains($_) } | Where-Object { $_ } ) {
        $fixed = [System.Text.Encoding]::UTF8.GetString([System.Text.Encoding]::Latin1.GetBytes($content))
        if ($fixed -ne $content) {
            Set-Content -Path $file.FullName -Value $fixed -Encoding utf8
            Write-Host "fixed: $($file.FullName)"
            $fixedCount++
        }
    }
}
Write-Host "done $fixedCount files"