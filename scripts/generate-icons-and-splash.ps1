Add-Type -AssemblyName System.Drawing

$iconSrcPath = "C:\Users\Asus\.gemini\antigravity-ide\brain\4bec66e5-29e2-4057-b140-94be77f416a7\colorrush_app_icon_1789911087946.jpg"
$splashSrcPath = "C:\Users\Asus\.gemini\antigravity-ide\brain\4bec66e5-29e2-4057-b140-94be77f416a7\colorrush_splash_v2_1789911109477.jpg"
$resDir = "c:\Users\Asus\Nextcloud3\Project Andre\React Native\Games\Games\Color Clash\android\app\src\main\res"

if (-not (Test-Path $iconSrcPath)) {
    Write-Error "Icon source image not found: $iconSrcPath"
    exit 1
}
if (-not (Test-Path $splashSrcPath)) {
    Write-Error "Splash source image not found: $splashSrcPath"
    exit 1
}

$iconSrc = [System.Drawing.Image]::FromFile($iconSrcPath)
$splashSrc = [System.Drawing.Image]::FromFile($splashSrcPath)

# ---------------------------------------------------------------------------
# 1. GENERATE APP ICONS (MIPMAP)
# ---------------------------------------------------------------------------
$iconTargets = @(
    @{ Dir = "mipmap-mdpi"; Size = 48; ForeSize = 108 },
    @{ Dir = "mipmap-hdpi"; Size = 72; ForeSize = 162 },
    @{ Dir = "mipmap-xhdpi"; Size = 96; ForeSize = 216 },
    @{ Dir = "mipmap-xxhdpi"; Size = 144; ForeSize = 324 },
    @{ Dir = "mipmap-xxxhdpi"; Size = 192; ForeSize = 432 }
)

foreach ($t in $iconTargets) {
    $folder = Join-Path $resDir $t.Dir
    if (-not (Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder -Force | Out-Null
    }
    $size = $t.Size
    $foreSize = $t.ForeSize

    # 1A. Standard ic_launcher.png (with subtle rounded corners)
    $bmpStandard = New-Object System.Drawing.Bitmap $size, $size
    $gfxStandard = [System.Drawing.Graphics]::FromImage($bmpStandard)
    $gfxStandard.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gfxStandard.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $gfxStandard.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $gfxStandard.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $gfxStandard.DrawImage($iconSrc, 0, 0, $size, $size)
    $gfxStandard.Dispose()
    $outStandard = Join-Path $folder "ic_launcher.png"
    if (Test-Path $outStandard) { Remove-Item $outStandard -Force }
    $bmpStandard.Save($outStandard, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmpStandard.Dispose()

    # 1B. Circular ic_launcher_round.png
    $bmpRound = New-Object System.Drawing.Bitmap $size, $size
    $gfxRound = [System.Drawing.Graphics]::FromImage($bmpRound)
    $gfxRound.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gfxRound.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $gfxRound.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $gfxRound.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddEllipse(0, 0, $size, $size)
    $gfxRound.SetClip($path)
    $gfxRound.DrawImage($iconSrc, 0, 0, $size, $size)
    $gfxRound.ResetClip()
    $path.Dispose()
    $gfxRound.Dispose()
    $outRound = Join-Path $folder "ic_launcher_round.png"
    if (Test-Path $outRound) { Remove-Item $outRound -Force }
    $bmpRound.Save($outRound, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmpRound.Dispose()

    # 1C. Adaptive Foreground ic_launcher_foreground.png (Centered icon on transparent canvas)
    $bmpFore = New-Object System.Drawing.Bitmap $foreSize, $foreSize
    $gfxFore = [System.Drawing.Graphics]::FromImage($bmpFore)
    $gfxFore.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gfxFore.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $gfxFore.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $gfxFore.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    # Adaptive foreground takes up ~72dp of 108dp (approx 66% width)
    $iconDrawSize = [int]($foreSize * 0.72)
    $iconOffset = [int](($foreSize - $iconDrawSize) / 2)
    $gfxFore.DrawImage($iconSrc, $iconOffset, $iconOffset, $iconDrawSize, $iconDrawSize)
    $gfxFore.Dispose()
    $outFore = Join-Path $folder "ic_launcher_foreground.png"
    if (Test-Path $outFore) { Remove-Item $outFore -Force }
    $bmpFore.Save($outFore, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmpFore.Dispose()

    Write-Host "Icons generated for $($t.Dir): $size x $size, foreground $foreSize x $foreSize"
}

# ---------------------------------------------------------------------------
# 2. GENERATE SPLASH SCREENS (DRAWABLE)
# ---------------------------------------------------------------------------
$splashTargets = @(
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

$srcW = $splashSrc.Width
$srcH = $splashSrc.Height

foreach ($t in $splashTargets) {
    $outFolder = Join-Path $resDir $t.Dir
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
        $scale = [double]$th / [double]$srcH
        $destW = [int]($srcW * $scale)
        $destH = $th
        $destX = [int](($tw - $destW) / 2)
        $destY = 0
        $gfx.DrawImage($splashSrc, $destX, $destY, $destW, $destH)
    } else {
        $scaleX = [double]$tw / [double]$srcW
        $scaleY = [double]$th / [double]$srcH
        $scale = [Math]::Max($scaleX, $scaleY)
        $destW = [int]($srcW * $scale)
        $destH = [int]($srcH * $scale)
        $destX = [int](($tw - $destW) / 2)
        $destY = [int](($th - $destH) / 2)
        $gfx.DrawImage($splashSrc, $destX, $destY, $destW, $destH)
    }

    $gfx.Dispose()
    $brush.Dispose()

    if (Test-Path $outFile) { Remove-Item $outFile -Force }
    $bmp.Save($outFile, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Splash generated: $outFile ($tw x $th)"
}

$iconSrc.Dispose()
$splashSrc.Dispose()

Write-Host "All icons and splash screens generated and updated successfully!"
