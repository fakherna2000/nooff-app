<#
.SYNOPSIS
سكربت توليد مفتاح توقيع APK رسمي لمركز نوف (Keystore .jks)
مطلوب قبل بناء نسخة Google Play Store رسمية.
مطلوب Java JDK مثبت (JRE وحده لا يكفي — تحتاج keytool.exe).

.DESCRIPTION
يولد ملف noof-release-key.jks (مفتاح RSA 2048 بت صالح 10000 يوم)
ثم ينشئ keystore.properties جاهز للاستخدام مباشرة.

.EXAMPLE
.\scripts\generate-keystore.ps1
#>

$ErrorActionPreference = 'Stop'

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  توليد مفتاح توقيع Play Store لمركز نوف" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 1. التحقق من وجود Java و keytool
$keytool = Get-Command keytool -ErrorAction SilentlyContinue
if (-not $keytool) {
    $candidates = @(
        "C:\Program Files\Java\jdk-17\bin\keytool.exe",
        "C:\Program Files\Java\jdk-21\bin\keytool.exe",
        "C:\Program Files (x86)\Java\jdk-17\bin\keytool.exe",
        "$env:USERPROFILE\scoop\apps\temurin17-jdk\current\bin\keytool.exe"
    )
    foreach ($c in $candidates) {
        if (Test-Path $c) { $keytoolPath = $c ; break }
    }
    if (-not $keytoolPath) {
        Write-Host "❌ لم يتم العثور على Java JDK (keytool.exe)." -ForegroundColor Red
        Write-Host "   حمّل JDK 17 من: https://adoptium.net/temurin/releases/?version=17" -ForegroundColor Yellow
        Write-Host "   أو: winget install EclipseAdoptium.Temurin.17.JDK" -ForegroundColor Yellow
        exit 1
    }
} else {
    $keytoolPath = $keytool.Source
}
Write-Host "✅ تم العثور على keytool في: $keytoolPath" -ForegroundColor Green

# 2. المجلدات والملفات
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$AndroidDir = Join-Path $ProjectRoot "android"
$AppDir = Join-Path $AndroidDir "app"
$KeystoreFile = Join-Path $AppDir "noof-release-key.jks"
$PropsFile = Join-Path $AndroidDir "keystore.properties"

# 3. قيم افتراضية (يمكن تعديلها لاحقاً)
$StorePass = "NoofDentalClinic2026!"
$KeyPass   = "NoofDentalClinic2026!"
$Alias     = "noofapp"
$DName     = "CN=Noof Dental Clinic, OU=IT Department, O=Noof Center, L=Damascus, S=Damascus, C=SY"

if (Test-Path $KeystoreFile) {
    Write-Host ""
    $choice = Read-Host "⚠  الملف موجود مسبقاً: noof-release-key.jks. هل تريد توليد جديد؟ (y/N)"
    if ($choice -notmatch '^[Yy]$') {
        Write-Host "ألغيت العملية. الملف الحالي محفوظ." -ForegroundColor Yellow
        exit 0
    }
    Remove-Item $KeystoreFile -Force
}

# 4. توليد Keystore
Write-Host ""
Write-Host "🔐 جاري توليد المفتاح (RSA 2048-bit, صالح 27 سنة)..." -ForegroundColor Cyan
& $keytoolPath -genkeypair -v `
    -keystore $KeystoreFile `
    -alias $Alias `
    -keyalg RSA `
    -keysize 2048 `
    -validity 10000 `
    -storepass $StorePass `
    -keypass $KeyPass `
    -dname $DName `
    -storetype PKCS12 2>&1 | Out-Null

if (-not (Test-Path $KeystoreFile)) {
    Write-Host "❌ فشل توليد المفتاح!" -ForegroundColor Red
    exit 1
}

$sizeKB = [math]::Round((Get-Item $KeystoreFile).Length / 1KB, 1)
Write-Host "✅ تم توليد Keystore بنجاح: $KeystoreFile ($sizeKB KB)" -ForegroundColor Green

# 5. توليد keystore.properties
@"
STORE_FILE=app/noof-release-key.jks
STORE_PASSWORD=$StorePass
KEY_ALIAS=$Alias
KEY_PASSWORD=$KeyPass
"@ | Set-Content -Path $PropsFile -Encoding UTF8
Write-Host "✅ تم إنشاء $PropsFile" -ForegroundColor Green

# 6. التحقق من صحة المفتاح
Write-Host ""
Write-Host "🔍 جاري التحقق من صحة المفتاح..." -ForegroundColor Cyan
$verify = & $keytoolPath -list -v -keystore $KeystoreFile -storepass $StorePass -alias $Alias 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ صحة المفتاح مؤكدة ✔" -ForegroundColor Green
} else {
    Write-Host "⚠  لم يتم التحقق من المفتاح (يمكن تجاهله إذا كان كل شي آخر يعمل)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  ✅ اكتمل التوليد بنجاح!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📍 الملفات المهمة:" -ForegroundColor Cyan
Write-Host "   🔑 $KeystoreFile" -ForegroundColor White
Write-Host "   ⚙  $PropsFile" -ForegroundColor White
Write-Host ""
Write-Host "⚠   تنبيه أمني هام جداً:" -ForegroundColor Red
Write-Host "   • لا تشارك noof-release-key.jks مع أي أحد."
Write-Host "   • لا ترفعه على GitHub أو أي مكان عام."
Write-Host "   • خد منه نسخة احتياطية آمنة (USB مشفر / سحابي آمن)."
Write-Host "   • في حال ضياع المفتاح لا يمكن نشر تحديثات للتطبيق أبداً!"
Write-Host ""
Write-Host "📱 بعد التوليد، شغّل لبناء نسخة Play Store:" -ForegroundColor Cyan
Write-Host "   npm run android:release:aab"
Write-Host ""

exit 0
