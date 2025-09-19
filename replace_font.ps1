# Simple script to check font status
Write-Host "Checking current font status..."

# Check current font-kanit usage
$kanitFiles = Get-ChildItem -Path "src" -Recurse -Filter "*.tsx" | Select-String "font-kanit" -SimpleMatch
$kanitCount = $kanitFiles.Count
Write-Host "Found $kanitCount instances of font-kanit usage"

Write-Host "Font status check completed!"