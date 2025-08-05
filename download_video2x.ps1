# Video2X Download Script
Write-Host "Downloading Video2X 6.4.0..." -ForegroundColor Green

# Set TLS 1.2
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# Download URL
$url = "https://github.com/k4yt3x/video2x/releases/download/6.4.0/Video2X-6.4.0-Windows-x64.exe"
$output = "Video2X-6.4.0-Windows-x64.exe"

try {
    # Download the file
    Invoke-WebRequest -Uri $url -OutFile $output -UseBasicParsing
    Write-Host "Download completed successfully!" -ForegroundColor Green
    Write-Host "File saved as: $output" -ForegroundColor Yellow
    
    # Check file size
    $fileSize = (Get-Item $output).Length
    Write-Host "File size: $fileSize bytes" -ForegroundColor Cyan
    
    if ($fileSize -gt 1000000) {
        Write-Host "File appears to be valid (size > 1MB)" -ForegroundColor Green
    } else {
        Write-Host "Warning: File size seems too small, download may have failed" -ForegroundColor Red
    }
    
} catch {
    Write-Host "Error downloading file: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Please try downloading manually from: $url" -ForegroundColor Yellow
} 