<#
.SYNOPSIS
  Interactive API testing menu. Pick role, pick endpoint, see response.
  No arguments needed - arrow keys + Enter to navigate.
#>

$base = "http://localhost:4000"
$sessionDir = "$env:TEMP\lms-api-sessions"
$null = New-Item -ItemType Directory -Path $sessionDir -Force

$roles = @(
  @{ Name = "Admin";    Email = "admin@lms.local";       Password = "admin123" }
  @{ Name = "Student";  Email = "student@lms.local";     Password = "student123" }
  @{ Name = "Instructor"; Email = "instructor@lms.local"; Password = "instructor123" }
)

$endpoints = @(
  @{ Label = "Health check";              Verb = "GET";    Url = "/health";                          Role = "*";       Fields = @() }
  @{ Label = "Current user info";         Verb = "GET";    Url = "/api/auth/me";                     Role = "*";       Fields = @() }
  @{ Label = "Course catalogue";          Verb = "GET";    Url = "/api/courses/catalogue";           Role = "*";       Fields = @() }
  @{ Label = ". . Student only . .";      Verb = "";       Url = "";                                 Role = "Student"; Fields = @() }
  @{ Label = "Enrolled courses";          Verb = "GET";    Url = "/api/courses/enrolled";            Role = "Student"; Fields = @() }
  @{ Label = "Course content";            Verb = "GET";    Url = "/api/courses/{courseId}/content";  Role = "Student"; Fields = @("courseId") }
  @{ Label = "Enroll in course";          Verb = "POST";   Url = "/api/enrollments";                 Role = "Student"; Fields = @("courseId") }
  @{ Label = ". . Admin only . .";        Verb = "";       Url = "";                                 Role = "Admin";   Fields = @() }
  @{ Label = "List enrollments";          Verb = "GET";    Url = "/api/admin/enrollments";           Role = "Admin";   Fields = @() }
  @{ Label = "Pending enrollments";       Verb = "GET";    Url = "/api/admin/enrollments?status=PENDING"; Role = "Admin"; Fields = @() }
  @{ Label = "Approve enrollment";        Verb = "PATCH";  Url = "/api/admin/enrollments/{id}/approve";  Role = "Admin"; Fields = @("id", "batchId") }
  @{ Label = "Reject enrollment";         Verb = "PATCH";  Url = "/api/admin/enrollments/{id}/reject";   Role = "Admin"; Fields = @("id") }
  @{ Label = "List batches";              Verb = "GET";    Url = "/api/admin/batches";               Role = "Admin";   Fields = @() }
  @{ Label = "Batch details";             Verb = "GET";    Url = "/api/admin/batches/{id}";          Role = "Admin";   Fields = @("id") }
  @{ Label = "List packages";             Verb = "GET";    Url = "/api/admin/packages";              Role = "Admin";   Fields = @() }
)

function Write-At($x, $y, $msg, $fg) {
  $pos = $host.UI.RawUI.CursorPosition
  $pos.X = $x; $pos.Y = $y
  $host.UI.RawUI.CursorPosition = $pos
  if ($fg) { Write-Host $msg -ForegroundColor $fg -NoNewline } else { Write-Host $msg -NoNewline }
}

function Show-Menu(
  [string]$Title,
  [array]$Items,
  [ref]$SelectedRef,
  [string]$Filter = ""
) {
  Clear-Host
  Write-Host "==============================================" -ForegroundColor Cyan
  Write-Host "    LMS API Tester - Interactive Mode" -ForegroundColor Cyan
  Write-Host "==============================================" -ForegroundColor Cyan
  Write-Host ""
  Write-Host "  $Title" -ForegroundColor Yellow
  Write-Host "  (type to filter, up/down navigate, Enter select, Esc back)" -ForegroundColor DarkGray
  Write-Host ""

  $filtered = @()
  for ($i = 0; $i -lt $Items.Count; $i++) {
    $text = if ($Items[$i].Label) { $Items[$i].Label } else { $Items[$i].ToString() }
    if (-not $Filter -or $text -like "*$Filter*") {
      $filtered += @{ Item = $Items[$i]; Text = $text; OrigIndex = $i }
    }
  }

  for ($i = 0; $i -lt $filtered.Count; $i++) {
    $isSep = $filtered[$i].Text -match "^\. \."
    $prefix = if ($i -eq $SelectedRef.Value) { " > " } else { "   " }

    if ($isSep) {
      Write-Host ""
      Write-Host "   $($filtered[$i].Text)" -ForegroundColor DarkGray
    } elseif ($i -eq $SelectedRef.Value) {
      Write-Host "$prefix$($filtered[$i].Text)" -ForegroundColor Green -BackgroundColor DarkGray
    } else {
      Write-Host "$prefix$($filtered[$i].Text)" -ForegroundColor White
    }
  }

  return $filtered
}

