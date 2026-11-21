<#
.SYNOPSIS
Khoi dong EnVi (che do phuc vu ban da build: next start) va mo http://localhost:3000/login bang Brave ho so thuong.
Giu nguyen dia chi va du lieu trang/tien do (dung profile Default, khong xoa cache/cookie/localStorage).
#>
[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$repoDir   = "C:\Users\LENOVO\Desktop\EnVi"
$port      = 3000
$baseUrl   = "http://localhost:$port"
$loginUrl  = "$baseUrl/login"
$braveExe  = "C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe"
$maxWaitSec= 90
$pollSec   = 2
$logFile   = Join-Path $repoDir "start-envi.log"
$serverLog = Join-Path $repoDir "start-envi-server.log"

function Write-Log([string]$msg) {
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$ts $msg" | Tee-Object -FilePath $logFile -Append
}

function Test-PortOpen([int]$Port) {
    $socket = New-Object System.Net.Sockets.TcpClient
    try {
        $ar = $socket.BeginConnect("localhost", $Port, $null, $null)
        $ok = $ar.AsyncWaitHandle.WaitOne(2000)
        if (-not $ok) { return $false }
        $socket.EndConnect($ar) | Out-Null
        return $true
    } catch { return $false }
    finally { $socket.Close() }
}

function Get-PortOwner([int]$Port) {
    try {
        $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($conn) {
            $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
            if ($proc) {
                return [PSCustomObject]@{
                    Pid   = $conn.OwningProcess
                    Name  = $proc.ProcessName
                    Path  = $proc.Path
                }
            }
        }
    } catch {}
    return $null
}

Write-Log "=== Bat dau khoi dong EnVi ==="
Write-Log "Repo: $repoDir"

# 1. Kiem tra trang thai cong 3000
$portOpen = Test-PortOpen -Port $port
$serverRunning = $false

if ($portOpen) {
    $owner = Get-PortOwner -Port $port
    if ($owner -and $owner.Name -eq "node") {
        Write-Log "Cong $port dang phuc vu boi node (PID $($owner.Pid)). Su dung lai server EnVi hien co."
        $serverRunning = $true
    } else {
        $who = if ($owner) { "$($owner.Name) (PID $($owner.Pid), $($owner.Path))" } else { "trinh khong xac dinh" }
        Write-Log "LOI: Cong $port dang mo nhung khong phai EnVi ($who)."
        Write-Output "LOI: Cong 3000 dang bi app khac chiem ($who). EnVi khong the khoi dong. Vui long dong app do va thu lai."
        exit 1
    }
} else {
    # Cong dong: kiem tra xem co app gi dang duoc giu khong (netstat co LISTEN nhung chua tra loi?)
    $owner = Get-PortOwner -Port $port
    if ($owner) {
        Write-Log "LOI: Cong $port duoc boi boi $($owner.Name) (PID $($owner.Pid)) nhung khong phan hoi."
        Write-Output "LOI: Cong 3000 dang bi app khac chiem ($($owner.Name) PID $($owner.Pid)) nhung khong phan hoi. Vui long dong app do va thu lai."
        exit 1
    }

    # 2. Cong trong -> khoi dong EnVi che do build (next start)
    Write-Log "Cong $port trong. Khoi dong EnVi chedo build (npm run start / next start)..."
    if (-not (Test-Path (Join-Path $repoDir ".next"))) {
        Write-Log "LOI: Thu muc .next khong ton tai. Can chay 'npm run build' truoc."
        Write-Output "LOI: Chua du lieu build (.next). Vui long chay 'npm run build' trong $repoDir truoc khi su dung shortcut."
        exit 1
    }
    try {
        Start-Process -FilePath "cmd.exe" -ArgumentList @("/c","npm run start") -WorkingDirectory $repoDir `
            -WindowStyle Hidden -RedirectStandardOutput $serverLog -RedirectStandardError "$serverLog.err"
    } catch {
        Write-Log "LOI khong the khoi dong 'npm run start': $_"
        Write-Output "LOI: Khong the khoi dong EnVi (npm run start that bai). Xem nhat ky $serverLog"
        exit 1
    }

    # 3. Doi cho trang phan hoi
    $started = Get-Date
    while ((Get-Date) - $started -lt (New-TimeSpan -Seconds $maxWaitSec)) {
        Start-Sleep -Seconds $pollSec
        if (Test-PortOpen -Port $port) {
            $serverRunning = $true
            Write-Log "EnVi da san sang tai $baseUrl/"
            break
        }
    }
    if (-not $serverRunning) {
        Write-Log "LOI: EnVi khong phan hoi sau $maxWaitSec giay."
        Write-Output "LOI: EnVi khoi dong loi hoac khong phan ro sau $maxWaitSec giay. Xem nhat ky $serverLog va $logFile"
        exit 1
    }
}

# 4. Mo Brave ho so thuong (Default) de giu du lieu trang & tien do hoc
if (-not (Test-Path $braveExe)) {
    Write-Log "LOI khong tim thay brave.exe tai $braveExe"
    Write-Output "LOI: Khong tim thay Brave Browser tai $braveExe"
    exit 1
}

Write-Log "Mo Brave ho so mac dinh (Default): $loginUrl"
try {
    & $braveExe --profile-directory="Default" "$loginUrl"
} catch {
    Write-Log "LOI mo Brave: $_"
    Write-Output "LOI: Khong the mo Brave Browser. Xem nhat ky $logFile"
    exit 1
}

Write-Log "=== Hoan tat ==="
Write-Output "EnVi da san sang. Da mo: $loginUrl (Brave ho so thuong, du lieu trang va tien do duoc giu nguyen)."
