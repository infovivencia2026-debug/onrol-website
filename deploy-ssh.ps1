# SSH-based deployment script for Hostinger VPS (CyberPanel).
# Uploads dist/ + APK + installer via tar-over-ssh — fast and survives SFTP-disabled setups
# since it only needs ssh + built-in scp. Windows 10/11 ship these by default.
#
# Required .env entries (or $env: overrides):
#   SSH_HOST             VPS IP or hostname, e.g. 76.13.242.93
#   SSH_USER             SSH user for the onrol.in domain (created by CyberPanel)
#   SSH_REMOTE_PATH      Absolute path of the web root, e.g. /home/onrol.in/public_html
# Optional:
#   SSH_PORT             Defaults to 22
#   SSH_KEY_PATH         Path to private key file (defaults to ssh-agent / default id_rsa)

$ErrorActionPreference = "Stop"

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

$sshHost       = $env:SSH_HOST
$sshUser       = $env:SSH_USER
$sshPort       = if ($env:SSH_PORT) { $env:SSH_PORT } else { "22" }
$sshRemotePath = $env:SSH_REMOTE_PATH
$sshKeyPath    = $env:SSH_KEY_PATH

if (-not $sshHost -or -not $sshUser -or -not $sshRemotePath) {
    Write-Host "Error: SSH credentials missing." -ForegroundColor Red
    Write-Host "Required in .env: SSH_HOST, SSH_USER, SSH_REMOTE_PATH" -ForegroundColor Yellow
    Write-Host "Example:" -ForegroundColor Yellow
    Write-Host "  SSH_HOST=76.13.242.93" -ForegroundColor DarkGray
    Write-Host "  SSH_USER=onrol" -ForegroundColor DarkGray
    Write-Host "  SSH_REMOTE_PATH=/home/onrol.in/public_html" -ForegroundColor DarkGray
    exit 1
}

$localDist = Join-Path $PSScriptRoot "dist"
if (-not (Test-Path $localDist)) {
    Write-Host "Error: dist/ not found. Run 'vite build' first." -ForegroundColor Red
    exit 1
}

# Stamp dist/version.json with the package.json version so the live site reports the right build.
$pkgJson = Get-Content (Join-Path $PSScriptRoot "package.json") | ConvertFrom-Json
$appVersion = $pkgJson.version
$versionJsonDist = Join-Path $localDist "version.json"
$versionObj = [ordered]@{ version = $appVersion; apk = "https://onrol.in/downloads/onrol.apk"; notes = "Latest ONROL release" }
$versionObj | ConvertTo-Json | Set-Content $versionJsonDist -Encoding UTF8
Write-Host "Stamped dist/version.json: $appVersion" -ForegroundColor Cyan

# Build ssh/scp args once. Works with OpenSSH on Windows 10/11.
$sshArgs = @("-p", $sshPort, "-o", "StrictHostKeyChecking=accept-new")
if ($sshKeyPath) { $sshArgs += @("-i", $sshKeyPath) }
# -O forces the legacy SCP/rcp protocol. Modern scp (OpenSSH 9+) defaults to the
# SFTP subsystem, which is disabled on this CyberPanel VPS — without -O every
# upload dies with "Connection closed".
$scpArgs = @("-O", "-P", $sshPort, "-o", "StrictHostKeyChecking=accept-new")
if ($sshKeyPath) { $scpArgs += @("-i", $sshKeyPath) }

function Invoke-SshCommand([string]$command) {
    # Pipe to Out-Host so ssh's stdout is shown but NOT captured into the return
    # value — otherwise the caller's $code becomes [output..., exitcode] and the
    # `-ne 0` check false-fails even on success.
    & ssh.exe @sshArgs "$($sshUser)@$($sshHost)" $command | Out-Host
    return $LASTEXITCODE
}

function Invoke-ScpUpload([string]$localFile, [string]$remoteFile) {
    & scp.exe @scpArgs $localFile "$($sshUser)@$($sshHost):$($remoteFile)" | Out-Host
    return $LASTEXITCODE
}

# ─────────────────────────────────────────────────────────────
# Bundle dist/ into a single tarball — one SSH session uploads it,
# then we extract remotely. Much faster than scp -r (no per-file handshake).
# ─────────────────────────────────────────────────────────────
$tarballLocal = Join-Path $env:TEMP "onrol-dist.tar.gz"
if (Test-Path $tarballLocal) { Remove-Item $tarballLocal -Force }

Write-Host "`nPackaging dist/..." -ForegroundColor Cyan
# Use Windows' built-in BSD tar (System32\tar.exe) directly to avoid Git Bash's
# GNU tar interpreting "C:\..." as a remote host:path target.
$winTar = Join-Path $env:WINDIR "System32\tar.exe"
if (-not (Test-Path $winTar)) { $winTar = "tar.exe" }
& $winTar -czf $tarballLocal -C $localDist .
if ($LASTEXITCODE -ne 0) {
    Write-Host "tar failed." -ForegroundColor Red
    exit 1
}
$tarballSize = [math]::Round((Get-Item $tarballLocal).Length / 1MB, 2)
Write-Host "Archive: $tarballSize MB" -ForegroundColor DarkGray

