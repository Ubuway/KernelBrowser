#!/data/data/com.termux/files/usr/bin/bash
echo "🚀 Kernel Browser Build System"
echo "=============================="

case $1 in
    "setup")
        echo "Настройка GitHub..."
        git remote -v
        git branch
        echo "✅ Готово"
        ;;
        
    "commit")
        echo "Коммит изменений..."
        git add .
        git commit -m "$2"
        echo "✅ Изменения сохранены"
        ;;
        
    "push")
        echo "Отправка на GitHub..."
        git push origin android-build
        echo "✅ Код отправлен. Проверяйте GitHub Actions"
        echo "📱 Ссылка: https://github.com/Ubuway/KernelBrowser/actions"
        ;;
        
    "build")
        echo "Запуск сборки через GitHub..."
        # Можно добавить вызов GitHub API для запуска workflow
        echo "📱 Откройте: https://github.com/Ubuway/KernelBrowser/actions/workflows/android.yml"
        ;;
        
    "status")
        echo "Статус сборок:"
        curl -s "https://api.github.com/repos/Ubuway/KernelBrowser/actions/runs" | \
        grep -E "(status|conclusion|html_url)" | head -6
        ;;
        
    *)
        echo "Использование:"
        echo "  ./build.sh setup          - Настройка"
        echo "  ./build.sh commit 'msg'   - Сохранить изменения"
        echo "  ./build.sh push           - Отправить на GitHub"
        echo "  ./build.sh build          - Запустить сборку"
        echo "  ./build.sh status         - Проверить статус"
        ;;
esac
