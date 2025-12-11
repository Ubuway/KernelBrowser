const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🎨 Генерация иконок...');

const iconsDir = path.join(__dirname, 'assets/icons');

// Проверяем наличие основной иконки
if (!fs.existsSync(path.join(iconsDir, 'icon.png'))) {
  console.error('❌ icon.png не найден! Скачайте его сначала.');
  console.log('📱 Используйте: curl -L "https://i.ibb.co/fjkckDW/icon.png" -o assets/icons/icon.png');
  process.exit(1);
}

// Создаем .ico файл для Windows
try {
  // Установите ImageMagick если нет
  // pkg install imagemagick
  execSync(`convert ${path.join(iconsDir, 'icon.png')} -resize 256x256 ${path.join(iconsDir, 'icon.ico')}`);
  console.log('✅ icon.ico создан для Windows');
} catch (error) {
  console.log('⚠️ ImageMagick не установлен. Создайте .ico онлайн:');
  console.log('1. Зайдите на https://icoconvert.com/');
  console.log('2. Загрузите icon.png');
  console.log('3. Скачайте icon.ico');
  console.log('4. Положите в assets/icons/');
}

// Создаем .icns для Mac (если на Mac)
if (process.platform === 'darwin') {
  try {
    execSync(`iconutil -c icns -o ${path.join(iconsDir, 'icon.icns')} ${path.join(iconsDir, 'icon.iconset')}`);
    console.log('✅ icon.icns создан для Mac');
  } catch (error) {
    console.log('⚠️ .icns можно пропустить если не собираете для Mac');
  }
}

// Создаем копии разных размеров
const sizes = [16, 32, 64, 128, 256, 512];
sizes.forEach(size => {
  try {
    execSync(`convert ${path.join(iconsDir, 'icon.png')} -resize ${size}x${size} ${path.join(iconsDir, `icon-${size}.png`)}`);
    console.log(`✅ icon-${size}.png создан`);
  } catch (e) {
    // Пропускаем если нет ImageMagick
  }
});

console.log('🎉 Готово! Проверьте папку assets/icons/');
