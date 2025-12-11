#!/data/data/com.termux/files/usr/bin/bash
cd ~/KernelBrowser

echo "╔═══════════════════════════════════════╗"
echo "║    🚀 KERNEL BROWSER ANDROID BUILD    ║"
echo "╚═══════════════════════════════════════╝"

# Загружаем токен
if [ -f .env ]; then
    source .env
else
    echo "❌ Токен не найден! Создайте .env файл"
    exit 1
fi

GIT_URL="https://${TOKEN}@github.com/Ubuway/KernelBrowser.git"

case $1 in
    "setup")
        echo "⚙️  Настройка проекта..."
        git checkout -b android-build 2>/dev/null || git checkout android-build
        mkdir -p .github/workflows
        echo "✅ Проект настроен"
        ;;
        
    "save")
        echo "📁 Сохраняем изменения..."
        git add -A
        git commit -m "${2:-Android build $(date '+%Y-%m-%d %H:%M:%S')}" || echo "ℹ️  Нет изменений"
        echo "✅ Изменения сохранены"
        ;;
        
    "push")
        echo "📤 Отправляем на GitHub..."
        git push $GIT_URL android-build --force
        echo ""
        echo "✅ КОД ОТПРАВЛЕН НА GITHUB!"
        echo ""
        echo "📱 Открываем GitHub Actions..."
        sleep 2
        termux-open-url "https://github.com/Ubuway/KernelBrowser/actions"
        ;;
        
    "all")
        echo "⚡ ПОЛНЫЙ ЦИКЛ СБОРКИ..."
        ./build-android.sh save "$2"
        ./build-android.sh push
        ;;
        
    "status")
        echo "📊 Статус проекта:"
        echo "Ветка: $(git branch --show-current)"
        echo "Изменения:"
        git status --short
        echo ""
        echo "📁 Файлы workflow:"
        ls -la .github/workflows/ 2>/dev/null || echo "Папка .github/workflows/ не существует"
        ;;
        
    *)
        echo "📖 ИСПОЛЬЗОВАНИЕ:"
        echo "  ./build-android.sh setup         - Настройка"
        echo "  ./build-android.sh save 'msg'    - Сохранить изменения"
        echo "  ./build-android.sh push          - Отправить на GitHub"
        echo "  ./build-android.sh all 'msg'     - Полный цикл"
        echo "  ./build-android.sh status        - Показать статус"
        echo ""
        echo "🔑 Токен: ${TOKEN:0:8}..."
        ;;
esac
