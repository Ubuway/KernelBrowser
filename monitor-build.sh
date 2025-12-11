#!/bin/bash
echo "👀 МОНИТОРИНГ СБОРКИ APK"
echo "========================"

echo "1. Ожидаем запуска workflow..."
sleep 30

echo "2. Открываем GitHub Actions..."
termux-open-url "https://github.com/Ubuway/KernelBrowser/actions"

echo ""
echo "3. Как скачать APK после сборки:"
echo "   📱 Откройте: https://github.com/Ubuway/KernelBrowser/actions"
echo "   📦 Найдите последний успешный run"
echo "   ⬇️  Внизу страницы нажмите 'kernel-browser-android'"
echo "   📥 Скачайте APK файл"
echo ""
echo "4. Установка на Android:"
echo "   • Разрешите 'Установку из неизвестных источников'"
echo "   • Установите APK"
echo "   • Запустите Kernel Browser"
