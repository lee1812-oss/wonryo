<# : ecount relay sender - double-click to run (batch part; PowerShell reads the rest)
@echo off
set "RELAY_SELF=%~f0"
title Ecount production sender
powershell -NoProfile -ExecutionPolicy Bypass -Command "iex ((Get-Content -LiteralPath $env:RELAY_SELF -Encoding UTF8) -join [char]10)"
if errorlevel 1 pause
goto :EOF
#>
# 빵을그리다(주) 통합재고관리 — 생산일지 이카운트 전송기 (사무실 PC용)
# 휴대폰·태블릿에서 입력한 생산일지를 구글 중계에서 가져와, 이카운트에 등록된 이 PC에서 생산입고I로 보냅니다.
# 설정 파일(ecount_relay_pc.json)은 이 파일과 같은 폴더에 만들어지며 이카운트 인증키가 들어 있으니 다른 곳에 올리지 마세요.
$ErrorActionPreference = 'Stop'
try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 } catch {}
$Self = $env:RELAY_SELF; if (-not $Self) { $Self = $PSCommandPath }
$Dir = Split-Path -Parent $Self
$CfgPath = Join-Path $Dir 'ecount_relay_pc.json'
$LogPath = Join-Path $Dir 'ecount_relay_pc.log'
$DonePath = Join-Path $Dir 'ecount_relay_pc.done.json'   # v2: 이미 만든 전표 기록 — 같은 건을 다시 받아도 전표를 두 번 만들지 않음
$Poll = 20
if ($env:RELAY_POLL) { $Poll = [int]$env:RELAY_POLL }

function Log($m) {
  $line = (Get-Date -Format 'yyyy-MM-dd HH:mm:ss') + '  ' + $m
  Write-Host $line
  try { Add-Content -LiteralPath $LogPath -Value $line -Encoding UTF8 } catch {}
}

function PostJson($url, $obj) {
  $json = ConvertTo-Json -InputObject $obj -Depth 10 -Compress
  $bytes = [Text.Encoding]::UTF8.GetBytes($json)
  $r = Invoke-WebRequest -Uri $url -Method Post -Body $bytes -ContentType 'application/json; charset=utf-8' -UseBasicParsing -TimeoutSec 60
  $txt = $r.Content
  if ($txt -is [byte[]]) { $txt = [Text.Encoding]::UTF8.GetString($txt) }
  elseif ($r.RawContentStream) { try { $ms = New-Object IO.MemoryStream; $r.RawContentStream.Position = 0; $r.RawContentStream.CopyTo($ms); $txt = [Text.Encoding]::UTF8.GetString($ms.ToArray()) } catch {} }
  return ConvertFrom-Json -InputObject $txt
}

# v2: 구글 중계는 가끔 404·시간 초과를 돌려줌 → 중계 요청만 최대 3번 다시 시도 (이카운트 요청은 다시 보내지 않음)
function RelayPost($obj) {
  $last = $null
  for ($i = 1; $i -le 3; $i++) {
    try { return PostJson $Cfg.relayUrl $obj } catch { $last = $_; if ($i -lt 3) { Start-Sleep -Seconds (2 * $i) } }
  }
  throw $last
}
function DoneLoad() {
  $h = @{}
  if (Test-Path -LiteralPath $DonePath) {
    try { $o = Get-Content -LiteralPath $DonePath -Raw -Encoding UTF8 | ConvertFrom-Json; foreach ($p in $o.PSObject.Properties) { $h[$p.Name] = $p.Value } } catch { Log ('처리 기록 파일을 읽지 못했습니다: ' + $_.Exception.Message) }
  }
  return $h
}
function NowSec() { return [int64]([DateTimeOffset]::UtcNow.ToUnixTimeSeconds()) }
function DoneSave() {
  $cut = (NowSec) - 14 * 86400; $keep = @{}   # 14일 지난 기록만 지움 (숫자 시각으로 비교 — 날짜 글자는 PowerShell 판마다 다르게 읽힘)
  foreach ($k in @($Done.Keys)) { $v = $Done[$k]; $a = 0; try { $a = [int64]$v.t } catch {}; if ($a -eq 0 -or $a -ge $cut) { $keep[$k] = $v } }
  $script:Done = $keep
  try { ConvertTo-Json -InputObject $keep -Depth 10 | Set-Content -LiteralPath $DonePath -Encoding UTF8 } catch { Log ('처리 기록 저장 실패: ' + $_.Exception.Message) }
}

