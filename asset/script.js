(function () {
  var canvas = $("#canvas");

  if (!canvas[0].getContext) {
    $("#error").show();
    return false;
  }

  var width = canvas.width();
  var height = canvas.height();
  canvas.attr("width", width);
  canvas.attr("height", height);
  var opts = {
    seed: {
      x: width / 2 - 20,
      color: "rgb(190, 26, 37)",
      scale: 2,
    },
    branch: [
      [ 535, 680, 570, 250, 500, 200, 30, 100,
        [
          [ 540,500,455,417,340, 400, 13, 100,
            [[450, 435, 434, 430, 394, 395, 2, 40]],
          ],
          [ 550, 445, 600, 356, 680, 345, 12, 100,
            [[578, 400, 648, 409, 661, 426, 3, 80]],
          ],
          [539, 281, 537, 248, 534, 217, 3, 40],
          [ 546, 397, 413, 247, 328, 244, 9, 80,
            [
              [427, 286, 383, 253, 371, 205, 2, 40],
              [498, 345, 435, 315, 395, 330, 4, 60],
            ],
          ],
          [ 546, 357, 608, 252, 678, 221, 6, 100,
            [[590, 293, 646, 277, 648, 271, 2, 80]],
          ],
        ],
      ],
    ],
    bloom: {
      num: 700,
      width: 1080,
      height: 650,
    },
    footer: {
      width: 1200,
      height: 5,
      speed: 10,
    },
  };

  var tree = new Tree(canvas[0], width, height, opts);
  var seed = tree.seed;
  var foot = tree.footer;
  var hold = 1;
  // Target countdown date: local 00:00 on 21 October 2025
  var together = new Date(2025, 9, 21, 0, 0, 0, 0); // months are 0-based: 9 = October

  canvas
    .click(function (e) {
      var offset = canvas.offset(),
        x,
        y;
      x = e.pageX - offset.left;
      y = e.pageY - offset.top;
      if (seed.hover(x, y)) {
        hold = 0;
        canvas.unbind("click");
        canvas.unbind("mousemove");
        canvas.removeClass("hand");
      }
    })
    ;

  // Throttle mousemove handling to avoid expensive work on every mouse pixel change
  var lastMoveTime = 0;
  canvas.on('mousemove', function (e) {
    var now = Date.now();
    // limit updates to ~12fps (every 80ms) - adjust if you want more responsiveness
    if (now - lastMoveTime < 80) return;
    lastMoveTime = now;
    var offset = canvas.offset(), x, y;
    x = e.pageX - offset.left;
    y = e.pageY - offset.top;
    // Use the cheaper bounding-box hover implemented in love.js
    var isHover = seed.hover(x, y);
    // Use requestAnimationFrame to batch DOM class toggle
    window.requestAnimationFrame(function() {
      canvas.toggleClass("hand", isHover);
    });
  });

  var seedAnimate = eval(
    Jscex.compile("async", function () {
      seed.draw();
      while (hold) {
        $await(Jscex.Async.sleep(30));
      }
      while (seed.canScale()) {
        seed.scale(0.95);
        $await(Jscex.Async.sleep(30));
      }
      while (seed.canMove()) {
        seed.move(0, 2);
        foot.draw();
        $await(Jscex.Async.sleep(30));
      }
    })
  );

  var growAnimate = eval(
    Jscex.compile("async", function () {
      do {
  tree.grow();
  $await(Jscex.Async.sleep(30));
      } while (tree.canGrow());
    })
  );

  var flowAnimate = eval(
    Jscex.compile("async", function () {
      do {
  tree.flower(2);
  $await(Jscex.Async.sleep(40));
      } while (tree.canFlower());
    })
  );

  var moveAnimate = eval(
    Jscex.compile("async", function () {
      tree.snapshot("p1", 240, 0, 610, 680);
      while (tree.move("p1", 500, 0)) {
        foot.draw();
        $await(Jscex.Async.sleep(40));
      }
      foot.draw();
      tree.snapshot("p2", 500, 0, 610, 680);

      canvas
        .parent()
        .css("background", "url(" + tree.toDataURL("image/png") + ")");
      canvas.css("background", "#ffe");
      $await(Jscex.Async.sleep(300));
      canvas.css("background", "none");
    })
  );

  var jumpAnimate = eval(
    Jscex.compile("async", function () {
      var ctx = tree.ctx;
      while (true) {
  tree.ctx.clearRect(0, 0, width, height);
  tree.jump();
  foot.draw();
  $await(Jscex.Async.sleep(40));
      }
    })
  );

  var textAnimate = eval(
    Jscex.compile("async", function () {
      // var together = new Date();
      // together.setFullYear(2024,10 , 18);
      // together.setHours(0);
      // together.setMinutes(0);
      // together.setSeconds(0);
      // together.setMilliseconds(0);

      $("#code").show().typewriter();
      $("#clock-box").fadeIn(500);
      while (true) {
        timeElapse(together);
        $await(Jscex.Async.sleep(1000));
      }
    })
  );

  // Create a function that starts the visual/audio sequence when called
  function startApp() {
    var runAsync = eval(
      Jscex.compile("async", function () {
        $await(seedAnimate());
        $await(growAnimate());
        $await(flowAnimate());
        $await(moveAnimate());

        textAnimate().start();

        $await(jumpAnimate());
      })
    );

    runAsync().start();

    // ensure audio plays on user gesture (some browsers require it)
    var audio = document.getElementById("myAudio");
    try {
      audio.play();
    } catch (e) {
      // will play after another user gesture
    }
  }

  // expose startApp to global so index.html can call it after name provided
  window.Treelove = window.Treelove || {};
  window.Treelove.startApp = startApp;
  // per-character heart helper removed
  // lightweight per-character heart spawn: place an absolutely-positioned heart over the page at the char's location
  window.Treelove.spawnCharHeart = function(charElem) {
    try {
      var rect = charElem.getBoundingClientRect();
      var cx = rect.left + rect.width/2 + window.scrollX;
      var cy = rect.top + window.scrollY - 6;
      // random pastel color palette
      var colors = ['#ff9dbb','#ffd3e0','#ffc1e3','#ffd8b5','#fcd5e5','#ffb3c6','#ffe6f0'];
      var color = colors[Math.floor(Math.random()*colors.length)];
      var size = 8 + Math.floor(Math.random()*12); // 8..20px
      var rot = -18 + Math.floor(Math.random()*36);
      var dur = 900 + Math.floor(Math.random()*800);

      var $h = $(
        '<div class="char-float" style="left:'+cx+'px; top:'+cy+'px; width:'+size+'px; height:'+size+'px; animation-duration:'+dur+'ms; transform: translate(-50%,0) rotate('+rot+'deg);">'
        + '<svg viewBox="0 0 32 29.6" xmlns="http://www.w3.org/2000/svg"><path d="M23.6 0c-2.9 0-5.4 1.8-6.6 4.3C15.8 1.8 13.3 0 10.4 0 4.7 0 0 4.7 0 10.4 0 18.5 10.8 23.9 16 29.6c5.2-5.7 16-11.1 16-19.2C32 4.7 27.3 0 21.6 0z"/></svg>'
        + '</div>'
      );
      $h.find('svg').css('fill', color);
      $h.appendTo('body');

      // small chance to spawn a sparkle near the heart
      if (Math.random() < 0.35) {
        var $s = $("<div class='char-sparkle' style='left:"+(cx + (Math.random()*18-9))+"px; top:"+(cy - (6 + Math.random()*10))+"px;'></div>");
        $s.appendTo('body');
        setTimeout(function(){ $s.remove(); }, 700 + Math.floor(Math.random()*500));
      }

      setTimeout(function(){ $h.remove(); }, dur + 120);
    } catch(e) {}
  };
})();

