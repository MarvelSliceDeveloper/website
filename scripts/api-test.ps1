<#
.SYNOPSIS
  LMS API testing helper — wraps curl with session management.

.DESCRIPTION
  Login once as a role, then make requests without re-authenticating.
  Responses are auto-formatted as pretty JSON.

  Sessions are stored in %TEMP%\lms-api-sessions\ as cookie files.

  The last argument can be key=value pairs (auto-converted to JSON body)
  or a --body flag.

.EXAMPLE
  # Login (key=value pairs auto-converted to JSON)
  .\scripts\api-test.ps1 login admin email=admin@lms.local password=admin123
  .\scripts\api-test.ps1 login student email=student@lms.local password=student123

  # List enrolled courses
  .\scripts\api-test.ps1 get /api/courses/enrolled --as student

  # View course content
  .\scripts\api-test.ps1 get /api/courses/1/content --as student

  # List pending enrollments (admin)
  .\scripts\api-test.ps1 get "/api/admin/enrollments?status=PENDING"

  # Approve enrollment (key=value body)
  .\scripts\api-test.ps1 patch /api/admin/enrollments/1/approve batchId=abc-123

  # Reject enrollment
  .\scripts\api-test.ps1 patch /api/admin/enrollments/1/reject

  # List batches
  .\scripts\api-test.ps1 get /api/admin/batches
#>

param(
  [Parameter(Position = 0, Mandatory)]
  [ValidateSet("login", "get", "post", "patch", "put", "delete")]
  [string]$Action,

  [Parameter(Position = 1, Mandatory)]
  [string]$Url,

  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$RemainingArgs
)

# Parse remaining args
$Session = "admin"
$Body = ""
$VerboseOutput = $false
$kvPairs = @{}

$skipNext = $false
for ($i = 0; $i -lt $RemainingArgs.Count; $i++) {
  $arg = $RemainingArgs[$i]
  if ($skipNext) { $skipNext = $false; continue }

  if ($arg -eq "-v" -or $arg -eq "--v") {
    $VerboseOutput = $true
  } elseif ($arg -eq "--as" -or $arg -eq "-as") {
    if ($i + 1 -lt $RemainingArgs.Count) {
      $Session = $RemainingArgs[$i + 1]
      $skipNext = $true
    }
  } elseif ($arg -like "--as=*") {
    $Session = $arg.Substring(5)
  } elseif ($arg -like "-as=*") {
    $Session = $arg.Substring(4)
  } elseif ($arg -match '^([a-zA-Z_][a-zA-Z0-9_]*)=(.*)$') {
    $kvPairs[$matches[1]] = $matches[2]
  } else {
    # positional body (JSON string) — last one wins
    $Body = $arg
  }
}

# Build JSON body from key=value pairs
if ($kvPairs.Count -gt 0) {
  $Body = $kvPairs | ConvertTo-Json -Compress
}

$base = "http://localhost:4000"
$sessionDir = "$env:TEMP\lms-api-sessions"
$null = New-Item -ItemType Directory -Path $sessionDir -Force

$cookieFile = "$sessionDir\$Session-cookies.txt"

$curlArgs = @(
  "-s", "-S"
  "--cookie-jar", "`"$cookieFile`""
  "--cookie", "`"$cookieFile`""
)

function Write-TempBody {
  param([string]$Content)
  $tmpFile = "$env:TEMP\lms-body-$([System.IO.Path]::GetRandomFileName()).json"
  [System.IO.File]::WriteAllText($tmpFile, $Content)
  return $tmpFile
}

function Invoke-Api {
  param([string[]]$ArgsList)
  $allArgs = @($curlArgs) + @($ArgsList)
  $allArgs += "--write-out", "`n%{http_code}"

  # Replace -d "body" with -d @file to avoid quoting issues
  $idx = [array]::IndexOf($allArgs, "-d")
  $tmpFile = $null
  if ($idx -ge 0 -and $idx + 1 -lt $allArgs.Length) {
    $bodyContent = $allArgs[$idx + 1]
    $tmpFile = Write-TempBody $bodyContent
    $allArgs[$idx + 1] = "@$tmpFile"
  }

  if ($VerboseOutput) {
    Write-Host "`n--- Request ---" -ForegroundColor Cyan
    Write-Host "curl.exe $($allArgs -join ' ')" -ForegroundColor Gray
  }

  $result = & curl.exe @allArgs 2>&1
  if ($tmpFile) { Remove-Item $tmpFile -ErrorAction SilentlyContinue }

  $lines = @($result)
  $statusCode = $lines[-1]
  $body = $lines[0..($lines.Length - 2)] -join "`n"

  Write-Host "Status: $statusCode" -ForegroundColor $(if ($statusCode -ge 200 -and $statusCode -lt 300) { "Green" } else { "Yellow" })

  try {
    $parsed = $body | ConvertFrom-Json -ErrorAction Stop
    $parsed | ConvertTo-Json -Depth 10
  } catch {
    $body
  }
}

switch ($Action) {
  "login" {
    Write-Host "Logging in as '$Session'..." -ForegroundColor Green
    if ($VerboseOutput) { Write-Host "Body: $Body" -ForegroundColor Magenta }
    Invoke-Api @("-X", "POST", "$base/api/auth/login", "-H", "Content-Type: application/json", "-d", $Body)
    if (Test-Path $cookieFile) {
      Write-Host "`nSession '$Session' saved." -ForegroundColor Green
      Write-Host "Cookie file: $cookieFile" -ForegroundColor Gray
    }
    break
  }
  "get" {
    Invoke-Api @("-X", "GET", "$base$Url")
    break
  }
  "post" {
    if ($Body) {
      Invoke-Api @("-X", "POST", "$base$Url", "-H", "Content-Type: application/json", "-d", $Body)
    } else {
      Invoke-Api @("-X", "POST", "$base$Url")
    }
    break
  }
  "patch" {
    if ($Body) {
      Invoke-Api @("-X", "PATCH", "$base$Url", "-H", "Content-Type: application/json", "-d", $Body)
    } else {
      Invoke-Api @("-X", "PATCH", "$base$Url")
    }
    break
  }
  "put" {
    if ($Body) {
      Invoke-Api @("-X", "PUT", "$base$Url", "-H", "Content-Type: application/json", "-d", $Body)
    } else {
      Invoke-Api @("-X", "PUT", "$base$Url")
    }
    break
  }
  "delete" {
    Invoke-Api @("-X", "DELETE", "$base$Url")
    break
  }
}
