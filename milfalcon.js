load("sbbsdefs.js");
load("frame.js");
load("sprite.js");
load(js.exec_dir + "frame-transitions.js");

// GLOBAL FRAME VARIABLES
var player = new Object();
var bgFrame, bgFrame1, bgFrame2, bgFrame3, bgFrame4, fgFrame;
var msgFrame, msgMode = false;
var falconSprite, astSprite1, astSprite2, astSpriteBig, astSpriteMega;
var bgFrameArray = [], spriteFrameArray = [];
var canvasFrame;

// ANIMATION CODES
var delayHalfSec = ';';
var delayTwoSecs = '.';

// COLOR CODES
var lowWhite = 'NW0';
var highWhite = 'HW0';
var lowCyan = 'NC0';
var highCyan = 'HC0';
var highBlack = 'HK0';
var highYellowDarkBlue = 'HY4';
var highWhiteDarkCyan = 'HW6';



// Compare a canvas frame against data in another frame. Repaint characters that are different.
function repaintCanvas( newFrame, canvas ) {
	var newFrameData = newFrame.dump();
	for (var x=0; x<canvas.width; x++) {
		for (var y=0; y<canvas.height; y++) {
			var newChar = newFrameData[y][x];
			var oldChar = canvas.getData(x,y);
			// Compare corresponding characters on current canvas and the new frame.
			// If they are different, repaint the character on the canvas.
			if ( newChar && (newChar.attr !== oldChar.attr || newChar.ch !== oldChar.ch) ) {
				canvas.clearData(x,y);
				canvas.setData(x,y,newChar.ch,newChar.attr);
			}
			// If the new frame has a null instead of a character object,
			// treat that like an empty black space. Draw it on the canvas
			// if the corresponding character is not also an empty black space.
			else if ( newChar == null ) {
				if ( oldChar.ch != ascii(32) || oldChar.attr != BG_BLACK ) {
					canvas.clearData(x,y);
					canvas.setData(x,y,ascii(32),BG_BLACK);
				}
			}
		}
	}
}


function getJson( filename ) {
	var f = new File(js.exec_dir + '/paths/' + filename);
	f.open('r');
	var json = f.read();
	var obj = JSON.parse( json );
	f.close();
	if (obj) {
		return obj;
	}
	else {
		return false;
	}
}


function joshSprite( frame, path ) {
	if ( frame !== undefined ) {
		this.frame = frame;
	}
	if ( frame !== undefined ) {
		this.path = path;
	}
	else {
		this.path = [];
	}
	this.index = 0;
	this.isInMemory = true;
}

joshSprite.prototype = {
	setPath: function( p ) {
		this.path = p;
	},
	getPath: function() {
		return this.path;
	},
	getPathLength: function() {
		return this.path.length;
	},
	getIndex: function() {
		return this.index;
	},
	getPoint: function() {
		if ( this.index < this.path.length ) {
			return this.path[ this.index ].point;
		}
		return false;
	},
	getX: function() {
		if ( this.index < this.path.length ) {
			return this.path[ this.index ].point[0];
		}
		return false;
	},
	getY: function() {
		if ( this.index < this.path.length ) {
			return this.path[ this.index ].point[1];
		}
		return false;
	},
	increment: function(amt) {
		if ( amt === undefined ) {
			amt = 1;
		}
		this.index += amt;
	},
	decrement: function(amt) {
		if ( amt === undefined ) {
			amt = 1;
		}
		this.index -= amt;
	},
	changeState: function(n) {
		var spriteHeight = this.frame.height;
		this.frame.scrollTo(0 , n*spriteHeight );
	},
	isOnStage: function() {
		var screen_rows = console.screen_rows;
		var screen_cols = console.screen_columns;
		var sprite_x = this.getX();
		var sprite_y = this.getY();
		var sprite_w = this.frame.width;
		var sprite_h = this.frame.height;

		if (
			// Not outside left border
			( sprite_x + sprite_w ) > 0 &&
			// Not outside right border
			sprite_x <= screen_cols &&
			// Not outside top border
			( sprite_y + sprite_h ) > 0 &&
			// Not outside bottom border
			sprite_y <= screen_rows
		) {
			return true;
		}
		return false;
	},
	move: function() {
		// Get current point on animation path
		if ( this.getPoint() ) {
			if ( this.isOnStage() ) {
				this.frame.moveTo( this.getX(), this.getY() );
				if (!this.frame.is_open) {
					//this.frame.draw();
					this.frame.open();
				}
			}
			else {
				if (this.frame.is_open) {
					this.frame.close();
				}
			}
			this.increment();
		}
	}
}





