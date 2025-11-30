<?php
$tooBigs = [
  "onii-chan, y-your file is t-too big...",
  "n-nooo senpai~ it'll never fit...",
  "t-that's too much for me to handle..."
];

if ($_FILES["file"]["error"] !== 0) {
  die("upload error~");
}

$size = $_FILES["file"]["size"] / 1024 / 1024; // MB
if ($size > 5000) { // 5 GB limit (change as you want)
  die($tooBigs[array_rand($tooBigs)]);
}

$ext = pathinfo($_FILES["file"]["name"], PATHINFO_EXTENSION);
$filename = substr(str_shuffle("abcdefghijklmnopqrstuvwxyz0123456789"), 0, 8) . ".$ext";
$target = "files/" . $filename;

if (!is_dir("files")) mkdir("files", 0755, true);

move_uploaded_file($_FILES["file"]["tmp_name"], $target);

echo "https://$_SERVER[HTTP_HOST]" . dirname($_SERVER[PHP_SELF]) . "/files/$filename";
?>