function Select-Item([string]$Title, [array]$Items) {
  $selected = 0
  $filter = ""

  while ($true) {
    $filtered = Show-Menu -Title $Title -Items $Items -SelectedRef ([ref]$selected) -Filter $filter

    $key = $host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

    if ($key.VirtualKeyCode -eq 27) { return $null }  # Esc
    elseif ($key.VirtualKeyCode -eq 13) {  # Enter
      if ($filtered.Count -eq 0) { continue }
      if ($filtered[$selected].Text -match "^\. \.") { continue }
      return $filtered[$selected].Item
    }
    elseif ($key.VirtualKeyCode -eq 38) {  # Up
      $selected = [math]::max(0, $selected - 1)
      if ($selected -lt $filtered.Count -and $filtered[$selected].Text -match "^\. \.") {
        $selected = [math]::max(0, $selected - 1)
      }
    }
    elseif ($key.VirtualKeyCode -eq 40) {  # Down
      $selected = [math]::min($filtered.Count - 1, $selected + 1)
      if ($selected -lt $filtered.Count -and $filtered[$selected].Text -match "^\. \.") {
        $selected = [math]::min($filtered.Count - 1, $selected + 1)
      }
    }
    elseif ($key.VirtualKeyCode -eq 8) {  # Backspace
      if ($filter.Length -gt 0) {
        $filter = $filter.Substring(0, $filter.Length - 1)
        $selected = 0
      }
    }
    elseif ($key.VirtualKeyCode -eq 46) {  # Delete
      $filter = ""
      $selected = 0
    }
    elseif ($key.Character -ge 32) {
      $filter += $key.Character
      $selected = 0
    }
  }
}

