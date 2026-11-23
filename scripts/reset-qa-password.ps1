# EnVi - Reset QA password on Supabase Production
# Chay trong PowerShell terminal cua ban:
#   powershell -ExecutionPolicy Bypass -File scripts\reset-qa-password.ps1
# Mat khau nhap an (Read-Host -AsSecureString) - khong hien tren man hinh

$ErrorActionPreference = "Stop"

# --- Doc env tu .env.local ---
$envFile = Join-Path $PSScriptRoot "..\.env.local"
if (-not (Test-Path $envFile)) {
    Write-Host "ERROR: Khong tim thay .env.local tai $envFile" -ForegroundColor Red
    Write-Host "  Chay script tu thu muc EnVi: cd C:\Users\LENOVO\Desktop\EnVi" -ForegroundColor Yellow
    exit 1
}

$serviceKey = $null
$supabaseUrl = $null
$missing = @()

foreach ($line in (Get-Content $envFile)) {
    if ($line -match "^SUPABASE_SERVICE_ROLE_KEY=(.+)$") { $serviceKey = $Matches[1].Trim() }
    if ($line -match "^NEXT_PUBLIC_SUPABASE_URL=(.+)$") { $supabaseUrl = $Matches[1].Trim() }
}

if (-not $supabaseUrl) { $missing += "NEXT_PUBLIC_SUPABASE_URL" }
if (-not $serviceKey) { $missing += "SUPABASE_SERVICE_ROLE_KEY" }

if ($missing.Count -gt 0) {
    Write-Host "ERROR: Thieu bien moi truong trong .env.local:" -ForegroundColor Red
    foreach ($m in $missing) { Write-Host "  - $m" -ForegroundColor Yellow }
    exit 1
}

# --- Validate URL tro dung project Learn English ---
if ($supabaseUrl -notmatch "ricthhogtmgxoyjstfkz") {
    Write-Host "ERROR: URL Supabase khong tro dung project Learn English." -ForegroundColor Red
    Write-Host "  URL hien tai: $supabaseUrl" -ForegroundColor Yellow
    Write-Host "  URL mong doi chua: ricthhogtmgxoyjstfkz" -ForegroundColor Yellow
    exit 1
}

# --- Validate key format ---
if ($serviceKey -notmatch "^sb_secret_") {
    Write-Host "ERROR: SUPABASE_SERVICE_ROLE_KEY khong dung dinh dang sb_secret_..." -ForegroundColor Red
    Write-Host "  Key hien tai bat dau bang: $($serviceKey.Substring(0, [Math]::Min(8, $serviceKey.Length)))..." -ForegroundColor Yellow
    Write-Host "  Hay tao key moi: Supabase Dashboard -> Settings -> API -> Generate new service_role key" -ForegroundColor Yellow
    exit 1
}

$qaEmail = "qa.test.a@gmail.com"

Write-Host ""
Write-Host "=== EnVi - Reset QA Password ===" -ForegroundColor Cyan
Write-Host "Tai khoan: $qaEmail" -ForegroundColor Yellow
Write-Host "Project:  $($supabaseUrl -replace 'https://([^.]+)\..*','`$1')" -ForegroundColor DarkGray
Write-Host ""

# --- Tim user ID qua Node.js (tranh Supabase chan PowerShell browser-like request) ---
# Ghi Node script ra file tam de tranh loi escape trong heredoc
$nodeFindScript = Join-Path $env:TEMP "envi-find-user.mjs"
$nodeUpdateScript = Join-Path $env:TEMP "envi-update-user.mjs"

# Script tim user
@"
const url = process.env.ENVI_SUPABASE_URL;
const key = process.env.ENVI_SERVICE_KEY;
const email = process.env.ENVI_QA_EMAIL;

if (!url || !key || !email) {
  console.log('ERROR: Missing env vars');
  process.exit(1);
}

const resp = await fetch(url + '/auth/v1/admin/users?filter=' + email, {
  headers: { apikey: key, Authorization: 'Bearer ' + key }
});

if (!resp.ok) {
  console.log('ERROR:' + resp.status + ':' + await resp.text());
  process.exit(1);
}

const data = await resp.json();
const user = (data.users || []).find(u => u.email === email);

if (user) {
  console.log(user.id);
} else {
  console.log('NOT_FOUND');
}
"@ | Set-Content -Path $nodeFindScript -Encoding UTF8

# Chay Node de tim user
$env:ENVI_SUPABASE_URL = $supabaseUrl
$env:ENVI_SERVICE_KEY = $serviceKey
$env:ENVI_QA_EMAIL = $qaEmail

$userId = (node $nodeFindScript 2>&1).Trim()