// --- Wiring for start overlay and username replacement ---
$(function() {
  var $input = $("#username-input");
  var $button = $("#start-button");
  var $overlay = $("#start-overlay");
  var $card = $(".start-card");

  function updateButtonState() {
    var val = $input.val();
    if (val && val.trim().length > 0) {
      $button.prop('disabled', false);
      $button.css('cursor', 'pointer');
    } else {
      $button.prop('disabled', true);
      $button.css('cursor', 'not-allowed');
    }
  }

  // prefill from localStorage when available
  try {
    var saved = localStorage.getItem('treelove_username');
    if (saved) $input.val(saved);
  } catch (e) {
    // ignore storage errors
  }

  // enable/disable based on input
  $input.on('input', updateButtonState);
  // allow Enter key to start when enabled
  $input.on('keydown', function(e) {
    if (e.key === 'Enter' || e.keyCode === 13) {
      if (!$button.prop('disabled')) {
        $button.trigger('click');
      }
      e.preventDefault();
    }
  });

  updateButtonState();

  $button.on('click', function() {
    var name = $input.val() || '';
    name = name.trim();
    if (!name) return;

    // persist name for next visit
    try { localStorage.setItem('treelove_username', name); } catch (e) {}

    // replace {username} occurrences in #code
    var html = $("#code").html();
    html = html.replace(/\{username\}/g, $('<div>').text(name).html());
    $("#code").html(html);

    // hide overlay
  // small burst effect
  createBurst($button[0]);

  $overlay.fadeOut(300, function() { $overlay.remove(); stopHearts(); });

    // call start
    if (window.Treelove && typeof window.Treelove.startApp === 'function') {
      window.Treelove.startApp();
    }
  });

  // Floating hearts while overlay visible
  var heartsTimer = null;
  function startHearts() {
    if (heartsTimer) return;
    heartsTimer = setInterval(function() {
      spawnHeart();
    }, 380);
  }
  function stopHearts() {
    if (heartsTimer) { clearInterval(heartsTimer); heartsTimer = null; }
  }

  function spawnHeart() {
    if (!$card.length) return;
    var rect = $card[0].getBoundingClientRect();
    var x = Math.random() * rect.width;
    var y = rect.height - Math.random() * 20;
    var $h = $(
      '<div class="floating-heart" style="left:'+x+'px;top:'+y+'px;">'
      + '<svg viewBox="0 0 32 29.6" xmlns="http://www.w3.org/2000/svg"><path d="M23.6 0c-2.9 0-5.4 1.8-6.6 4.3C15.8 1.8 13.3 0 10.4 0 4.7 0 0 4.7 0 10.4 0 18.5 10.8 23.9 16 29.6c5.2-5.7 16-11.1 16-19.2C32 4.7 27.3 0 21.6 0z"/></svg>'
      + '</div>'
    );
    $card.append($h);
    // remove after animation
    setTimeout(function() { $h.remove(); }, 3200);
  }

  // tiny burst on click
  function createBurst(el) {
    var rect = el.getBoundingClientRect();
    for (var i=0;i<8;i++) {
      (function(i){
        var $d = $('<div class="burst-dot"></div>');
        var left = rect.left + rect.width/2 + (Math.random()*40-20);
        var top = rect.top + rect.height/2 + (Math.random()*12-6);
        $d.css({left:left+'px', top:top+'px'}).appendTo('body');
        setTimeout(function(){ $d.remove(); }, 520);
      })(i);
    }
  }

  // start hearts while overlay visible
  startHearts();
});