# ── 이카운트 ──
$Sess = @{}
function EcHost($test, $zone) { if ($test) { $p = 'sboapi' } else { $p = 'oapi' }; if ($env:RELAY_EC_BASE) { return $env:RELAY_EC_BASE + '/' + $p + $zone }; return 'https://' + $p + $zone + '.ecount.com' }
function EcZone($test) {
  if ($Cfg.zone) { return $Cfg.zone }
  $key = 'zone' + $test; if ($Sess[$key]) { return $Sess[$key] }
  $r = PostJson ((EcHost $test '') + '/OAPI/V2/Zone') @{ COM_CODE = $Cfg.comCode }
  $z = $null; if ($r.Data) { $z = $r.Data.ZONE }
  if (-not $z) { throw ('이카운트 존 조회 실패: ' + (ConvertTo-Json -InputObject $r -Compress -Depth 5)) }
  $Sess[$key] = $z; return $z
}
function EcLogin($test, $fresh) {
  $key = 'sess' + $test
  if (-not $fresh -and $Sess[$key] -and $Sess[$key + 'At'] -gt (Get-Date).AddMinutes(-20)) { return $Sess[$key] }
  if ($test) { $cert = $Cfg.testCertKey } else { $cert = $Cfg.certKey }
  if (-not $cert) { throw '테스트 인증키가 설정에 없습니다 — 테스트 모드를 끄거나, 설정 파일에 testCertKey를 넣으세요' }
  $zone = EcZone $test
  $r = PostJson ((EcHost $test $zone) + '/OAPI/V2/OAPILogin') @{ COM_CODE = $Cfg.comCode; USER_ID = $Cfg.userId; API_CERT_KEY = $cert; LAN_TYPE = 'ko-KR'; ZONE = $zone }
  $id = $null; if ($r.Data -and $r.Data.Datas) { $id = $r.Data.Datas.SESSION_ID }
  if (-not $id) { $msg = ''; if ($r.Data -and $r.Data.Message) { $msg = $r.Data.Message } elseif ($r.Error -and $r.Error.Message) { $msg = $r.Error.Message } else { $msg = ConvertTo-Json -InputObject $r -Compress -Depth 5 }; throw ('이카운트 로그인 실패: ' + $msg) }
  $Sess[$key] = $id; $Sess[$key + 'At'] = Get-Date; return $id
}
function EcSave($job) {
  $test = [bool]$job.test
  $list = @(); foreach ($row in $job.rows) { $list += , @{ BulkDatas = $row } }
  $body = @{ GoodsReceiptList = $list }
  $sid = EcLogin $test $false
  $url = (EcHost $test (EcZone $test)) + '/OAPI/V2/GoodsReceipt/SaveGoodsReceipt?SESSION_ID='
  $r = PostJson ($url + [Uri]::EscapeDataString($sid)) $body
  if ("$($r.Status)" -ne '200' -and ((ConvertTo-Json -InputObject $r -Compress -Depth 6) -match 'session|세션|로그인|login')) {
    $sid = EcLogin $test $true; $r = PostJson ($url + [Uri]::EscapeDataString($sid)) $body
  }
  $d = $r.Data; $details = @()
  if ($d -and $d.ResultDetails) { foreach ($x in $d.ResultDetails) { $errs = @(); if ($x.Errors) { foreach ($er in $x.Errors) { $errs += ("$($er.ColCd): $($er.Message)").Trim(': ') } }; $details += , @{ ok = [bool]$x.IsSuccess; error = "$($x.TotalError)"; errors = $errs } } }
  $fail = 0; if ($d -and $d.FailCnt) { $fail = [int]$d.FailCnt }
  $ok = ("$($r.Status)" -eq '200') -and ($fail -eq 0) -and (-not $r.Error)
  $err = ''; if ($r.Error) { $err = "$($r.Error.Message)" }
  if (-not $ok -and -not $err) { $bad = $details | Where-Object { -not $_.ok } | Select-Object -First 1; if ($bad) { $err = $bad.error; if (-not $err) { $err = ($bad.errors -join ' / ') } } else { $err = '이카운트가 입력을 거절했습니다: ' + (ConvertTo-Json -InputObject $r -Compress -Depth 5) } }
  $slips = @(); if ($d -and $d.SlipNos) { $slips = @($d.SlipNos) }
  return @{ ok = $ok; test = $test; slipNos = $slips; details = $details; error = $err }
}

