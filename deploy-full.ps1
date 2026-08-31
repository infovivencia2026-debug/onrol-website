# ONROL Full Deploy Script - Web + Android APK + Windows Installer
# Usage: powershell -NoProfile -ExecutionPolicy Bypass -File deploy-full.ps1

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

# Load .env credentials
$envFile = Join-Path $root ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+?)\s*=\s*(.*)\s*$') {
            $key = $matches[1].Trim()
            $val = $matches[2].Trim()
            if (-not [System.Environment]::GetEnvironmentVariable($key)) {
                [System.Environment]::SetEnvironmentVariable($key, $val, "Process")
            }
        }
    }
}

$ftpHost = $env:FTP_HOST
$ftpUser = $env:FTP_USER
$ftpPass = $env:FTP_PASS
$javaHome = "C:\Program Files\Eclipse Adoptium\jdk-21.0.10.7-hotspot"

if (-not $ftpHost -or -not $ftpUser -or -not $ftpPass) {
    Write-Host "ERROR: FTP_HOST, FTP_USER, FTP_PASS not set in .env" -ForegroundColor Red
    exit 1
}

function FtpUpload($localFile, $remotePath) {
    $url = "ftp://" + $ftpHost + $remotePath
    $leaf = Split-Path $localFile -Leaf
    Write-Host ("  Uploading " + $leaf + " -> " + $remotePath) -NoNewline
    & curl.exe --user ($ftpUser + ":" + $ftpPass) --ftp-pasv --ftp-create-dirs --upload-file $localFile $url --silent --show-error
    if ($LASTEXITCODE -eq 0) { Write-Host " [OK]" -ForegroundColor Green }
    else { Write-Host " [FAILED]" -ForegroundColor Red; throw ("FTP upload failed: " + $localFile) }
}

function Section($title) {
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host ("  " + $title) -ForegroundColor Cyan
    Write-Host "============================================================" -ForegroundColor Cyan
}

Set-Location $root

# Stamp version.json with current package.json version before build
$pkgJson = Get-Content (Join-Path $root "package.json") | ConvertFrom-Json
$appVersion = $pkgJson.version
$versionJsonPath = Join-Path $root "public\version.json"
$versionObj = [ordered]@{ version = $appVersion; apk = "https://onrol.in/downloads/onrol.apk"; notes = "Latest ONROL release" }
$versionObj | ConvertTo-Json | Set-Content $versionJsonPath -Encoding UTF8
Write-Host ("Stamped version.json: " + $appVersion) -ForegroundColor Cyan

# STEP 1: WEB BUILD + DEPLOY
Section "STEP 1/3 - Web Build"
Write-Host "Building web..." -ForegroundColor Yellow
& npm.cmd run build
if ($LASTEXITCODE -ne 0) { Write-Host "Web build FAILED" -ForegroundColor Red; exit 1 }