function makeBg() {

	// SET UP THE PARALLAX-SCROLLING ASTEROID BACKGROUND LAYERS
	// --------------------------------------------------------

	// Parent frame for all the background frames and sprite frames
	bgFrame = new Frame(1, 1, 80, 24, BG_BLACK);

	// This allows me to hold frames "offstage" beyond the bounds of bgFrame
	bgFrame.checkbounds = false;

	bgFrame1 = new Frame(1, 1, 80, 24, undefined, bgFrame);
	bgFrame2 = new Frame(1, 1, 80, 24, undefined, bgFrame);
	bgFrame3 = new Frame(1, 1, 80, 24, undefined, bgFrame);
	fgFrame  = new Frame(1, 1, 80, 24, undefined, bgFrame);

	bgFrame1.load(js.exec_dir + '/graphics/starfield.bin');        // circular-scrolling starfield
	bgFrame2.load(js.exec_dir + '/graphics/asteroid-new-1c.bin');  // circular-scrolling asteroid field, dark grey
	bgFrame3.load(js.exec_dir + '/graphics/asteroid-new-2c.bin');  // circular-scrolling asteroid field, light grey

	bgFrameArray = [
		bgFrame1,
		bgFrame2,
		bgFrame3,
		fgFrame
	];

	// initialize each of the background layers with the same properties
	for (var b=0; b<bgFrameArray.length; b++) {
		// FORMAT: maskFrame( frame, maskChar, maskAttr )
		// ascii(219) = solid block
 		maskFrame( bgFrameArray[b], ascii(219), LIGHTMAGENTA );
		maskFrame( bgFrameArray[b], ascii(23), BG_BLACK );
 		maskFrame( bgFrameArray[b], ascii(219), BLACK );
		bgFrameArray[b].h_scroll = true;
		bgFrameArray[b].v_scroll = false;
		bgFrameArray[b].transparent = true;
	}

	// assign parallax ratio for each layer
	bgFrame1.parallaxRatio = 0.0625;  // starfield is slowest
	bgFrame2.parallaxRatio = 1;       // dark grey asteroids are slow
	bgFrame3.parallaxRatio = 2;       // light grey asteroids are medium



	// SET UP THE FALCON SPRITE
	// ------------------------

	falconSprite = new joshSprite( new Frame(1, 1, 42, 14, undefined, bgFrame) );
	falconSprite.frame.load(js.exec_dir + '/graphics/millennium-falcon-sprite.bin');

	// falcon sprite has two states: engine dark or engine lit
	falconSprite.accelerate = function() {
		this.changeState(1);
	}
	falconSprite.decelerate = function() {
		this.changeState(0);
	}
	// Load the sprite's animation path
	falconSprite.setPath( getJson( 'falcon.json' )['path'] );



	// SET UP THE FOREGROUND ASTEROID SPRITES
	// ---------------------------

	// MEGA ASTEROID
	astSpriteMega = new joshSprite( new Frame(1, 1, 66, 30, undefined, bgFrame) );
	astSpriteMega.frame.load(js.exec_dir + '/graphics/asteroid-single-mega.bin');
	astSpriteMega.setPath( getJson( 'asteroid-mega.json' )['path'] );

	// BIG ASTEROID
	astSpriteBig = new joshSprite( new Frame(1, 1, 28, 16, undefined, bgFrame) );
	astSpriteBig.frame.load(js.exec_dir + '/graphics/asteroid-single-big.bin');
	astSpriteBig.setPath( getJson( 'asteroid-big.json' )['path'] );

	// SMALL ASTEROID 1
	astSprite1 = new joshSprite( new Frame(1, 1, 12, 6, undefined, bgFrame) );
	astSprite1.frame.load(js.exec_dir + '/graphics/asteroid-single-small-12x6.bin');
	astSprite1.setPath( getJson( 'asteroid-small-1.json' )['path'] );

	// SMALL ASTEROID 2
	astSprite2 = new joshSprite( new Frame(1, 1, 16, 8, undefined, bgFrame) );
	astSprite2.frame.load(js.exec_dir + '/graphics/asteroid-single-small-16x8.bin');
	astSprite2.setPath( getJson( 'asteroid-small-2.json' )['path'] );


	// SET UP COMMON PROPERTIES FOR ALL SPRITES
	// ----------------------------------------

	spriteFrameArray = [
		falconSprite,
		astSpriteMega,
		astSpriteBig,
		astSprite1,
		astSprite2
	];

	// initialize each layer with the same properties
	for (var f=0; f<spriteFrameArray.length; f++) {
		spriteFrameArray[f].frame.checkbounds = false;
		// For changing states, we need vscroll but not hscroll
		spriteFrameArray[f].frame.h_scroll = false;
		spriteFrameArray[f].frame.v_scroll = true;
		spriteFrameArray[f].frame.transparent = true;
		// Mask the sprite, by changing all magenta solid blocks
		// as well as all black empty spaces to transparent
		maskFrame( spriteFrameArray[f].frame, ascii(23), BG_BLACK );
		maskFrame( spriteFrameArray[f].frame, ascii(219), LIGHTMAGENTA );
	}


	// MOVE ALL SPRITES TO THEIR STARTING POSITIONS
	for (var f=0; f<spriteFrameArray.length; f++) {
		spriteFrameArray[f].move();
	}

	// Open all background layers
	for (var b=0; b<bgFrameArray.length; b++) {
		bgFrameArray[b].open();
	}

	// MESSAGE / INFO FRAME
	if (msgMode) {
		msgFrame = new Frame(48,20,32,2,BG_BLACK|WHITE,bgFrame);
		msgFrame.draw();
	}


	// The Canvas frame will sit atop all the others. We will manually paint this frame with the data
	// from bgFrame.dump(). Using a canvas with manual repaint is faster than plain bgFrame.cycle();
	canvasFrame = new Frame(1, 1, 80, 24, BG_BLACK);
	canvasFrame.transparent = false;
	canvasFrame.draw();
}