# ── 설정 ──
function AskText($q, $pattern, $hint, [switch]$Secret) {
  while ($true) {
    if ($Secret) { $ss = Read-Host ($q + ' (입력해도 화면에 보이지 않습니다)') -AsSecureString; $v = [Runtime.InteropServices.Marshal]::PtrToStringBSTR([Runtime.InteropServices.Marshal]::SecureStringToBSTR($ss)) }
    else { $v = (Read-Host $q) }
    if ($null -eq $v) { $v = '' }
    $v = $v.Trim().Trim('"').Trim("'").Trim()
    if (-not $pattern -or $v -match $pattern) { return $v }
    Write-Host ('   ↳ 형식이 맞지 않습니다. ' + $hint) -ForegroundColor Yellow
  }
}
if (-not (Test-Path -LiteralPath $CfgPath)) {
  Write-Host ''
  Write-Host '처음 한 번 설정합니다. (값은 이 PC의 ecount_relay_pc.json 에만 저장됩니다)'
  Write-Host '붙여넣기: 창 안에서 마우스 오른쪽 버튼 또는 Ctrl+V → Enter'
  Write-Host ''
  $c = [ordered]@{ relayUrl = ''; apiKey = ''; comCode = ''; userId = ''; certKey = ''; testCertKey = ''; zone = '' }
  while ($true) {
    $urlPat = '^https://script\.google\.com/macros/s/[^\s]+/exec$'; if ($env:RELAY_EC_BASE) { $urlPat = '^http' }
    $c.relayUrl = AskText '1) 생산일지 중계 주소 — 통합재고관리 생산일지 → 연동 설정의 「중계 주소」 칸 값' $urlPat 'https://script.google.com/macros/s/…/exec 모양이어야 합니다'
    $c.apiKey = AskText '2) 공유 저장소 열쇠 — 연동 설정의 「공유 저장소 열쇠 복사」를 누른 뒤 붙여넣기' '^\S{16,}$' '긴 영문·숫자 값이어야 합니다' -Secret
    Write-Host '   중계 연결 확인 중…'
    try { $pr = PostJson $c.relayUrl @{ key = $c.apiKey; action = 'ping' }; if ($pr.ok) { Write-Host '   ↳ 중계 연결 확인됨' -ForegroundColor Green; break } else { Write-Host ('   ↳ 중계가 거절했습니다: ' + $pr.error) -ForegroundColor Yellow } }
    catch { Write-Host ('   ↳ 중계에 연결하지 못했습니다: ' + $_.Exception.Message) -ForegroundColor Yellow }
    Write-Host '   1)·2)를 다시 넣어 주세요.'
  }
  while ($true) {
    $c.comCode = AskText '3) 이카운트 회사코드 (로그인 첫 칸의 숫자)' '^\d{3,}$' '숫자만 넣으세요'
    $c.userId = AskText '4) 이카운트 API 사용자 ID (인증키를 발급받은 ID)' '^\S+$' 'ID를 넣으세요'
    $c.certKey = AskText '5) 이카운트 실서버 API 인증키' '^\S{10,}$' '긴 영문·숫자 인증키를 넣으세요' -Secret
    $script:Cfg = [pscustomobject]$c
    Write-Host '   이카운트 로그인 확인 중…'
    try { $null = EcLogin $false $true; Write-Host '   ↳ 이카운트 로그인 성공' -ForegroundColor Green; break }
    catch { Write-Host ('   ↳ ' + $_.Exception.Message) -ForegroundColor Yellow; Write-Host '   3)~5)를 다시 넣어 주세요.' }
  }
  $c.testCertKey = AskText '6) 이카운트 테스트 인증키 (없으면 그냥 Enter)' '' '' -Secret
  ConvertTo-Json -InputObject $c | Set-Content -LiteralPath $CfgPath -Encoding UTF8
  Write-Host '설정을 저장했습니다.' -ForegroundColor Green
  $a = Read-Host 'PC를 켤 때 이 전송기를 자동으로 실행할까요? (Y/N)'
  if ($a -match '^[Yy]') {
    try {
      $startup = [Environment]::GetFolderPath('Startup')
      $lnk = Join-Path $startup '생산일지_이카운트_전송기.bat'
      Set-Content -LiteralPath $lnk -Value ('@start "Ecount production sender" /min "' + $Self + '"') -Encoding Default
      Write-Host ('자동 실행을 등록했습니다: ' + $lnk)
    } catch { Write-Host ('자동 실행 등록 실패: ' + $_.Exception.Message) }
  }
}
$Cfg = Get-Content -LiteralPath $CfgPath -Raw -Encoding UTF8 | ConvertFrom-Json
foreach ($k in 'relayUrl', 'apiKey', 'comCode', 'userId', 'certKey') { if (-not $Cfg.$k) { Log ("설정에 $k 가 비어 있습니다 — " + $CfgPath + ' 파일을 지우고 다시 실행하세요'); Read-Host '끝내려면 Enter'; exit 1 } }

