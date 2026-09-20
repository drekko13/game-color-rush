Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\Asus\.gemini\antigravity-ide\brain\4bec66e5-29e2-4057-b140-94be77f416a7\.user_uploaded\media_1789913240791.jpg"
$resDir = "c:\Users\Asus\Nextcloud3\Project Andre\React Native\Games\Games\Color Clash\android\app\src\main\res"
$publicDir = "c:\Users\Asus\Nextcloud3\Project Andre\React Native\Games\Games\Color Clash\public"

if (-not (Test-Path $srcPath)) {
    Write-Error "Source image not found: $srcPath"
    exit 1
}

$srcImg = [System.Drawing.Image]::FromFile($srcPath)
$srcW = $srcImg.Width
$srcH = $srcImg.Height

# Sample corner color for seamless splash background
$srcBmp = New-Object System.Drawing.Bitmap $srcImg
$cornerColor = $srcBmp.GetPixel(10, 10)
$bgR = $cornerColor.R
$bgG = $cornerColor.G
$bgB = $cornerColor.B
Write-Host "Corner sample color: R=$bgR, G=$bgG, B=$bgB"

# Save copy to public/app-logo.png for web & AboutModal
$publicLogo = Join-Path $publicDir "app-logo.png"
if (Test-Path $publicLogo) { Remove-Item $publicLogo -Force }
$srcBmp.Save($publicLogo, [System.Drawing.Imaging.ImageFormat]::Png)
$srcBmp.Dispose()
Write-Host "Saved public logo: $publicLogo"

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

    # 1A. Standard ic_launcher.png
    $bmpStandard = New-Object System.Drawing.Bitmap $size, $size
    $gfxStandard = [System.Drawing.Graphics]::FromImage($bmpStandard)
    $gfxStandard.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gfxStandard.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $gfxStandard.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $gfxStandard.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $gfxStandard.DrawImage($srcImg, 0, 0, $size, $size)
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
    $gfxRound.DrawImage($srcImg, 0, 0, $size, $size)
    $gfxRound.ResetClip()
    $path.Dispose()
    $gfxRound.Dispose()
    $outRound = Join-Path $folder "ic_launcher_round.png"
    if (Test-Path $outRound) { Remove-Item $outRound -Force }
    $bmpRound.Save($outRound, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmpRound.Dispose()

    # 1C. Adaptive Foreground ic_launcher_foreground.png
    $bmpFore = New-Object System.Drawing.Bitmap $foreSize, $foreSize
    $gfxFore = [System.Drawing.Graphics]::FromImage($bmpFore)
    $gfxFore.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gfxFore.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $gfxFore.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $gfxFore.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    # Adaptive foreground takes up ~75% width
    $iconDrawSize = [int]($foreSize * 0.76)
    $iconOffset = [int](($foreSize - $iconDrawSize) / 2)
    $gfxFore.DrawImage($srcImg, $iconOffset, $iconOffset, $iconDrawSize, $iconDrawSize)
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
    $gfx.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    # Background fill using sampled corner color
    $bgBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, $bgR, $bgG, $bgB))
    $gfx.FillRectangle($bgBrush, 0, 0, $tw, $th)
    $bgBrush.Dispose()

    if ($t.Land) {
        # Landscape: Fit logo vertically (~80% of height)
        $logoH = [int]($th * 0.82)
        $logoW = $logoH
        $logoX = [int](($tw - $logoW) / 2)
        $logoY = [int](($th - $logoH) / 2) - [int]($th * 0.02)
        $gfx.DrawImage($srcImg, $logoX, $logoY, $logoW, $logoH)

        # Version text at bottom
        $fontSize = [float][Math]::Max(9, [int]($th * 0.03))
        $font = New-Object System.Drawing.Font ("Segoe UI", $fontSize, [System.Drawing.FontStyle]::Bold)
        $textBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(200, 203, 213, 225))
        $sf = New-Object System.Drawing.StringFormat
        $sf.Alignment = [System.Drawing.StringAlignment]::Center
        $sf.LineAlignment = [System.Drawing.StringAlignment]::Center

        $rectY = [float]($th - [int]($th * 0.08))
        $rectH = [float][int]($th * 0.06)
        $textRect = New-Object System.Drawing.RectangleF ([float]0, $rectY, [float]$tw, $rectH)
        $gfx.DrawString("Version 1.0.0", $font, $textBrush, $textRect, $sf)

        $font.Dispose()
        $textBrush.Dispose()
        $sf.Dispose()
    } else {
        # Portrait: Fit logo horizontally (~84% of width)
        $logoW = [int]($tw * 0.84)
        $logoH = $logoW
        $logoX = [int](($tw - $logoW) / 2)
        $logoY = [int](($th - $logoH) / 2) - [int]($th * 0.04)
        $gfx.DrawImage($srcImg, $logoX, $logoY, $logoW, $logoH)

        # Version text at bottom
        $fontSize = [float][Math]::Max(10, [int]($tw * 0.038))
        $font = New-Object System.Drawing.Font ("Segoe UI", $fontSize, [System.Drawing.FontStyle]::Bold)
        $textBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(210, 203, 213, 225))
        $sf = New-Object System.Drawing.StringFormat
        $sf.Alignment = [System.Drawing.StringAlignment]::Center
        $sf.LineAlignment = [System.Drawing.StringAlignment]::Center

        $rectY = [float]($th - [int]($th * 0.08))
        $rectH = [float][int]($th * 0.05)
        $textRect = New-Object System.Drawing.RectangleF ([float]0, $rectY, [float]$tw, $rectH)
        $gfx.DrawString("Version 1.0.0", $font, $textBrush, $textRect, $sf)

        $font.Dispose()
        $textBrush.Dispose()
        $sf.Dispose()
    }

    $gfx.Dispose()

    if (Test-Path $outFile) { Remove-Item $outFile -Force }
    $bmp.Save($outFile, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Splash generated: $outFile ($tw x $th)"
}

$srcImg.Dispose()
Write-Host "ALL ICONS AND SPLASH SCREENS SUCCESSFULLY UPDATED WITH NEW LOGO!"
