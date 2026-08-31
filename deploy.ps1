# Deployment script - reads FTP credentials from .env file, with $env: override support

# Load .env file if it exists
$envFile = Join-Path $PSScriptRoot ".env"
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
$user = $env:FTP_USER
$pass = $env:FTP_PASS
$localPath = "dist"
$remotePath = "/public_html"

if (-not $ftpHost -or -not $user -or -not $pass) {
    Write-Host "Error: FTP credentials not set. Please set FTP_HOST, FTP_USER, and FTP_PASS environment variables." -ForegroundColor Red
    Write-Host "Example:" -ForegroundColor Yellow
    Write-Host '  $env:FTP_HOST = "your-host"' -ForegroundColor Yellow
    Write-Host '  $env:FTP_USER = "your-user"' -ForegroundColor Yellow
    Write-Host '  $env:FTP_PASS = "your-pass"' -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path $localPath)) {
    Write-Host "Error: $localPath directory not found. Please run build first." -ForegroundColor Red
    exit 1
}

# Stamp version.json into dist so the deployed site serves the correct version
$pkgJson = Get-Content (Join-Path $PSScriptRoot "package.json") | ConvertFrom-Json
$appVersion = $pkgJson.version
$versionJsonDist = Join-Path $PSScriptRoot "dist\version.json"
$versionObj = [ordered]@{ version = $appVersion; apk = "https://onrol.in/downloads/onrol.apk"; notes = "Latest ONROL release" }
$versionObj | ConvertTo-Json | Set-Content $versionJsonDist -Encoding UTF8
Write-Host "Stamped dist/version.json: $appVersion" -ForegroundColor Cyan

$files = Get-ChildItem -Path $localPath -Recurse -File
Write-Host "Starting robust deployment of $($files.Count) files..." -ForegroundColor Cyan

foreach ($file in $files) {
    $relativePath = $file.FullName.Substring((Get-Item $localPath).FullName.Length + 1).Replace('\', '/')
    $encodedRelativePath = (($relativePath -split '/') | ForEach-Object { [uri]::EscapeDataString($_) }) -join '/'
    $remoteFileUrl = "ftp://$($ftpHost)$($remotePath)/$($encodedRelativePath)"

    Write-Host "Uploading: $($relativePath)" -NoNewline

    & curl.exe --user "$($user):$($pass)" --ftp-pasv --ftp-create-dirs --upload-file "$($file.FullName)" "$($remoteFileUrl)" --silent --show-error

    if ($LASTEXITCODE -eq 0) {
        Write-Host " [OK]" -ForegroundColor Green
    } else {
        Write-Host " [FAILED] Exit Code: $LASTEXITCODE" -ForegroundColor Red
    }
}

Write-Host "`nWeb deployment finished." -ForegroundColor Green

# APK upload (only if release APK exists)
$apkPath = Join-Path $PSScriptRoot "android\app\build\outputs\apk\release\app-release.apk"
if (Test-Path $apkPath) {
    Write-Host "`nAPK found - uploading to server..." -ForegroundColor Cyan
    $ftpApkUrl = "ftp://" + $ftpHost + "/public_html/downloads/onrol.apk"
    $ftpAuth = $user + ":" + $pass
    & curl.exe --user $ftpAuth --ftp-pasv --ftp-create-dirs --upload-file $apkPath $ftpApkUrl --silent --show-error
    if ($LASTEXITCODE -eq 0) {
        Write-Host "APK uploaded: https://onrol.in/downloads/onrol.apk" -ForegroundColor Green
    } else {
        Write-Host "APK upload failed (exit code $LASTEXITCODE)" -ForegroundColor Red
    }
} else {
    Write-Host "`nNo APK found. Run npm run android:release first, then redeploy." -ForegroundColor Yellow
}

# Windows installer upload (only if electron build output exists in release/)
$releaseDir = Join-Path $PSScriptRoot "release"
if (Test-Path $releaseDir) {
    # Find NSIS installer (name contains "Setup" — electron-builder produces "ONROL Desktop Setup x.x.x.exe")
    $installerExe = Get-ChildItem -Path $releaseDir -Filter "*.exe" | Where-Object { $_.Name -like "*Setup*" -and $_.Length -gt 1048576 } | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($installerExe) {
        Write-Host "`nWindows installer found: $($installerExe.Name)" -ForegroundColor Cyan
        $ftpInstallerUrl = "ftp://" + $ftpHost + "/public_html/downloads/onrol-setup.exe"
        & curl.exe --user "$($user):$($pass)" --ftp-pasv --ftp-create-dirs --upload-file $installerExe.FullName $ftpInstallerUrl --silent --show-error
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Installer uploaded: https://onrol.in/downloads/onrol-setup.exe" -ForegroundColor Green
        } else {
            Write-Host "Installer upload failed (exit code $LASTEXITCODE)" -ForegroundColor Red
        }
    }

    # Find portable (.exe without "Setup" or "Uninstall" in name)
    $portableExe = Get-ChildItem -Path $releaseDir -Filter "*.exe" | Where-Object { $_.Name -notlike "*Setup*" -and $_.Name -notlike "*Uninstall*" -and $_.Length -gt 1048576 } | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($portableExe) {
        Write-Host "Portable exe found: $($portableExe.Name)" -ForegroundColor Cyan
        $ftpPortableUrl = "ftp://" + $ftpHost + "/public_html/downloads/onrol-portable.exe"
        & curl.exe --user "$($user):$($pass)" --ftp-pasv --ftp-create-dirs --upload-file $portableExe.FullName $ftpPortableUrl --silent --show-error
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Portable uploaded: https://onrol.in/downloads/onrol-portable.exe" -ForegroundColor Green
        } else {
            Write-Host "Portable upload failed (exit code $LASTEXITCODE)" -ForegroundColor Red
        }
    }

    if (-not $installerExe -and -not $portableExe) {
        Write-Host "`nNo .exe found in release/ - run 'npm run desktop:build' first." -ForegroundColor Yellow
    }
} else {
    Write-Host "`nNo release/ folder found - run 'npm run desktop:build' to build the Windows installer." -ForegroundColor Yellow
}

Write-Host "`nChecking live site status..." -ForegroundColor Cyan
& curl.exe -I http://onrol.in --silent --show-error | Select-String "HTTP/"
