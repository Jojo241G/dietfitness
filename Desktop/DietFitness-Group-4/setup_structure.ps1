# ================================================================
# DIETFITNESS - Script de restructuration automatique
# Executer depuis : Desktop\DietFitness-Group-4
# Commande : powershell -ExecutionPolicy Bypass -File setup_structure.ps1
# ================================================================

Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  DIETFITNESS - Setup Structure" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# ETAPE 1 - Creer le dossier frontend/ et y deplacer le projet Expo
Write-Host "[1/6] Creation du dossier frontend/ ..." -ForegroundColor Yellow

if (-Not (Test-Path "frontend")) {
    New-Item -ItemType Directory -Path "frontend" | Out-Null
}

$expoItems = @("src", "assets", "App.js", "app.json", "index.js", "package.json", "package-lock.json", "node_modules", ".gitignore", "AGENTS", "CLAUDE", "LICENSE", ".claude")

foreach ($item in $expoItems) {
    if (Test-Path $item) {
        if (-Not (Test-Path "frontend\$item")) {
            Move-Item -Path $item -Destination "frontend\" -Force
            Write-Host "  OK Deplace : $item -> frontend/" -ForegroundColor Green
        } else {
            Write-Host "  -- Deja present : frontend\$item" -ForegroundColor Gray
        }
    }
}

# ETAPE 2 - Creer les sous-dossiers frontend/src/
Write-Host ""
Write-Host "[2/6] Creation des sous-dossiers frontend/src/ ..." -ForegroundColor Yellow

$frontendDirs = @(
    "frontend\src\context",
    "frontend\src\data",
    "frontend\src\screens\auth",
    "frontend\src\screens\home",
    "frontend\src\screens\nutrition",
    "frontend\src\screens\fitness",
    "frontend\src\screens\chat"
)

foreach ($dir in $frontendDirs) {
    if (-Not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "  OK Cree : $dir" -ForegroundColor Green
    } else {
        Write-Host "  -- Existe deja : $dir" -ForegroundColor Gray
    }
}

# ETAPE 3 - Creer les fichiers frontend vides
Write-Host ""
Write-Host "[3/6] Creation des fichiers frontend vides ..." -ForegroundColor Yellow

$frontendFiles = @(
    "frontend\src\context\AuthContext.js",
    "frontend\src\context\ProfileContext.js",
    "frontend\src\data\db.json",
    "frontend\src\screens\auth\LoginScreen.js",
    "frontend\src\screens\home\HomeScreen.js",
    "frontend\src\screens\nutrition\NutritionScreen.js",
    "frontend\src\screens\fitness\FitnessScreen.js",
    "frontend\src\screens\chat\ChatScreen.js"
)

foreach ($file in $frontendFiles) {
    if (-Not (Test-Path $file)) {
        New-Item -ItemType File -Path $file -Force | Out-Null
        Write-Host "  OK Cree : $file" -ForegroundColor Green
    } else {
        Write-Host "  -- Existe deja : $file" -ForegroundColor Gray
    }
}

# ETAPE 4 - Creer les sous-dossiers backend/
Write-Host ""
Write-Host "[4/6] Creation des sous-dossiers backend/ ..." -ForegroundColor Yellow

$backendDirs = @(
    "backend\src\main\java\com\dietfitness\controller",
    "backend\src\main\java\com\dietfitness\model",
    "backend\src\main\java\com\dietfitness\service",
    "backend\src\main\resources\data",
    "backend\src\test\java\com\dietfitness"
)

foreach ($dir in $backendDirs) {
    if (-Not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "  OK Cree : $dir" -ForegroundColor Green
    } else {
        Write-Host "  -- Existe deja : $dir" -ForegroundColor Gray
    }
}

# ETAPE 5 - Creer les fichiers backend vides
Write-Host ""
Write-Host "[5/6] Creation des fichiers backend vides ..." -ForegroundColor Yellow

$backendFiles = @(
    "backend\pom.xml",
    "backend\src\main\java\com\dietfitness\BackendApplication.java",
    "backend\src\main\java\com\dietfitness\CorsConfig.java",
    "backend\src\main\java\com\dietfitness\controller\AuthController.java",
    "backend\src\main\java\com\dietfitness\controller\ChatController.java",
    "backend\src\main\java\com\dietfitness\model\Profile.java",
    "backend\src\main\java\com\dietfitness\model\ChatRequest.java",
    "backend\src\main\java\com\dietfitness\model\ChatResponse.java",
    "backend\src\main\java\com\dietfitness\service\GeminiService.java",
    "backend\src\main\java\com\dietfitness\service\DataService.java",
    "backend\src\main\resources\application.properties",
    "backend\src\main\resources\data\db.json"
)

foreach ($file in $backendFiles) {
    if (-Not (Test-Path $file)) {
        New-Item -ItemType File -Path $file -Force | Out-Null
        Write-Host "  OK Cree : $file" -ForegroundColor Green
    } else {
        Write-Host "  -- Existe deja : $file" -ForegroundColor Gray
    }
}

# ETAPE 6 - Resume final
Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  STRUCTURE CREEE AVEC SUCCES !" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "DietFitness-Group-4/" -ForegroundColor White
Write-Host "  frontend/" -ForegroundColor Yellow
Write-Host "    App.js, package.json, src/" -ForegroundColor Gray
Write-Host "    src/context/  -> AuthContext.js, ProfileContext.js" -ForegroundColor Gray
Write-Host "    src/data/     -> db.json" -ForegroundColor Gray
Write-Host "    src/screens/  -> home, nutrition, fitness, chat, auth" -ForegroundColor Gray
Write-Host "  backend/" -ForegroundColor Yellow
Write-Host "    pom.xml" -ForegroundColor Gray
Write-Host "    src/main/java/com/dietfitness/" -ForegroundColor Gray
Write-Host "      controller/ -> AuthController, ChatController" -ForegroundColor Gray
Write-Host "      model/      -> Profile, ChatRequest, ChatResponse" -ForegroundColor Gray
Write-Host "      service/    -> GeminiService, DataService" -ForegroundColor Gray
Write-Host ""
Write-Host "Prochaine etape : Copiez les scripts du FRONTEND_GUIDE.md" -ForegroundColor Cyan
Write-Host ""