function play() {
	var userInput = '';
	var beat = 1;
 	var xl = bgFrame.width;
 	var yl = bgFrame.height;
	var x = xl-1;
	var y = 0;
	var p = 0;
	// message mode. shows basic debug info
	msgMode = false;
	// screenshot counter
	var ss = 0;
	// screenshot switch. Change this to false to disable.
	var screenShot = false;
	// main animation
	var fr = 0;
	var numFrames = 332;
	var pixelArray = [];
	// Best wipeSizes are evenly divisible into 80: 1, 2, 4, 5, 8, 10
	var wipeSize = 6;
	var wipeGradientStep = parseInt( (yl-2) / wipeSize );
	var wipeFrLen = parseInt( xl / wipeSize );
	// opening title screen
	var numTitleFrames = 96;
	// end credits screen
	var creditsFr = 0;
	var numCreditsFrames = 8;

	// ====================================================
	// MILLENNIUM FALCON ANIMATION (with wipe outtro)
	// ====================================================

	for ( fr=0; fr<numFrames; fr++ ) {
		// Record what time we began the loop
		var beginFrameDraw = system.timer;

		// CHECK FOR USER INPUT DURING ANIMATION
		var gotkey = false;
		var key = console.inkey( K_UPPER );
		if ( key ) {
			// Exit handler: Q, X, [esc]
			if ( key == 'Q' || key == 'X' || ascii(key) == 27 ) {
				cleanup();
				exit();
			}
			// Pause handler: P, [space]
			else if ( key == 'P' || ascii(key) == 32 ) {
				while( !gotkey ) {
					key = console.inkey( K_UPPER );
					if ( key ) {
						// Debug handler: D
						if (key == 'D') {
							debug( 'Frame:' + fr );
							debug( 'Frames open: ');
							debugFrameDump( bgFrame );
							debugFrameDump( canvasFrame );
							var frStr = fr.toString().rjust(3,'0');
							bgFrame.screenShot(js.exec_dir + "/screenshots/debug-" + frStr + "-bgFrame.bin", false);
							canvasFrame.screenShot(js.exec_dir + "/screenshots/debug-" + frStr + "-canvasFrame.bin", false);
						}
						// Unpause handler: any key other than D
						else {
							gotkey = true;
						}
					}
				}
			}
		}

		// reset beat counter if necessary
		if (beat > 4) {
			beat = 1;
		}

		var direction = 1;
		var amt = 1;


		// - - - - - - - - - - - - - - - - - - - - -
		// SCROLL THE BACKGROUND LAYERS
		// - - - - - - - - - - - - - - - - - - - - -

		if ( fr <= numFrames ) {
			// Light up the engines for acceleration
			if ( fr < 246 ) {
				falconSprite.decelerate();
			}
			else {
 				falconSprite.accelerate();
			}

			if (beat == 1 || beat == 2 ) {
				// Iterate over all background layers and scroll them
				for (var b=0; b<bgFrameArray.length; b++) {
					var totalMove = 0;
					// Calculate how far this background layer should scroll
					totalMove = amt * direction * bgFrameArray[b].parallaxRatio;
					// Ensure layers with fractional ratios only scroll every other beat
					if ( (totalMove >= 1) || (beat == 1) ) {
						bgFrameArray[b].scrollCircular(totalMove,0);
					}
				}
			}

			else if (beat == 3 || beat == 4 ) {
				// Iterate over all background layers and scroll them
				for (var b=0; b<bgFrameArray.length; b++) {
					var totalMove = 0;
					// Calculate how far this background layer should scroll
					totalMove = amt * direction * bgFrameArray[b].parallaxRatio;
					// Ensure layers with fractional ratios only scroll every other beat
					if ( (totalMove >= 1) || (beat == 3) ) {
						bgFrameArray[b].scrollCircular(totalMove,0);
					}
				}
			}


			// - - - - - - - - - - - - - - - - - - - - -
			// 'THE ODDS OF SUCCESSFULLY NAVIGATING ...'
			// - - - - - - - - - - - - - - - - - - - - -

			if ( fr < numTitleFrames ) {
				if ( fr == 16 ) {
					fgFrame.load(js.exec_dir + '/graphics/message-begin-1a.bin', 80, 24);
					maskFrame( fgFrame, ascii(219), LIGHTMAGENTA );
				}
				else if ( fr == 17 ) {
					fgFrame.load(js.exec_dir + '/graphics/message-begin-1b.bin', 80, 24);
					maskFrame( fgFrame, ascii(219), LIGHTMAGENTA );
				}
				else if ( fr == 18 ) {
					fgFrame.load(js.exec_dir + '/graphics/message-begin-1c.bin', 80, 24);
					maskFrame( fgFrame, ascii(219), LIGHTMAGENTA );
				}

				// fade out first message
				else if ( fr == 48 ) {
					fgFrame.load(js.exec_dir + '/graphics/message-begin-1b.bin', 80, 24);
					maskFrame( fgFrame, ascii(219), LIGHTMAGENTA );
				}
				if ( fr == 49 ) {
					fgFrame.load(js.exec_dir + '/graphics/message-begin-1a.bin', 80, 24);
					maskFrame( fgFrame, ascii(219), LIGHTMAGENTA );
				}

				// close fg frame briefly between messages
				else if ( fr == 50 ) {
					fgFrame.close( );
				}

				// second message
				else if ( fr == 56 ) {
					fgFrame.clear( BG_BLACK );
					fgFrame.load(js.exec_dir + '/graphics/message-begin-2a.bin', 80, 18);
					fgFrame.move(0,4);
					maskFrame( fgFrame, ascii(219), LIGHTMAGENTA );
					fgFrame.open();
				}
				else if ( fr == 57 ) {
					fgFrame.load(js.exec_dir + '/graphics/message-begin-2b.bin', 80, 18);
					maskFrame( fgFrame, ascii(219), LIGHTMAGENTA );
				}
				else if ( fr == 58 ) {
					fgFrame.load(js.exec_dir + '/graphics/message-begin-2c.bin', 80, 18);
					maskFrame( fgFrame, ascii(219), LIGHTMAGENTA );
				}

				// fade out second message
				else if ( fr == 94 ) {
					fgFrame.load(js.exec_dir + '/graphics/message-begin-2b.bin', 80, 19);
					maskFrame( fgFrame, ascii(219), LIGHTMAGENTA );
				}
				if ( fr == 95 ) {
					fgFrame.load(js.exec_dir + '/graphics/message-begin-2a.bin', 80, 18);
					maskFrame( fgFrame, ascii(219), LIGHTMAGENTA );
				}



			}
			// close fg frame for start of animation
			if ( fr == numTitleFrames ) {
				fgFrame.close();
			}


			// - - - - - - - - - - - - - - - - - - - - -
			// ANIMATE THE SPRITES
			// - - - - - - - - - - - - - - - - - - - - -

			if ( fr > numTitleFrames ) {
				for (var f=0; f<spriteFrameArray.length; f++) {
					// The move function contains logic for checking
					// if the sprite is onstage or not, and whether to
					// close or open the frame.
					spriteFrameArray[f].move();
				}
			}

			// - - - - - - - - - - - - - - - - - - - - -
			// 'NEVER TELL ME THE ODDS'
			// - - - - - - - - - - - - - - - - - - - - -

			if ( fr > 268 ) {
				if ( fr == 269 ) {
					fgFrame.clear( BG_BLACK );
					fgFrame.load(js.exec_dir + '/graphics/message-end-a.bin', 80, 24);
					fgFrame.move(0,3);
					maskFrame( fgFrame, ascii(219), LIGHTMAGENTA );
					fgFrame.open();
				}
				else if ( fr == 270 ) {
					fgFrame.load(js.exec_dir + '/graphics/message-end-b.bin', 80, 24);
					maskFrame( fgFrame, ascii(219), LIGHTMAGENTA );
				}
				else if ( fr == 271 ) {
					fgFrame.load(js.exec_dir + '/graphics/message-end-c.bin', 80, 24);
					maskFrame( fgFrame, ascii(219), LIGHTMAGENTA );
				}

				// fade out first message
				else if ( fr == 301 ) {
					fgFrame.load(js.exec_dir + '/graphics/message-end-b.bin', 80, 24);
					maskFrame( fgFrame, ascii(219), LIGHTMAGENTA );
				}
				else if ( fr == 302 ) {
					fgFrame.load(js.exec_dir + '/graphics/message-end-a.bin', 80, 24);
					maskFrame( fgFrame, ascii(219), LIGHTMAGENTA );
				}
				else if ( fr == 303 ) {
					fgFrame.close();
				}
			}
		}

		// - - - - - - - - - - - - - - - - - - - - -
		// ENDING WIPE
		// - - - - - - - - - - - - - - - - - - - - -

		if (fr >= (numFrames - wipeFrLen) - 1 ) {

			if ( !fgFrame.is_open ) {
				fgFrame.load(js.exec_dir + '/graphics/mask-frame-80x24.bin', 80, 24);
				fgFrame.moveTo(1,1);
				emptyFrame( fgFrame );
				fgFrame.draw();
			}

			// A wipe is a slow painting across the screen, with the trailing
			// edge consisting of gradient of (wipeSize) columns.
			// Each column will have successively fewer characters.
			// Clear out the columns from the LAST wipe gradient.
			if ( x < ( xl - (wipeSize) ) ) {
				var cleanupSize = wipeSize;
				for (c = 0; c<cleanupSize; c++) {
					var oldx = (x + cleanupSize) - c;
					for (y=0; y<yl; y++) {
						//debug( 'c:' + c + ' | y:' + y + ' | oldx: ' + oldx );
						fgFrame.setData(oldx,y,ascii(214),BLACK|BG_BLACK);
					}
				}
			}

			// Generate the new wipe gradient.
			for (p=0;p<(wipeSize); p++) {
				pixelArray[p] = [];
				for (y=0; y<yl; y++) {
					pixelArray[p].push(y);
				}
				// debug( 'pixelArray:' + pixelArray );
				while( pixelArray[p].length > ( (wipeGradientStep * p) + 2 ) ) {
					var randomIndex = Math.floor(Math.random() * pixelArray[p].length);
					var randomPixel = pixelArray[p].splice(randomIndex, 1);
					if ( x-p > -1 ) {
						fgFrame.setData(x-p,randomPixel,ascii(214),BLACK|BG_BLACK);
					}
				}
			}
			x = x - (wipeSize);

		}


		// - - - - - - - - - - - - - - - - - - - - -
		// RENDER EVERYTHING TO SCREEN
		// - - - - - - - - - - - - - - - - - - - - -

		// Cycle entire screen
		//bgFrame.cycle();
		repaintCanvas( bgFrame, canvasFrame );
		canvasFrame.cycle();


		// Record what time we finished drawing
		var endFrameDraw = system.timer;

		// Output debugging information if msgMode switch is set
		if (msgMode) {
			msgFrame.clear();
			msgFrame.close();
			msgFrame.open();
			msgFrame.putmsg('frame num: ' + fr );
			if ( falconSprite.getIndex() ) {
				msgFrame.putmsg(' | Falcon idx: ' + falconSprite.getIndex() );
			}
			msgFrame.crlf();
			msgFrame.putmsg('DrawTime: ' + (endFrameDraw - beginFrameDraw) );
		}




		// increment beat counter
		beat++;
		if (screenShot) {
			var ssStr = ss.toString().rjust(3,'0');
			bgFrame.screenShot(js.exec_dir + "/screenshots/milfalcon-" + ssStr + ".bin", false);
			ss++;
		}

		// Record draw time / debugging information
		// debug( fr + '\t' + ( endFrameDraw - beginFrameDraw ) );
		// debug( 'Frame:' + fr );
		// debug( 'Falcon Y:' + falconSprite.getY() );
		// debug( 'Drawing time: ' + ( endFrameDraw - beginFrameDraw ) );
		// debug( 'Frames open: ');
		// for (var f=0; f<spriteFrameArray.length; f++) {
		// 	debug( '   * ' + spriteFrameArray[f].frame.id + ': ' + spriteFrameArray[f].frame.is_open );
		// }


		// Keep frame rate consistent
		var drawTime = endFrameDraw - beginFrameDraw;
 		if ( drawTime < 0.08 ) {
			mswait( (0.08-drawTime)*1000 );
 		};



	} // end for loop


	// ============================
	// END CREDITS SCREEN ANIMATION
	// ============================

	var colors = [ highBlack, lowCyan, highCyan ];
	var titles = [ 'For', 'Directed by'  ];
	var names = [ 'RON', 'KIRKMAN' ];

	bgFrame1.close();
	bgFrame2.close();
	bgFrame3.close();
	bgFrame1.delete();
	bgFrame2.delete();
	bgFrame3.delete();
	falconSprite.frame.close();
	falconSprite.frame.delete();

	for (var t=0; t<titles.length; t++) {
		for (var c=0; c<colors.length; c++) {
			fgFrame.gotoxy(0,11);
			fgFrame.center( colors[c] + titles[t] );
			fgFrame.crlf();
			fgFrame.center( colors[c] + names[t] );
			fgFrame.crlf();
			repaintCanvas( bgFrame, canvasFrame );
			canvasFrame.cycle();
			mswait(80);
// 			for (var r=0; r<100; r++) {
// 				console.putmsg('\033[1C\033[1D', mode=P_NOPAUSE );
// 			}
			// fgFrame.gotoxy(0,1);
			// fgFrame.center( delayHalfSec );
		}
// 		for (var r=0; r<2000; r++) {
// 			console.putmsg('\033[1C\033[1D', mode=P_NOPAUSE );
// 		}
		// fgFrame.gotoxy(0,1);
		// fgFrame.center( delayTwoSecs );
		mswait(2000);
		for (var c=colors.length-1; c>-1; c--) {
			fgFrame.gotoxy(0,11);
			fgFrame.center( colors[c] + titles[t] );
			fgFrame.crlf();
			fgFrame.center( colors[c] + names[t] );
			fgFrame.crlf();
			repaintCanvas( bgFrame, canvasFrame );
			canvasFrame.cycle();
			if (screenShot) {
				var ssStr = ss.toString().rjust(3,'0');
				bgFrame.screenShot(js.exec_dir + "/screenshots/milfalcon-" + ssStr + ".bin", false);
				ss++;
			}
			mswait(80);
// 			for (var r=0; r<100; r++) {
// 				console.putmsg('\033[1C\033[1D', mode=P_NOPAUSE );
// 			}
		}

	}
} // play()



function cleanup() {
	var allFrames = [
		bgFrame,
		bgFrame1,
		bgFrame2,
		bgFrame3,
		falconSprite.frame,
		astSpriteMega.frame,
		astSpriteBig.frame,
		astSprite1.frame,
		astSprite2.frame,
		fgFrame
	];

	for (var af=0; af < allFrames.length; af++ ) {
 		allFrames[af].close();
	 	allFrames[af].delete();
	}
}


function main_loop() {
	makeBg();
	play();
	cleanup();
	exit();
}



// Run the animation
main_loop();


