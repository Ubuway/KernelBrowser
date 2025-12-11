#!/data/data/com.termux/files/usr/bin/bash
# 🚀 Kernel Browser Workflow with Token

TOKEN="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"
REPO="https://${TOKEN}@github.com/Ubuway/KernelBrowser.git"

echo "╔════════════════════════════════╗"
echo "║    KERNEL BROWSER WORKFLOW     ║"
echo "╚════════════════════════════════╝"

case $1 in
    "setup")
        echo "⚙️  Настройка проекта..."
        git checkout -b android-build
        mkdir -p .github/workflows
        echo "✅ Готово! Создана ветка android-build"
        ;;
        
    "add")
        echo "📁 Добавление файлов..."
        git add .
        echo "✅ Файлы добавлены в stage"
        ;;
        
    "commit")
        if [ -z "$2" ]; then
            MSG="Update from Termux $(date '+%Y-%m-%d %H:%M')"
        else
            MSG="$2"
        fi
        echo "💾 Коммит: $MSG"
        git commit -m "$MSG"
        echo "✅ Коммит создан"
        ;;
        
    "push")
        echo "🚀 Отправка на GitHub..."
        git push $REPO android-build
        echo ""
        echo "✅ УСПЕХ! Код отправлен!"
        echo ""
        echo "📱 Следующие шаги:"
        echo "1. Откройте: https://github.com/Ubuway/KernelBrowser/actions"
        echo "2. Дождитесь завершения сборки (5-10 мин)"
        echo "3. Скачайте APK из раздела Artifacts"
        ;;
        
    "full")
        echo "⚡ Полный цикл сборки..."
        ./work.sh add
        ./work.sh commit "$2"
        ./work.sh push
        ;;
        
    "status")
        echo "📊 Проверка статуса..."
        echo "Текущая ветка: $(git branch --show-current)"
        echo "Изменения:"
        git status --short
        ;;
        
    "apk")
        echo "📥 Проверка сборок..."
        echo "Открываю GitHub Actions..."
        termux-open-url "https://github.com/Ubuway/KernelBrowser/actions"
        ;;
        
    *)
        echo "📖 Использование:"
        echo "  ./work.sh setup          - Настройка проекта"
        echo "  ./work.sh add            - Добавить все файлы"
        echo "  ./work.sh commit 'msg'   - Создать коммит"
        echo "  ./work.sh push           - Отправить на GitHub"
        echo "  ./work.sh full 'msg'     - Весь цикл сразу"
        echo "  ./work.sh status         - Проверить статус"
        echo "  ./work.sh apk            - Проверить сборки"
        echo ""
        echo "🔑 Токен настроен: ${TOKEN:0:8}..."
        ;;
esac
