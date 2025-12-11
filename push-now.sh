#!/data/data/com.termux/files/usr/bin/bash
cd ~/KernelBrowser

source .token

echo "🚀 ЗАПУСК СБОРКИ KERNEL BROWSER"
echo "================================"

# Добавляем все изменения
echo "📁 Добавляем файлы..."
git add .

# Коммит
echo "💾 Создаем коммит..."
git commit -m "Android build $(date '+%Y-%m-%d %H:%M')" || echo "Нет изменений"

# Push с новым токеном
echo "📤 Отправляем на GitHub..."
git push https://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@github.com/Ubuway/KernelBrowser.git android-build

echo ""
echo "✅ КОД ОТПРАВЛЕН!"
echo ""
echo "📱 Следующие шаги:"
echo "1. Откройте: https://github.com/Ubuway/KernelBrowser/actions"
echo "2. Дождитесь сборки (5-10 минут)"
echo "3. Скачайте APK из Artifacts"
echo ""
echo "🔗 Или откройте сразу:"
echo "termux-open-url https://github.com/Ubuway/KernelBrowser/actions"
