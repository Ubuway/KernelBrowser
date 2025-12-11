#!/data/data/com.termux/files/usr/bin/bash
cd ~/KernelBrowser

echo "╔═══════════════════════════════════════╗"
echo "║    🚀 KERNEL BROWSER ANDROID BUILD    ║"
echo "╚═══════════════════════════════════════╝"

# БЕЗ ХАРДКОДА ТОКЕНОВ!
# Токен должен быть в .env файле
if [ -f .env ]; then
    source .env
    echo "✅ .env загружен"
else
    echo "⚠️  Файл .env не найден"
    echo "Создайте .env с переменной TOKEN='ваш_токен'"
    exit 1
fi

case $1 in
    "clean")
        echo "🧹 Очистка..."
        # Удаляем только временные файлы
        rm -f *.apk *.log build.log
        git clean -fd -e .env -e .gitignore
        echo "✅ Очистка завершена"
        ;;
        
    "commit")
        echo "💾 Коммит изменений..."
        # Проверяем нет ли токенов
        if grep -r "ghp_[A-Za-z0-9]" . --include="*.js" --include="*.json" --include="*.sh"; then
            echo "❌ ОБНАРУЖЕНЫ ТОКЕНЫ! Удалите перед коммитом"
            exit 1
        fi
        git add .
        git commit -m "${2:-Android build}"
        echo "✅ Коммит создан"
        ;;
        
    "push")
        echo "📤 Push на GitHub..."
        # Используем токен из .env
        if [ -z "$TOKEN" ]; then
            echo "❌ TOKEN не установлен в .env"
            exit 1
        fi
        git push https://$TOKEN@github.com/Ubuway/KernelBrowser.git android-build
        echo "✅ Push выполнен"
        ;;
        
    *)
        echo "📖 Использование:"
        echo "  ./build-android.sh clean          - Очистить"
        echo "  ./build-android.sh commit 'msg'   - Создать коммит"
        echo "  ./build-android.sh push           - Push на GitHub"
        ;;
esac
