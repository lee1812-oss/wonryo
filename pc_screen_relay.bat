<# : PC screen relay - double-click to install (batch part; PowerShell reads the rest)
@echo off
set "PSR_SELF=%~f0"
set "PSR_ARGS=%~1"
if /i "%~1"=="run" goto run
title PC screen relay setup
powershell -NoProfile -ExecutionPolicy Bypass -Command "iex ((Get-Content -LiteralPath $env:PSR_SELF -Encoding UTF8) -join [char]10)"
goto :EOF
:run
powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -Command "iex ((Get-Content -LiteralPath $env:PSR_SELF -Encoding UTF8) -join [char]10)"
goto :EOF
#>
# ──────────────────────────────────────────────────────────────────────────────
# 빵을그리다 · 사무실 PC 화면 중계기 v1 (2026-10-19 Aside)
# 이카운트 전송기와 재고 자동 동기화, 두 검은 창의 화면 글자를 읽어 구글 중계(pcScreen)로 보냅니다.
#   → 업무 대시보드 「이카운트 전송기」·「재고 자동 동기화」 카드 아래 미니 화면에 실시간(약 20초 간격)으로 보입니다.
# 두 프로그램은 건드리지 않습니다. 창의 화면 글자만 읽습니다(읽기 전용).
# 중계 주소·열쇠는 이카운트 전송기 설정 파일(C:\ecount_sender\ecount_relay_pc.json)을 같이 씁니다. 열쇠는 화면에 보이지 않습니다.
# 설치: 이 파일을 더블클릭 → C:\ecount_sender\pc_screen_relay.bat 로 복사 + 시작프로그램 등록 + 바로 실행(창 없이)
# 끄기: 이 파일을 다시 더블클릭 → 2 (끄기·자동 실행 해제)
# 기록: C:\ecount_sender\pc_screen_relay.log
# ──────────────────────────────────────────────────────────────────────────────
$ErrorActionPreference = 'Continue'
$ProgressPreference = 'SilentlyContinue'
try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 } catch {}
$Self = $env:PSR_SELF
$Mode = ('' + $env:PSR_ARGS).Trim().ToLower()
$Ver = 1
$HomeDir = 'C:\ecount_sender'
$Target = Join-Path $HomeDir 'pc_screen_relay.bat'
$CfgPath = Join-Path $HomeDir 'ecount_relay_pc.json'
$SndLog = Join-Path $HomeDir 'ecount_relay_pc.log'
$LogPath = Join-Path $HomeDir 'pc_screen_relay.log'
$SyncDir = Join-Path $env:LOCALAPPDATA 'wonryo_sync'
$StartupDir = [Environment]::GetFolderPath('Startup'); if (-not $StartupDir) { $StartupDir = Join-Path ('' + $env:APPDATA) 'Microsoft\Windows\Start Menu\Programs\Startup' }
$Vbs = Join-Path $StartupDir 'bggd_pc_screen_relay.vbs'

function Log($m) { try { Add-Content -LiteralPath $LogPath -Value ((Get-Date -Format 'yyyy-MM-dd HH:mm:ss') + '  ' + $m) -Encoding UTF8 } catch {} }

# 이미 돌고 있는 중계기 끄기 (cmd … pc_screen_relay.bat run 과 그 아래 powershell)
function StopOld {
  try {
    $ps = @(Get-CimInstance Win32_Process -ErrorAction Stop)
    $cmds = @($ps | Where-Object { $_.Name -eq 'cmd.exe' -and $_.CommandLine -and $_.CommandLine -match 'pc_screen_relay\.bat' -and $_.CommandLine -match ' run' })
    foreach ($c in $cmds) {
      foreach ($k in @($ps | Where-Object { $_.ParentProcessId -eq $c.ProcessId })) { try { Stop-Process -Id $k.ProcessId -Force -ErrorAction Stop } catch {} }
      try { Stop-Process -Id $c.ProcessId -Force -ErrorAction Stop } catch {}
    }
    return $cmds.Count
  } catch { return -1 }
}

