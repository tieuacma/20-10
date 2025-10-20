
var $win = $(window);
var clientWidth = $win.width();
var clientHeight = $win.height();

$(window).resize(function() {
    var newWidth = $win.width();
    var newHeight = $win.height();
    if (newWidth != clientWidth && newHeight != clientHeight) {
        location.replace(location);
    }
});

(function($) {
	$.fn.typewriter = function() {
		this.each(function() {
			var $ele = $(this), str = $ele.html(), progress = 0;
			$ele.html('');
			// Add a class to parent to make .say larger while typing
			var $parent = $ele.parent();
			$parent.addClass('say-large');
			// Use incremental DOM updates to avoid replacing full innerHTML every tick
			$ele.empty();
			var container = document.createElement('span');
			$ele[0].appendChild(container);
			var caret = document.createElement('span');
			caret.className = 'typewriter-caret';
			caret.textContent = '_';
			$ele[0].appendChild(caret);

			function step() {
				if (progress < str.length) {
					// If next char is an HTML tag, insert it as HTML so markup is preserved
					if (str.charAt(progress) === '<') {
						var end = str.indexOf('>', progress);
						if (end > -1) {
							var tag = str.substring(progress, end + 1);
							container.insertAdjacentHTML('beforeend', tag);
							progress = end + 1;
						} else {
							// malformed tag, just append and advance
							container.appendChild(document.createTextNode(str.charAt(progress)));
							progress++;
						}
					} else {
						// If next char is whitespace, append as a text node to preserve spacing
						var chVal = str.charAt(progress);
						if (/\s/.test(chVal)) {
							container.appendChild(document.createTextNode(chVal));
							progress++;
						} else {
							// collect a run of non-whitespace characters (a word) to avoid mid-word wrapping
							var start = progress;
							var end = progress;
							while (end < str.length && !/\s/.test(str.charAt(end)) && str.charAt(end) !== '<') {
								end++;
							}
							var word = str.substring(start, end);
							// create a span for the whole word so the browser won't break inside it
							var wordSpan = document.createElement('span');
							wordSpan.className = 'typed-word';
							// for each char in the word, create a typed-char span for animation
							for (var i = 0; i < word.length; i++) {
								(function(chc){
									var ch = document.createElement('span');
									ch.className = 'typed-char appearing';
									ch.appendChild(document.createTextNode(chc));
									wordSpan.appendChild(ch);
									// trigger CSS transition shortly after insertion (staggered a bit)
									setTimeout(function(){ try { ch.classList.add('show'); } catch(e){} }, 12 + Math.floor(Math.random()*80) + i*8);
									// sparse hearts
									try {
										// more hearts: higher probability and occasionally spawn multiple for a burst
										if (window.Treelove && typeof window.Treelove.spawnCharHeart === 'function') {
											var p = Math.random();
											if (p < 0.6) {
												// usually spawn one
												(function(el){ setTimeout(function(){ try { window.Treelove.spawnCharHeart(el); } catch(e){} }, 90 + Math.floor(Math.random()*120)); })(ch);
												// small chance to spawn an extra tiny burst of 1-2 more hearts
												if (Math.random() < 0.22) {
													(function(el){ setTimeout(function(){ try { window.Treelove.spawnCharHeart(el); } catch(e){} }, 140 + Math.floor(Math.random()*160)); })(ch);
													if (Math.random() < 0.45) {
														(function(el){ setTimeout(function(){ try { window.Treelove.spawnCharHeart(el); } catch(e){} }, 180 + Math.floor(Math.random()*140)); })(ch);
													}
												}
											}
										}
									} catch(e) {}
								})(word.charAt(i));
							}
							container.appendChild(wordSpan);
							progress = end;
						}
					}

					// caret blink (simple)
					caret.style.visibility = (progress & 1) ? 'visible' : 'hidden';
					// schedule next char; setTimeout keeps it off the main tight loop
					setTimeout(step, 50);
				} else {
					// finished
					if (caret && caret.parentNode) caret.parentNode.removeChild(caret);
					// remove the enlarged class when done
					$parent.removeClass('say-large');
				}
			}

			step();
		});
		return this;
	};
})(jQuery);

function timeElapse(date){
	// Countdown: show remaining time until `date` (Date object or parseable string)
	var now = Date.now();
	var target = (date instanceof Date) ? date.getTime() : Date.parse(date);
	var diff = Math.floor((target - now) / 1000);

	if (diff <= 0) {
		// target reached or passed
		var done = `đếm ngược 
					<span class="digit">00</span> giờ 
					<span class="digit">00</span> phút 
					<span class="digit">00</span> giây`;
		$("#clock").html(done);
		return;
	}

	var days = Math.floor(diff / (3600 * 24));
	diff = diff % (3600 * 24);
	var hours = Math.floor(diff / 3600);
	diff = diff % 3600;
	var minutes = Math.floor(diff / 60);
	var seconds = diff % 60;

	if (hours < 10) hours = "0" + hours;
	if (minutes < 10) minutes = "0" + minutes;
	if (seconds < 10) seconds = "0" + seconds;

	var result = `đếm ngược  
				  <span class="digit">${hours}</span> giờ 
				  <span class="digit">${minutes}</span> phút 
				  <span class="digit">${seconds}</span> giây`;
	$("#clock").html(result);
}
