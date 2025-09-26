<?php
echo "Waiting 5 seconds before renaming...<br>";
flush();
sleep(5); // wait 5 seconds

if(rename("index1.html", "index.html")){
    echo "✅ File renamed from index1.html to index.html";
} else {
    echo "❌ Error renaming file!";
}
?>
