'use strict';

$(document).ready(
    function() {
        function removeClass() {
          return h3s.forEach(function(t) {
            if (t.classList.contains("active")) {
              /** @type {!Element} */
              g = t;
            }
          }), g;
        }
      
        function apply() {
          return liSteps.forEach(function(a) {
            if (a.classList.contains("active")) {
              /** @type {!Element} */
              ret = a;
            }
          }), ret;
        }
      
        function setLogoType() {
          ret.classList.remove("active");
          g.classList.remove("active");
        }
      
        function add(id) {
          liSteps.forEach(function(alert) {
            if (alert.id === id) {
              alert.classList.add("active");
            }
          });
        }
      
        function reset() {
          g = removeClass();
          ret = apply();
          if (this.name !== g.name) {
            this.classList.add("active");
            setLogoType();
            add(this.name);
          }
        }
        var g;
        var ret;
      
        var h3s = document.querySelectorAll(".tabs .button-list button ");
        var liSteps = document.querySelectorAll(".tabs section");
      
        h3s[0].classList.add("active");
        liSteps[0].classList.add("active");
        h3s.forEach(function(button) {
          button.onclick = reset;
        });
}); 