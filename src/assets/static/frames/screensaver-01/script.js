var i = 0;
function setup() {
    createCanvas(windowWidth, windowHeight);
    background(0);
		colorMode(HSB, 255);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    background(0);
}

function draw() {
    noFill();
		var amplitud = height * (sin(i) * 0.1);
		strokeWeight(abs(sin(i))*0.5);
    var space = abs((sin(i)) * 0.001 ) * 100 + 150;
		beginShape();
		curveVertex(-space, 0);
		for (var x = 0; x < width; x += space) {
				var y = height * ((sin(i)*0.01)+0.5);
				y += sin(i - x * 0.01 + noise(i * 0.1) * -50) * amplitud;
				y += sin(i + x * 0.02) * amplitud;
				y += sin(i - x * 0.03 + noise(i * 0.1) * 50) * amplitud;
				curveVertex(x, y);
		}
		curveVertex(width, y);
		curveVertex(width + space, y);
		endShape();
		var rgb = ~~abs( sin(i) * 100) + 155;
		stroke(color(rgb, rgb, rgb, 100));
		i += 0.01;
}