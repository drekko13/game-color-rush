Add-Type -AssemblyName System.Drawing

$sourcePath = "C:\Users\Asus\.gemini\antigravity-ide\brain\4bec66e5-29e2-4057-b140-94be77f416a7\colorrush_splash_screen_1789910700902.jpg"
$baseDir = "c:\Users\Asus\Nextcloud3\Project Andre\React Native\Games\Games\Color Clash\android\app\src\main\res"

if (-not (Test-Path $sourcePath)) {
    Write-Error "Source image not found: $sourcePath"
    exit 1
}

$targets = @(
    @{ Dir = "drawable"; W = 480; H = 320; Land = $true },
    @{ Dir = "drawable-port-mdpi"; W = 320; H = 480; Land = $false },
    @{ Dir = "drawable-port-hdpi"; W = 480; H = 800; Land = $false },
    @{ Dir = "drawable-port-xhdpi"; W = 720; H = 1280; Land = $false },
    @{ Dir = "drawable-port-xxhdpi"; W = 960; H = 1600; Land = $false },
    @{ Dir = "drawable-port-xxxhdpi"; W = 1280; H = 1920; Land = $false },
    @{ Dir = "drawable-land-mdpi"; W = 480; H = 320; Land = $true },
    @{ Dir = "drawable-land-hdpi"; W = 800; H = 480; Land = $true },
    @{ Dir = "drawable-land-xhdpi"; W = 1280; H = 720; Land = $true },
    @{ Dir = "drawable-land-xxhdpi"; W = 1600; H = 960; Land = $true },
    @{ Dir = "drawable-land-xxxhdpi"; W = 1920; H = 1280; Land = $true }
)

$srcImg = [System.Drawing.Image]::FromFile($sourcePath)
$srcW = $srcImg.Width
$srcH = $srcImg.Height

foreach ($t in $targets) {
    $outFolder = Join-Path $baseDir $t.Dir
    if (-not (Test-Path $outFolder)) {
        New-Item -ItemType Directory -Path $outFolder -Force | Out-Null
    }
    $outFile = Join-Path $outFolder "splash.png"
    $tw = $t.W
    $th = $t.H

    $bmp = New-Object System.Drawing.Bitmap $tw, $th
    $gfx = [System.Drawing.Graphics]::FromImage($bmp)
    $gfx.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gfx.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $gfx.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $gfx.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    # Dark background fill #0a0d14
    $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 10, 13, 20))
    $gfx.FillRectangle($brush, 0, 0, $tw, $th)

    if ($t.Land) {
        # For landscape: fit height and center horizontally
        $scale = [double]$th / [double]$srcH
        $destW = [int]($srcW * $scale)
        $destH = $th
        $destX = [int](($tw - $destW) / 2)
        $destY = 0
        $gfx.DrawImage($srcImg, $destX, $destY, $destW, $destH)
    } else {
        # For portrait: center crop (cover)
        $scaleX = [double]$tw / [double]$srcW
        $scaleY = [double]$th / [double]$srcH
        $scale = [Math]::Max($scaleX, $scaleY)
        $destW = [int]($srcW * $scale)
        $destH = [int]($srcH * $scale)
        $destX = [int](($tw - $destW) / 2)
        $destY = [int](($th - $destH) / 2)
        $gfx.DrawImage($srcImg, $destX, $destY, $destW, $destH)
    }

    $gfx.Dispose()
    $brush.Dispose()

    # Save as PNG
    if (Test-Path $outFile) {
        Remove-Item $outFile -Force
    }
    $bmp.Save($outFile, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Generated: $outFile ($tw x $th)"
}

$srcImg.Dispose()
Write-Host "All splash screens generated successfully!"
