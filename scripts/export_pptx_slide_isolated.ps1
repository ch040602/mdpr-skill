param(
    [Parameter(Mandatory = $true)][string]$PptxPath,
    [Parameter(Mandatory = $true)][string]$OutputPath,
    [Parameter(Mandatory = $true)][int]$SlideIndex,
    [int]$Width = 1600,
    [int]$Height = 900
)

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public static class PowerPointProcess {
    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);
}
"@

$app = $null
$presentation = $null
$slide = $null
$warmupPath = "$OutputPath.warmup.png"
$powerPointProcessId = 0
try {
    $app = New-Object -ComObject PowerPoint.Application
    $app.Visible = -1
    $windowHandle = $null
    try {
        $windowHandle = $app.HWND
    }
    catch {
        # A transiently unavailable window handle must not block slide export.
        $windowHandle = $null
    }
    if ($null -ne $windowHandle -and [Int64]$windowHandle -ne 0) {
        [void][PowerPointProcess]::GetWindowThreadProcessId([IntPtr]$windowHandle, [ref]$powerPointProcessId)
    }
    $presentation = $app.Presentations.Open($PptxPath, $true, $false, $false)
    if ($SlideIndex -lt 1 -or $SlideIndex -gt $presentation.Slides.Count) {
        throw "Slide index $SlideIndex is outside 1..$($presentation.Slides.Count)."
    }
    # PowerPoint opens presentations before every text layout and font metric is
    # ready. A short stabilization window avoids clipped first-frame exports.
    Start-Sleep -Milliseconds 1500
    $slide = $presentation.Slides.Item($SlideIndex)
    $slide.Export($warmupPath, "PNG", $Width, $Height)
    Start-Sleep -Milliseconds 300
    $slide.Export($OutputPath, "PNG", $Width, $Height)
}
finally {
    if ($null -ne $slide) {
        [void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($slide)
    }
    if ($null -ne $presentation) {
        $presentation.Close()
        [void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($presentation)
    }
    if ($null -ne $app) {
        $app.Quit()
        [void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($app)
    }
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
    if ($powerPointProcessId -gt 0) {
        Wait-Process -Id $powerPointProcessId -Timeout 15 -ErrorAction SilentlyContinue
    }
    if (Test-Path -LiteralPath $warmupPath) {
        Remove-Item -LiteralPath $warmupPath -Force
    }
}

if (-not (Test-Path -LiteralPath $OutputPath -PathType Leaf)) {
    throw "PowerPoint did not create $OutputPath."
}