# Xoa env tam
Remove-Item Env:\ENVI_SUPABASE_URL -ErrorAction SilentlyContinue
Remove-Item Env:\ENVI_SERVICE_KEY -ErrorAction SilentlyContinue
Remove-Item Env:\ENVI_QA_EMAIL -ErrorAction SilentlyContinue

if (-not $userId -or $userId -eq "NOT_FOUND" -or $userId -match "^ERROR:") {
    Write-Host "ERROR: Khong tim thay tai khoan $qaEmail" -ForegroundColor Red
    if ($userId -match "^ERROR:") {
        Write-Host "  $($userId -replace '^ERROR:','Chi tiet: ')" -ForegroundColor Yellow
    }
    Remove-Item $nodeFindScript -ErrorAction SilentlyContinue
    exit 1
}

Write-Host "Tim thay tai khoan:" -ForegroundColor Green
Write-Host "  Email: $qaEmail" -ForegroundColor White
Write-Host "  ID: $userId" -ForegroundColor White
Write-Host ""

# --- Nhap mat khau moi an ---
Write-Host "Nhap mat khau moi (an - khong hien tren man hinh):" -ForegroundColor Yellow
$secure1 = Read-Host -AsSecureString "Mat khau moi"
$pass1 = [System.Net.NetworkCredential]::new("", $secure1).Password

if (-not $pass1 -or $pass1.Length -lt 6) {
    Write-Host "ERROR: Mat khau phai co it nhat 6 ky tu" -ForegroundColor Red
    Remove-Item $nodeFindScript -ErrorAction SilentlyContinue
    exit 1
}

Write-Host ""
Write-Host "Xac nhan mat khau (an):" -ForegroundColor Yellow
$secure2 = Read-Host -AsSecureString "Xac nhan"
$pass2 = [System.Net.NetworkCredential]::new("", $secure2).Password

if ($pass1 -ne $pass2) {
    Write-Host "ERROR: Mat khau xac nhan khong khop" -ForegroundColor Red
    $pass1 = $null; $pass2 = $null; $secure1 = $null; $secure2 = $null
    Remove-Item $nodeFindScript -ErrorAction SilentlyContinue
    exit 1
}

Write-Host ""
Write-Host "Dang cap nhat mat khau..." -ForegroundColor Cyan

# --- Script Node de update password ---
# Truyen password qua stdin de tranh expose tren command line
@"
const url = process.env.ENVI_SUPABASE_URL;
const key = process.env.ENVI_SERVICE_KEY;
const userId = process.env.ENVI_USER_ID;

if (!url || !key || !userId) {
  console.log('ERROR: Missing env vars');
  process.exit(1);
}

let password = '';
process.stdin.setEncoding('utf-8');
process.stdin.on('data', chunk => { password += chunk; });
process.stdin.on('end', async () => {
  const resp = await fetch(url + '/auth/v1/admin/users/' + userId, {
    method: 'PUT',
    headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: password.trim() })
  });

  if (resp.ok) {
    console.log('SUCCESS');
  } else {
    console.log('ERROR:' + resp.status + ':' + await resp.text());
  }
});
"@ | Set-Content -Path $nodeUpdateScript -Encoding UTF8

# Chay Node de update password (password qua stdin)
$env:ENVI_SUPABASE_URL = $supabaseUrl
$env:ENVI_SERVICE_KEY = $serviceKey
$env:ENVI_USER_ID = $userId

$result = ($pass1 | node $nodeUpdateScript 2>&1).Trim()

# Xoa env tam
Remove-Item Env:\ENVI_SUPABASE_URL -ErrorAction SilentlyContinue
Remove-Item Env:\ENVI_SERVICE_KEY -ErrorAction SilentlyContinue
Remove-Item Env:\ENVI_USER_ID -ErrorAction SilentlyContinue

# Xoa file tam
Remove-Item $nodeFindScript -ErrorAction SilentlyContinue
Remove-Item $nodeUpdateScript -ErrorAction SilentlyContinue

# Xoa password khoi memory
$pass1 = $null
$pass2 = $null
$secure1 = $null
$secure2 = $null
[System.GC]::Collect()

if ($result -match "SUCCESS") {
    Write-Host ""
    Write-Host "SUCCESS - Mat khau da duoc cap nhat!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Tai khoan: $qaEmail" -ForegroundColor White
    Write-Host ""
    Write-Host "Buoc tiep theo:" -ForegroundColor Yellow
    Write-Host "  1. Cap nhat bien QA_PASSWORD moi trong .env.local (cho tests)" -ForegroundColor White
    Write-Host "  2. Dang nhap thu: https://envi-deploy-one.vercel.app/login" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "ERROR: $result" -ForegroundColor Red
    exit 1
}