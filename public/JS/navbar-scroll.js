$(document).ready(function() {
  $(window).scroll(function() {
    if ($(document).scrollTop() > 50) {
      $(".navbar").css({
        "background-color": "#f8f8f8",
        "box-shadow": "0px 7px 18px #666666",
        "transition": "background-color 250ms linear",
        "padding": "0.5rem 5.5rem 0.3rem"
      });
      $(".navbar-brand").css("color", "#222353");
      $(".nav-link").css("color", "#222353");
      $(".btn-signup").css({
        "background-color": "#222353",
        "color": "#fff"
      });
      $(".btn-login").css({
        "border": "1px solid #222353",
        "color": "#000000"
      });
    } else {
      $(".navbar").css({
        "background-color": "transparent",
        "box-shadow": "none",
        "padding": "1rem 5.5rem 0.5rem"
      });
      $(".navbar-brand").css("color", "#fff");
      $(".nav-link").css("color", "#fff");
      $(".btn-signup").css({
        "background-color": "#fff",
        "color": "#000000"
      });
      $(".btn-login").css({
        "border": "1px solid #fff",
        "color": "#fff"
      });
    }
  });
});