# ───────────── 설치 화면 ─────────────
if ($Mode -ne 'run') {
  Write-Host ''
  Write-Host '  빵을그리다 · 사무실 PC 화면 중계기' -ForegroundColor Cyan
  Write-Host '  이카운트 전송기와 재고 자동 동기화 창의 화면을 업무 대시보드에 실시간으로 보여 줍니다.'
  Write-Host '  두 프로그램은 건드리지 않고, 화면 글자만 읽어요.'
  Write-Host ''
  if (-not (Test-Path -LiteralPath $CfgPath)) {
    Write-Host ('  이 PC에는 이카운트 전송기 설정 파일이 없어요: ' + $CfgPath) -ForegroundColor Yellow
    Write-Host '  이카운트 전송기가 도는 사무실 PC에서 실행해 주세요.'
    Read-Host '  끝내려면 Enter'; exit 1
  }
  $choice = '1'
  if (Test-Path -LiteralPath $Vbs) {
    Write-Host '  이미 설치되어 있어요.'
    Write-Host '    1) 새로 설치하고 다시 켜기'
    Write-Host '    2) 끄기 (PC를 켤 때 자동 실행도 해제)'
    $choice = ('' + (Read-Host '  번호를 넣고 Enter (그냥 Enter = 1)')).Trim()
    if (-not $choice) { $choice = '1' }
  }
  $n = StopOld
  if ($choice -eq '2') {
    try { Remove-Item -LiteralPath $Vbs -Force -ErrorAction Stop } catch {}
    Log '사용자가 끔 (자동 실행 해제)'
    Write-Host '  껐어요. PC를 켤 때 자동 실행도 해제했어요.' -ForegroundColor Green
    Read-Host '  끝내려면 Enter'; exit 0
  }
  try { if ($Self -ne $Target) { Copy-Item -LiteralPath $Self -Destination $Target -Force -ErrorAction Stop } }
  catch { Write-Host ('  복사하지 못했어요: ' + $_.Exception.Message) -ForegroundColor Red; Read-Host '  끝내려면 Enter'; exit 1 }
  $started = $false
  try {
    Set-Content -LiteralPath $Vbs -Value ('CreateObject("WScript.Shell").Run "cmd /c ' + $Target + ' run", 0, False') -Encoding ASCII -ErrorAction Stop
    Start-Process -FilePath 'wscript.exe' -ArgumentList ('"' + $Vbs + '"') -ErrorAction Stop
    $started = $true
    Write-Host '  ✓ PC를 켤 때 자동으로 같이 켜지게 등록했어요.' -ForegroundColor Green
  } catch {
    Write-Host ('  자동 실행 등록은 못 했어요: ' + $_.Exception.Message) -ForegroundColor Yellow
    try { Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', $Target, 'run' -WindowStyle Hidden -ErrorAction Stop; $started = $true } catch {}
  }
  if (-not $started) { Write-Host '  실행하지 못했어요.' -ForegroundColor Red; Read-Host '  끝내려면 Enter'; exit 1 }
  Write-Host '  ✓ 창 없이 뒤에서 켰어요. 첫 화면을 보내는지 확인하는 중…'
  $ok = $false
  for ($i = 0; $i -lt 15; $i++) {
    Start-Sleep -Seconds 2
    if (Test-Path -LiteralPath $LogPath) {
      $t = @(Get-Content -LiteralPath $LogPath -Tail 6 -Encoding UTF8 -ErrorAction SilentlyContinue) -join "`n"
      if ($t -match '첫 화면 보냄') { $ok = $true; break }
      if ($t -match '중계 거절|보내기 실패') { break }
    }
  }
  if ($ok) { Write-Host '  ✓ 업무 대시보드로 첫 화면을 보냈어요. 대시보드 카드 아래에 곧 보여요.' -ForegroundColor Green }
  else { Write-Host ('  아직 확인되지 않았어요. 잠시 뒤 대시보드를 봐 주세요. 기록: ' + $LogPath) -ForegroundColor Yellow }
  Write-Host ''
  Read-Host '  이 창은 닫아도 돼요 (Enter)'
  exit 0
}

# ───────────── 뒤에서 도는 부분 ─────────────
$created = $false
$Mtx = [System.Threading.Mutex]::new($true, 'Local\bggd_pc_screen_relay', [ref]$created)
if (-not $created) { exit 0 }
try { if ((Test-Path -LiteralPath $LogPath) -and ((Get-Item -LiteralPath $LogPath).Length -gt 1MB)) { Remove-Item -LiteralPath $LogPath -Force } } catch {}
Log ('PC 화면 중계기 v' + $Ver + ' 시작 (' + $env:COMPUTERNAME + ')')

$src = @'
using System; using System.Text; using System.Runtime.InteropServices; using System.Collections.Generic;
public static class BgScr {
  [DllImport("kernel32.dll", SetLastError=true)] static extern bool FreeConsole();
  [DllImport("kernel32.dll", SetLastError=true)] static extern bool AttachConsole(uint pid);
  [DllImport("kernel32.dll", SetLastError=true, CharSet=CharSet.Unicode)] static extern IntPtr CreateFileW(string n, uint a, uint s, IntPtr sa, uint d, uint f, IntPtr t);
  [DllImport("kernel32.dll", SetLastError=true)] static extern bool CloseHandle(IntPtr h);
  [StructLayout(LayoutKind.Sequential)] struct COORD { public short X, Y; }
  [StructLayout(LayoutKind.Sequential)] struct RECT16 { public short L, T, R, B; }
  [StructLayout(LayoutKind.Sequential)] struct CSBI { public COORD Size; public COORD Cur; public ushort Attr; public RECT16 Win; public COORD Max; }
  [StructLayout(LayoutKind.Explicit, CharSet=CharSet.Unicode)] struct CI { [FieldOffset(0)] public char C; [FieldOffset(2)] public ushort A; }
  [DllImport("kernel32.dll", SetLastError=true)] static extern bool GetConsoleScreenBufferInfo(IntPtr h, out CSBI i);
  [DllImport("kernel32.dll", SetLastError=true, EntryPoint="ReadConsoleOutputW")] static extern bool ReadConsoleOutputW(IntPtr h, [Out] CI[] buf, COORD size, COORD at, ref RECT16 reg);
  public static string Err = "";
  public static string[] Read(uint pid, int maxLines) {
    Err = ""; FreeConsole();
    if (!AttachConsole(pid)) { Err = "attach " + Marshal.GetLastWin32Error(); return null; }
    IntPtr h = CreateFileW("CONOUT$", 0xC0000000, 3, IntPtr.Zero, 3, 0, IntPtr.Zero);
    try {
      if (h == IntPtr.Zero || h == new IntPtr(-1)) { Err = "conout " + Marshal.GetLastWin32Error(); return null; }
      CSBI i; if (!GetConsoleScreenBufferInfo(h, out i)) { Err = "info " + Marshal.GetLastWin32Error(); return null; }
      int w = i.Size.X; if (w <= 0) return new string[0];
      int bottom = i.Cur.Y; int top = Math.Max(0, bottom - maxLines - 2);
      var lines = new List<string>();
      for (int y = top; y <= bottom; y++) {
        var buf = new CI[w]; var size = new COORD { X = (short)w, Y = 1 }; var at = new COORD { X = 0, Y = 0 };
        var reg = new RECT16 { L = 0, T = (short)y, R = (short)(w - 1), B = (short)y };
        if (!ReadConsoleOutputW(h, buf, size, at, ref reg)) { lines.Add(""); continue; }
        var sb = new StringBuilder(w);
        for (int x = 0; x < w; x++) { if ((buf[x].A & 0x0200) != 0) continue; sb.Append(buf[x].C); }
        lines.Add(sb.ToString().TrimEnd());
      }
      while (lines.Count > 0 && lines[lines.Count - 1].Length == 0) lines.RemoveAt(lines.Count - 1);
      if (lines.Count > maxLines) lines.RemoveRange(0, lines.Count - maxLines);
      return lines.ToArray();
    } finally { if (h != IntPtr.Zero && h != new IntPtr(-1)) CloseHandle(h); FreeConsole(); }
  }
}
'@
try { Add-Type -TypeDefinition $src -Language CSharp -ErrorAction Stop } catch { Log ('화면 읽기 준비 실패: ' + $_.Exception.Message) }

function LoadCfg { try { return (Get-Content -LiteralPath $CfgPath -Raw -Encoding UTF8 | ConvertFrom-Json) } catch { return $null } }
function PostJson($url, $obj) {
  $json = ConvertTo-Json -InputObject $obj -Depth 6 -Compress
  $bytes = [Text.Encoding]::UTF8.GetBytes($json)
  $r = Invoke-WebRequest -Uri $url -Method Post -Body $bytes -ContentType 'application/json; charset=utf-8' -UseBasicParsing -TimeoutSec 40
  $txt = $r.Content
  if ($txt -is [byte[]]) { $txt = [Text.Encoding]::UTF8.GetString($txt) }
  elseif ($r.RawContentStream) { try { $ms = New-Object IO.MemoryStream; $r.RawContentStream.Position = 0; $r.RawContentStream.CopyTo($ms); $txt = [Text.Encoding]::UTF8.GetString($ms.ToArray()) } catch {} }
  return ConvertFrom-Json -InputObject $txt
}
# 열쇠처럼 보이는 긴 글자는 가림
function Redact($s) {
  $s = '' + $s
  $s = [regex]::Replace($s, '(?i)(SESSION_ID|API_CERT_KEY|apiKey|token)\s*[=:]\s*\S+', '$1=…')
  $s = [regex]::Replace($s, '[A-Za-z0-9_\-]{32,}', '…')
  if ($s.Length -gt 220) { $s = $s.Substring(0, 220) }
  return $s
}
# 기록 파일 끝부분 읽기 (UTF-8, 아니면 한국어 Windows 기본 cp949)
function TailFile($path, $n) {
  try {
    $fs = [IO.File]::Open($path, 'Open', 'Read', 'ReadWrite')
    try {
      $len = $fs.Length; $take = [Math]::Min($len, 65536); $null = $fs.Seek($len - $take, 'Begin')
      $buf = New-Object byte[] $take; $got = $fs.Read($buf, 0, $take)
    } finally { $fs.Close() }
    $start = 0; if ($len -gt $take) { $i = [Array]::IndexOf($buf, [byte]10); if ($i -ge 0) { $start = $i + 1 } }
    $cnt = $got - $start; if ($cnt -le 0) { return @() }
    try { $text = (New-Object System.Text.UTF8Encoding($false, $true)).GetString($buf, $start, $cnt) }
    catch { $text = [Text.Encoding]::GetEncoding(949).GetString($buf, $start, $cnt) }
    $ls = @($text -split "\r?\n" | ForEach-Object { $_.TrimEnd() })
    while ($ls.Count -gt 0 -and $ls[$ls.Count - 1] -eq '') { $ls = @($ls[0..($ls.Count - 2)]) }
    if ($ls.Count -gt $n) { $ls = @($ls[($ls.Count - $n)..($ls.Count - 1)]) }
    return $ls
  } catch { return $null }
}
function NewestLog($dir) {
  try {
    if (-not (Test-Path -LiteralPath $dir)) { return $null }
    $f = Get-ChildItem -LiteralPath $dir -File -ErrorAction Stop | Where-Object { $_.Extension -match '^\.(log|txt)$' -and $_.LastWriteTime -gt (Get-Date).AddDays(-2) } | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($f) { return $f.FullName } else { return $null }
  } catch { return $null }
}

$script:SndPids = @(); $script:SyncPids = @(); $script:SyncHost = 0
function Scan {
  try {
    $all = @(Get-CimInstance Win32_Process -ErrorAction Stop | Select-Object ProcessId, ParentProcessId, Name, CommandLine)
    $mine = @($PID)
    $script:SndPids = @($all | Where-Object { $mine -notcontains $_.ProcessId -and $_.CommandLine -and $_.CommandLine -match 'production_sender|ecount_relay_pc|RELAY_SELF' -and $_.CommandLine -notmatch 'pc_screen_relay|PSR_SELF' } | ForEach-Object { [uint32]$_.ProcessId })
    $syn = @($all | Where-Object { $mine -notcontains $_.ProcessId -and $_.CommandLine -and $_.CommandLine -match 'ecount_sync' -and $_.CommandLine -notmatch 'pc_screen_relay|PSR_SELF' })
    $script:SyncPids = @($syn | ForEach-Object { [uint32]$_.ProcessId })
    # 동기화가 bat 반복으로 돌면 python은 5분마다 잠깐만 떠 있음 → 창을 가진 부모(cmd)를 기억
    foreach ($p in $syn) { $par = $all | Where-Object { $_.ProcessId -eq $p.ParentProcessId } | Select-Object -First 1; if ($par -and $par.Name -match '^(cmd|powershell|pwsh)\.exe$') { $script:SyncHost = [uint32]$par.ProcessId } }
    if ($script:SyncHost -and -not ($all | Where-Object { $_.ProcessId -eq $script:SyncHost })) { $script:SyncHost = 0 }
  } catch {}
}
function Grab($pids, $logFile, $logDir) {
  $err = ''
  foreach ($p in $pids) {
    if (-not $p) { continue }
    try { $r = [BgScr]::Read([uint32]$p, 16); if ($r -ne $null) { return @{ l = @($r | ForEach-Object { Redact $_ }); s = 'screen'; e = '' } } else { $err = [BgScr]::Err } } catch { $err = $_.Exception.Message }
  }
  $f = $logFile; if (-not $f -and $logDir) { $f = NewestLog $logDir }
  $why = '창을 찾지 못함'; if ($err) { $why = '화면 읽기 실패 ' + $err }
  if ($f -and (Test-Path -LiteralPath $f)) { $t = TailFile $f 16; if ($t -ne $null) { return @{ l = @($t | ForEach-Object { Redact $_ }); s = 'log'; e = $why + ' · 기록 파일로 표시' } } }
  return @{ l = @(); s = ''; e = $why }
}

$Cfg = $null; $lastSig = ''; $lastPost = [datetime]::MinValue; $lastScan = [datetime]::MinValue; $errN = 0; $first = $true
while ($true) {
  try {
    if (-not $Cfg) { $Cfg = LoadCfg; if (-not $Cfg -or -not $Cfg.relayUrl -or -not $Cfg.apiKey) { $Cfg = $null; throw '전송기 설정 파일을 읽지 못함' } }
    if (((Get-Date) - $lastScan).TotalSeconds -ge 30) { Scan; $lastScan = Get-Date }
    $snd = Grab $script:SndPids $SndLog $null
    $sp = @($script:SyncPids); if ($script:SyncHost) { $sp = @($script:SyncHost) + $sp }
    $syn = Grab $sp $null $SyncDir
    $sig = ($snd.l -join "`n") + '|' + $snd.s + '|' + ($syn.l -join "`n") + '|' + $syn.s
    if ($sig -ne $lastSig -or ((Get-Date) - $lastPost).TotalSeconds -ge 60) {
      $body = @{ key = $Cfg.apiKey; action = 'pcScreen'; pc = $env:COMPUTERNAME; v = $Ver; snd = @{ l = @($snd.l); s = $snd.s; e = $snd.e; t = 'Ecount production sender' }; sync = @{ l = @($syn.l); s = $syn.s; e = $syn.e; t = '' } }
      $r = PostJson $Cfg.relayUrl $body
      if (-not $r.ok) { throw ('중계 거절: ' + $r.error) }
      $lastSig = $sig; $lastPost = Get-Date
      if ($first) { Log ('첫 화면 보냄 (전송기: ' + $snd.s + ', 동기화: ' + $syn.s + ')'); $first = $false }
      if ($errN -gt 0) { Log '다시 정상'; $errN = 0 }
    }
  } catch {
    $errN++; if ($errN -le 3 -or $errN % 120 -eq 0) { Log ('보내기 실패: ' + $_) }
    if ($errN -ge 3) { $Cfg = $null }
  }
  Start-Sleep -Seconds 5
}