Section "Deploying web files to FTP"
$webDist = Join-Path $root "dist"
$fso = New-Object -ComObject Scripting.FileSystemObject
$files = Get-ChildItem -Path $webDist -Recurse -File
Write-Host ("Uploading " + $files.Count + " files...") -ForegroundColor Yellow
$ok = 0; $fail = 0
foreach ($file in $files) {
    $shortPath = $fso.GetFile($file.FullName).ShortPath
    $rel = $file.FullName.Substring($webDist.Length + 1).Replace('\', '/')
    $enc = (($rel -split '/') | ForEach-Object { [uri]::EscapeDataString($_) }) -join '/'
    $url = "ftp://" + $ftpHost + "/public_html/" + $enc
    & curl.exe --user ($ftpUser + ":" + $ftpPass) --ftp-pasv --ftp-create-dirs --upload-file $shortPath $url --silent --show-error
    if ($LASTEXITCODE -eq 0) { $ok++ } else { $fail++; Write-Host ("  [FAIL] " + $rel) -ForegroundColor Red }
}
Write-Host ("Web deploy complete: " + $ok + " OK, " + $fail + " failed") -ForegroundColor Green

# STEP 2: ANDROID BUILD + APK UPLOAD
Section "STEP 2/3 - Android Build"
Write-Host "Building Android web bundle..." -ForegroundColor Yellow
$env:BUILD_TARGET = "android"
& npm.cmd run build
if ($LASTEXITCODE -ne 0) { Write-Host "Android vite build FAILED" -ForegroundColor Red; exit 1 }

Write-Host "Syncing Capacitor..." -ForegroundColor Yellow
& npx.cmd cap sync android
if ($LASTEXITCODE -ne 0) { Write-Host "cap sync FAILED" -ForegroundColor Red; exit 1 }

Write-Host "Running Gradle assembleRelease..." -ForegroundColor Yellow
$env:JAVA_HOME = $javaHome
$gradlewBat = Join-Path $root "android\gradlew.bat"
$gradlewBat = $gradlewBat.Replace('/', '\')
Write-Host ("Using gradlew: " + $gradlewBat) -ForegroundColor Yellow
Push-Location (Join-Path $root "android")
& $gradlewBat assembleRelease
$gradleExit = $LASTEXITCODE
Pop-Location
if ($gradleExit -ne 0) { Write-Host "Gradle build FAILED" -ForegroundColor Red; exit 1 }

$apkPath = Join-Path $root "android\app\build\outputs\apk\release\app-release.apk"
if (Test-Path $apkPath) {
    $apkMB = [math]::Round((Get-Item $apkPath).Length / 1048576, 1)
    Write-Host ("APK built: " + $apkMB + " MB") -ForegroundColor Green
    $apkShort = $fso.GetFile($apkPath).ShortPath
    FtpUpload $apkShort "/public_html/downloads/onrol.apk"
} else {
    Write-Host "WARNING: APK not found at expected path." -ForegroundColor Yellow
}

# STEP 3: WINDOWS DESKTOP BUILD + INSTALLER UPLOAD
Section "STEP 3/3 - Windows Desktop Build"
Write-Host "Building Desktop web bundle..." -ForegroundColor Yellow
$env:BUILD_TARGET = "desktop"
& npm.cmd run build
if ($LASTEXITCODE -ne 0) { Write-Host "Desktop vite build FAILED" -ForegroundColor Red; exit 1 }

Write-Host "Running electron-builder..." -ForegroundColor Yellow
$env:BUILD_TARGET = ""
& npx.cmd electron-builder --win --publish never
if ($LASTEXITCODE -ne 0) { Write-Host "electron-builder FAILED" -ForegroundColor Red; exit 1 }

$releaseDir = Join-Path $root "release"

# Upload NSIS installer
$installer = Get-ChildItem -Path $releaseDir -Filter "*.exe" -ErrorAction SilentlyContinue |
    Where-Object { ($_.Name -like "*Setup*" -or $_.Name -like "*Installer*") -and $_.Length -gt 1048576 } |
    Sort-Object LastWriteTime -Descending | Select-Object -First 1

if ($installer) {
    $sizeMB = [math]::Round($installer.Length / 1048576, 1)
    Write-Host ("Installer: " + $installer.Name + " (" + $sizeMB + " MB)") -ForegroundColor Green
    FtpUpload ($fso.GetFile($installer.FullName).ShortPath) "/public_html/downloads/onrol-setup.exe"
} else {
    Write-Host "WARNING: No installer .exe found in release/" -ForegroundColor Yellow
}

# Upload portable exe
$portable = Get-ChildItem -Path $releaseDir -Filter "*.exe" -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -notlike "*Setup*" -and $_.Name -notlike "*Installer*" -and $_.Name -notlike "*Uninstall*" -and $_.Length -gt 1048576 } |
    Sort-Object LastWriteTime -Descending | Select-Object -First 1

if ($portable) {
    $sizeMB = [math]::Round($portable.Length / 1048576, 1)
    Write-Host ("Portable: " + $portable.Name + " (" + $sizeMB + " MB)") -ForegroundColor Green
    FtpUpload ($fso.GetFile($portable.FullName).ShortPath) "/public_html/downloads/onrol-portable.exe"
}

# Upload latest.yml for auto-updater
$latestYml = Join-Path $releaseDir "latest.yml"
if (Test-Path $latestYml) {
    FtpUpload $latestYml "/public_html/updates/latest.yml"
    Write-Host "Auto-updater manifest uploaded." -ForegroundColor Green
}

# DONE
Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  FULL DEPLOY COMPLETE" -ForegroundColor Green
Write-Host ("  Web:       https://onrol.in") -ForegroundColor Green
Write-Host ("  APK:       https://onrol.in/downloads/onrol.apk") -ForegroundColor Green
Write-Host ("  Installer: https://onrol.in/downloads/onrol-setup.exe") -ForegroundColor Green
Write-Host ("  Portable:  https://onrol.in/downloads/onrol-portable.exe") -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green

Write-Host ""
Write-Host "Checking live site..." -ForegroundColor Cyan
& curl.exe -s -o /dev/null -w "HTTP %{http_code}" http://onrol.in
Write-Host ""