# Upload to /tmp — universally writable on Linux.
$remoteTmp = "/tmp/onrol-dist-$(Get-Date -Format 'yyyyMMddHHmmss').tar.gz"
Write-Host "Uploading via scp..." -ForegroundColor Cyan
$code = Invoke-ScpUpload -localFile $tarballLocal -remoteFile $remoteTmp
if ($code -ne 0) {
    Write-Host "scp upload failed (exit $code)." -ForegroundColor Red
    Remove-Item $tarballLocal -Force -ErrorAction SilentlyContinue
    exit 1
}

# Extract in place. Atomic-ish: clear old, extract new.
# We use 'find ... -delete' instead of 'rm -rf' to limit blast radius to the web root.
$extractCmd = @"
set -e
mkdir -p $sshRemotePath
# Clean everything inside the web root (but not the root itself).
find $sshRemotePath -mindepth 1 -delete 2>/dev/null || true
tar -xzf $remoteTmp -C $sshRemotePath
rm -f $remoteTmp
echo "Extracted build to $sshRemotePath"
"@

Write-Host "Extracting on VPS..." -ForegroundColor Cyan
$code = Invoke-SshCommand -command $extractCmd
Remove-Item $tarballLocal -Force -ErrorAction SilentlyContinue
if ($code -ne 0) {
    Write-Host "Remote extraction failed (exit $code)." -ForegroundColor Red
    exit 1
}
Write-Host "Web deployment finished." -ForegroundColor Green

# ─────────────────────────────────────────────────────────────
# APK upload (only if release APK exists)
# ─────────────────────────────────────────────────────────────
$apkPath = Join-Path $PSScriptRoot "android\app\build\outputs\apk\release\app-release.apk"
if (Test-Path $apkPath) {
    Write-Host "`nUploading APK..." -ForegroundColor Cyan
    $remoteApkDir = "$sshRemotePath/downloads"
    $null = Invoke-SshCommand -command "mkdir -p $remoteApkDir"
    $code = Invoke-ScpUpload -localFile $apkPath -remoteFile "$remoteApkDir/onrol.apk"
    if ($code -eq 0) {
        Write-Host "APK uploaded: https://onrol.in/downloads/onrol.apk" -ForegroundColor Green
    } else {
        Write-Host "APK upload failed (exit $code)." -ForegroundColor Red
    }
} else {
    Write-Host "`nNo APK found (skip). Run 'npm run android:release' first if you want to ship the mobile app." -ForegroundColor DarkGray
}

# ─────────────────────────────────────────────────────────────
# Windows installer + portable exe upload (only if release/ exists)
# ─────────────────────────────────────────────────────────────
$releaseDir = Join-Path $PSScriptRoot "release"
if (Test-Path $releaseDir) {
    $installerExe = Get-ChildItem -Path $releaseDir -Filter "*.exe" | Where-Object { $_.Name -like "*Setup*" -and $_.Length -gt 1048576 } | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($installerExe) {
        Write-Host "`nUploading Windows installer: $($installerExe.Name)" -ForegroundColor Cyan
        $remoteDownloads = "$sshRemotePath/downloads"
        $null = Invoke-SshCommand -command "mkdir -p $remoteDownloads"
        $code = Invoke-ScpUpload -localFile $installerExe.FullName -remoteFile "$remoteDownloads/onrol-setup.exe"
        if ($code -eq 0) {
            Write-Host "Installer uploaded: https://onrol.in/downloads/onrol-setup.exe" -ForegroundColor Green
        } else {
            Write-Host "Installer upload failed (exit $code)." -ForegroundColor Red
        }
    }

    $portableExe = Get-ChildItem -Path $releaseDir -Filter "*.exe" | Where-Object { $_.Name -notlike "*Setup*" -and $_.Name -notlike "*Uninstall*" -and $_.Length -gt 1048576 } | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($portableExe) {
        Write-Host "Uploading portable exe: $($portableExe.Name)" -ForegroundColor Cyan
        $remoteDownloads = "$sshRemotePath/downloads"
        $null = Invoke-SshCommand -command "mkdir -p $remoteDownloads"
        $code = Invoke-ScpUpload -localFile $portableExe.FullName -remoteFile "$remoteDownloads/onrol-portable.exe"
        if ($code -eq 0) {
            Write-Host "Portable uploaded: https://onrol.in/downloads/onrol-portable.exe" -ForegroundColor Green
        } else {
            Write-Host "Portable upload failed (exit $code)." -ForegroundColor Red
        }
    }

    if (-not $installerExe -and -not $portableExe) {
        Write-Host "`nNo installer/portable .exe in release/ (skip). Run 'npm run desktop:build' first." -ForegroundColor DarkGray
    }
}

# ─────────────────────────────────────────────────────────────
# Live site status check
# ─────────────────────────────────────────────────────────────
Write-Host "`nChecking live site..." -ForegroundColor Cyan
& curl.exe -I "https://onrol.in" --silent --show-error | Select-String "HTTP/"