function Invoke-And-Show(
  [string]$RoleName,
  [string]$Verb,
  [string]$Url,
  [string]$Body = ""
) {
  Clear-Host
  Write-Host "==============================================" -ForegroundColor Cyan
  Write-Host "              API Response" -ForegroundColor Cyan
  Write-Host "==============================================" -ForegroundColor Cyan
  Write-Host ""

  $cookieFile = "$sessionDir/$RoleName-cookies.txt"
  Write-Host "  Role: $RoleName" -ForegroundColor DarkGray
  Write-Host "  $Verb $base$Url" -ForegroundColor DarkGray
  if ($Body) { Write-Host "  Body: $Body" -ForegroundColor DarkGray }
  Write-Host ""

  if (-not (Test-Path $cookieFile)) {
    Write-Host "  [..] No session for '$RoleName'. Logging in..." -ForegroundColor Yellow
    $roleDef = $roles | Where-Object { $_.Name -eq $RoleName }
    $loginBody = @{ email = $roleDef.Email; password = $roleDef.Password } | ConvertTo-Json -Compress
    $tmpFile = "$env:TEMP/lms-login-$([System.IO.Path]::GetRandomFileName()).json"
    [System.IO.File]::WriteAllText($tmpFile, $loginBody)
    $r = & curl.exe -s -S -X POST "$base/api/auth/login" -H "Content-Type: application/json" -d "@$tmpFile" --cookie-jar "`"$cookieFile`"" --write-out "`n%{http_code}" 2>&1
    Remove-Item $tmpFile -ErrorAction SilentlyContinue
    $lines = @($r)
    $code = $lines[-1]
    if ($code -ne 200) {
      Write-Host "  [FAIL] Login failed (HTTP $code). Check credentials." -ForegroundColor Red
      Write-Host $lines[0..($lines.Length - 2)] -join "`n"
      return
    }
    Write-Host "  [OK] Logged in successfully.`n" -ForegroundColor Green
  }

  $curlArgs = @("-s", "-S", "--cookie-jar", "`"$cookieFile`"", "--cookie", "`"$cookieFile`"")
  $curlArgs += "-X", $Verb
  $curlArgs += "--write-out", "`n%{http_code}"

  if ($Body) {
    $tmpFile = "$env:TEMP/lms-body-$([System.IO.Path]::GetRandomFileName()).json"
    [System.IO.File]::WriteAllText($tmpFile, $Body)
    $curlArgs += "-H", "Content-Type: application/json", "-d", "@$tmpFile"
  }

  $curlArgs += "$base$Url"
  $result = & curl.exe @curlArgs 2>&1
  if ($Body) { Remove-Item $tmpFile -ErrorAction SilentlyContinue }

  $lines = @($result)
  $statusCode = $lines[-1]
  $response = $lines[0..($lines.Length - 2)] -join "`n"

  $color = if ($statusCode -ge 200 -and $statusCode -lt 300) { "Green" } else { "Yellow" }
  Write-Host "  HTTP $statusCode" -ForegroundColor $color
  Write-Host ""

  try {
    $parsed = $response | ConvertFrom-Json -ErrorAction Stop
    $parsed | ConvertTo-Json -Depth 10
  } catch {
    if ($response.Trim()) { $response } else { "(empty response)" }
  }

  Write-Host ""
  Write-Host "  ----------------------------------------" -ForegroundColor DarkGray
  Write-Host "  Press any key to return to menu..." -ForegroundColor DarkGray
  $null = $host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Build-Url([string]$Url, $FieldValues) {
  $result = $Url
  if ($FieldValues) {
    foreach ($kv in $FieldValues.GetEnumerator()) {
      $result = $result -replace "\{$($kv.Key)\}", $kv.Value
    }
  }
  return $result
}

# Main loop
while ($true) {
  $roleNames = $roles | ForEach-Object { $_.Name }
  $role = Select-Item -Title "Select a role:" -Items $roleNames
  if (-not $role) { break }

  $roleEndpoints = $endpoints | Where-Object { $_."Role" -eq "*" -or $_."Role" -eq $role }
  $endpoint = Select-Item -Title "Select an endpoint ($role):" -Items $roleEndpoints
  if (-not $endpoint) { continue }
  if (-not $endpoint.Verb) { continue }

  $fieldValues = @{}
  if ($endpoint.Fields.Count -gt 0) {
    Clear-Host
    Write-Host "  Fill in parameters for: $($endpoint.Label)" -ForegroundColor Yellow
    Write-Host ""
    foreach ($f in $endpoint.Fields) {
      Write-Host "  Enter $f : " -ForegroundColor Yellow -NoNewline
      $val = Read-Host
      if ([string]::IsNullOrWhiteSpace($val)) {
        Write-Host "  Cancelled." -ForegroundColor Red
        continue 2
      }
      $fieldValues[$f] = $val
    }
  }

  $body = ""
  $urlParams = if ($endpoint.Url -match '\{(\w+)\}') { $matches[1] } else { @() }
  if ($endpoint.Verb -in @("POST", "PATCH", "PUT") -and $endpoint.Fields.Count -gt 0) {
    $bodyFields = $endpoint.Fields | Where-Object { $_ -notin @($urlParams) }
    if ($bodyFields.Count -gt 0) {
      $bodyObj = @{}
      foreach ($f in $bodyFields) { $bodyObj[$f] = $fieldValues[$f] }
      $body = $bodyObj | ConvertTo-Json -Compress
    }
  }

  $finalUrl = Build-Url -Url $endpoint.Url -FieldValues $fieldValues
  Invoke-And-Show -RoleName $role -Verb $endpoint.Verb -Url $finalUrl -Body $body
}

Clear-Host
Write-Host "Goodbye!" -ForegroundColor Green
