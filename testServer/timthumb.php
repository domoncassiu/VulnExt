<?php
// timthumb.php

// 模拟 TimThumb 缩略图生成器
// 为了安全起见，设置只允许本地文件

// 设置允许的最大宽度和高度
define('MAX_WIDTH', 800);
define('MAX_HEIGHT', 800);

// 获取图像路径和尺寸参数
$image = isset($_GET['src']) ? $_GET['src'] : '';
$width = isset($_GET['w']) ? intval($_GET['w']) : MAX_WIDTH;
$height = isset($_GET['h']) ? intval($_GET['h']) : MAX_HEIGHT;

// 简单的安全检查，防止不安全的路径
if (strpos($image, '..') !== false || strpos($image, 'http') !== false) {
    die("Invalid image source.");
}

// 检查图像文件是否存在
if (!file_exists($image)) {
    die("Image not found.");
}

// 设置 header 信息，以便浏览器正确解析
header("Content-Type: image/jpeg");

// 加载图像
$source = imagecreatefromjpeg($image);

// 获取原始图像尺寸
$origWidth = imagesx($source);
$origHeight = imagesy($source);

// 计算缩放比例
$ratio = min($width / $origWidth, $height / $origHeight);
$newWidth = intval($origWidth * $ratio);
$newHeight = intval($origHeight * $ratio);

// 创建新的图像资源
$resizedImage = imagecreatetruecolor($newWidth, $newHeight);

// 复制并调整图像尺寸
imagecopyresampled($resizedImage, $source, 0, 0, 0, 0, $newWidth, $newHeight, $origWidth, $origHeight);

// 输出缩放后的图像
imagejpeg($resizedImage);

// 释放资源
imagedestroy($source);
imagedestroy($resizedImage);
?>