# ── 반복 ──
Log ('생산일지 이카운트 전송기 v2 시작 — ' + $Poll + '초마다 중계를 확인합니다. 이 창을 닫으면 전송이 멈춥니다.')
$fails = 0
$Done = DoneLoad
while ($true) {
  try {
    $r = RelayPost @{ key = $Cfg.apiKey; action = 'jobs' }
    if (-not $r.ok) { throw ('중계 거절: ' + $r.error) }
    if ($fails -gt 0) { Log '중계 연결 복구' }; $fails = 0
    foreach ($job in @($r.jobs)) {
      if (-not $job) { continue }
      $res = $null; $jid = [string]$job.id
      if ($jid -and $Done.ContainsKey($jid)) {
        $res = $Done[$jid].result; Log ('이미 전표를 만든 건입니다 (' + (@($res.slipNos) -join ', ') + ') — 새로 만들지 않고 결과만 다시 돌려줍니다')
      } else {
        try { $res = EcSave $job } catch { $res = @{ ok = $false; test = [bool]$job.test; slipNos = @(); details = @(); error = $_.Exception.Message } }
        if ($res.ok) {
          $t = ''; if ($res.test) { $t = '[테스트] ' }; Log ($t + '전표 ' + ($res.slipNos -join ', ') + ' 생성 (' + @($job.rows).Count + '품목)')
          if ($jid) { $Done[$jid] = @{ t = (NowSec); result = $res }; DoneSave }   # 결과를 돌려주기 전에 먼저 기록
        } else { Log ('실패: ' + $res.error) }
      }
      try { $null = RelayPost @{ key = $Cfg.apiKey; action = 'done'; id = $job.id; result = $res } } catch { Log ('결과 돌려주기 실패 (다음 확인 때 다시 돌려줍니다, 전표는 다시 만들지 않음): ' + $_.Exception.Message) }
    }
  } catch {
    $fails++; if ($fails -le 3 -or $fails % 30 -eq 0) { Log ('확인 실패 (3번 다시 시도 후): ' + $_.Exception.Message) }
  }
  if ($env:RELAY_ONCE) { break }
  Start-Sleep -Seconds $Poll
}
