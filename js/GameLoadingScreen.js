/* global MainGameContainer */
MainGameContainer.GameLoadingScreen = function (game) {};

MainGameContainer.GameLoadingScreen.prototype = {
  preloadBar: undefined,
  bck: undefined,
  ready: false,

  gameAssets: {
    images: [
      { name: 'game_bg', src: './assets/img/game_bg.png' },
      { name: 'mole',    src: './assets/img/mole.png'    },
      { name: 'bomb',    src: './assets/img/bomb.png'    },
    ],
    sounds: [
      { name: 'confirm',  src: './assets/sound/confirm.wav'  },
      { name: 'error',    src: './assets/sound/error.wav'    },
      { name: 'loadsave', src: './assets/sound/loadsave.wav' },
    ],
    music: [
      { name: 'blue_beat', src: './assets/music/blue_beat.mp3' },
    ],
    spritesheets: [],
  },

  preload: function () {
    var cx = this.world.centerX;
    var cy = this.world.centerY;

    // Background
    this.bck = this.add.sprite(cx, cy, 'preloaderBackground');
    this.bck.anchor.setTo(0.5, 0.5);

    // Loading bar
    this.preloadBar = this.add.sprite(cx, cy, 'preloaderBar');
    this.preloadBar.anchor.setTo(0, 0.5);
    this.preloadBar.x = cx - this.preloadBar.width / 2;
    this.load.setPreloadSprite(this.preloadBar);

    // "LOADING..." label above the bar
    this.add.text(cx, cy - 46,
      'LOADING...', {
        font: '10px "Press Start 2P", monospace',
        fill: '#55FF55',
        stroke: '#003300',
        strokeThickness: 2,
        align: 'center',
      }).anchor.setTo(0.5, 0.5);

    // Title above loader
    this.add.text(cx, cy - 90,
      'WHACK-A-\nCREEPER', {
        font: '16px "Press Start 2P", monospace',
        fill: '#55FF55',
        stroke: '#006600',
        strokeThickness: 3,
        align: 'center',
      }).anchor.setTo(0.5, 0.5);

    // Load all assets
    var i, n;

    n = this.gameAssets.images.length;
    for (i = 0; i < n; i++) {
      this.game.load.image(this.gameAssets.images[i].name, this.gameAssets.images[i].src);
    }

    n = this.gameAssets.music.length;
    for (i = 0; i < n; i++) {
      this.game.load.audio(this.gameAssets.music[i].name, this.gameAssets.music[i].src);
    }

    n = this.gameAssets.sounds.length;
    for (i = 0; i < n; i++) {
      this.game.load.audio(this.gameAssets.sounds[i].name, this.gameAssets.sounds[i].src);
    }
  },

  create: function () {
    this.preloadBar.cropEnabled = false;
  },

  update: function () {
    if (!this.ready) {
      this.ready = true;
      this.state.start('GamePlay');
    }
  },
};
