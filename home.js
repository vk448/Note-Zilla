 function showAlert() {
    document.getElementById("overlay").style.display = "flex";
  }
  function closeAlert() {
    document.getElementById("overlay").style.display = "none";
  }
  // ✅ Page load होते ही popup show
  window.onload = showAlert;
</script>
 <script>
    // Disable right-click menu
    document.addEventListener("contextmenu", function(e) {
      e.preventDefault();
      alert("Right-click is disabled on this page!");
    });