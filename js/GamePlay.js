/* global MainGameContainer */
MainGameContainer.GamePlay = function (game) { };

MainGameContainer.GamePlay.prototype = {
  // ── Game objects ──────────────────────────────────────────────────────────
  bgMusic: undefined,
  buttons: {
    startButton: undefined,
    restartButton: undefined,
  },
  ui: {
    timeLabel:    undefined,
    scoreLabel:   undefined,
    titleLabel:   undefined,
    timerIcon:    undefined,
  },
  sounds: {
    coin:   undefined,
    smash:  undefined,
    hit:    undefined,
    mushrom: undefined,
  },
  events: {
    throwItems: undefined,
    countdown:  undefined,
  },

  // ── Game state ────────────────────────────────────────────────────────────
  gameState:  'preparing',
  mainMenuBackground: undefined,
  timeCount:  60,        // 60-second round
  scoreCount: 0,
  gameLevel:  0,
  enemies:    undefined,

  // Hole positions (world coords before margin adjustment)
  holes: [
    { x: 80,  y: 96  },
    { x: 144, y: 192 },
    { x: 240, y: 96  },
    { x: 80,  y: 288 },
    { x: 172, y: 384 },
    { x: 240, y: 288 },
    { x: 80,  y: 480 },
    { x: 144, y: 576 },
    { x: 240, y: 480 },
  ],
  xMargin: 20,
  yMargin: -16,

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  preload: function () { },

  shutdown: function () {
    this.game.world.removeAll();
    this.resetAll();
  },

  create: function () {
    this.game.time.advancedTiming = true;
    this.game.world.setBounds(0, 0, 360, 640);

    // Background — full world width, positioned at origin
    this.mainMenuBackground = this.add.sprite(0, 0, 'game_bg');

    this.initSounds();
    this.addUIElements();
    this.enemies = this.game.add.group();

    this.showMainMenu();
  },

  update: function () {
    this.updateUI();
    var self = this;

    if (self.gameState === 'playing') {
      this.enemies.forEach(function (enemy) {
        var pressed = self.game.input.activePointer.leftButton.isDown
                   || self.game.input.pointer1.isDown;
        if (enemy.input.pointerOver() && pressed && self.gameState === 'playing') {
          if (enemy.type === 'bomb') {
            self.sounds.hit.play();
            self.gameState = 'gameOver';
            self.gameOverState('TNT!');
            enemy.destroy();
          } else {
            self.enemyDestroy(enemy);
          }
        }
      });
    }
  },

  // ── Helpers ───────────────────────────────────────────────────────────────
  mcStyle: function (size) {
    return {
      font: size + 'px "Press Start 2P"',
      fill: '#FFFFFF',
      align: 'center',
      stroke: '#000000',
      strokeThickness: Math.max(2, Math.round(size / 8)),
    };
  },

  mcStyleColor: function (size, fill, stroke) {
    return {
      font: size + 'px "Press Start 2P"',
      fill: fill   || '#FFFFFF',
      align: 'center',
      stroke: stroke || '#000000',
      strokeThickness: Math.max(2, Math.round(size / 8)),
    };
  },

  // ── Sounds ────────────────────────────────────────────────────────────────
  initSounds: function () {
    this.sounds.coin   = this.game.add.audio('coin');
    this.sounds.smash  = this.game.add.audio('confirm');
    this.sounds.hit    = this.game.add.audio('error');
    this.sounds.mushrom = this.game.add.audio('loadsave');
  },

  // ── UI ────────────────────────────────────────────────────────────────────
  addUIElements: function () {
    var cx = this.game.world.centerX;

    // HUD bar background (top strip)
    var hudBar = this.game.add.graphics(0, 0);
    hudBar.beginFill(0x000000, 0.55);
    hudBar.drawRect(0, 0, 360, 36);
    hudBar.endFill();
    hudBar.fixedToCamera = true;

    // Score label
    this.ui.scoreLabel = this.game.add.text(8, 8, 'Score: 0', this.mcStyle(9));
    this.ui.scoreLabel.fixedToCamera = true;

    // Timer label (right-aligned)
    this.ui.timeLabel = this.game.add.text(352, 8, '60s', this.mcStyleColor(9, '#55FF55'));
    this.ui.timeLabel.anchor.setTo(1, 0);
    this.ui.timeLabel.fixedToCamera = true;
  },

  updateUI: function () {
    if (this.ui.scoreLabel) {
      this.ui.scoreLabel.setText('Score: ' + this.scoreCount);
    }
    if (this.ui.timeLabel) {
      var t = Math.max(0, this.timeCount);
      var color = t <= 10 ? '#FF5555' : t <= 20 ? '#FFAA00' : '#55FF55';
      this.ui.timeLabel.fill = color;
      this.ui.timeLabel.setText(t + 's');
    }
  },

  // ── Main menu ─────────────────────────────────────────────────────────────
  showMainMenu: function () {
    var cx = this.game.world.centerX;
    var cy = this.game.world.centerY;

    // Semi-transparent backdrop panel
    var panel = this.game.add.graphics(0, 0);
    panel.beginFill(0x000000, 0.70);
    panel.drawRect(30, cy - 110, 300, 200);
    panel.endFill();
    this.ui.menuPanel = panel;

    // Game title
    this.ui.titleLabel = this.game.add.text(cx, cy - 80,
      'WHACK-A-\nCREEPER', this.mcStyleColor(16, '#55FF55', '#006600'));
    this.ui.titleLabel.anchor.setTo(0.5, 0.5);
    this.ui.titleLabel.lineSpacing = 8;

    // Subtitle
    this.ui.subtitleLabel = this.game.add.text(cx, cy - 10,
      'Minecraft Edition', this.mcStyleColor(7, '#AAAAAA', '#333333'));
    this.ui.subtitleLabel.anchor.setTo(0.5, 0.5);

    // Start button (using preloaderBar image as button graphic)
    this.buttons.startButton = this.game.add.button(
      cx - 85, cy + 30, 'preloaderBar', this.startGame, this, 2, 1, 0);
    this.ui.startLabel = this.game.add.text(cx, cy + 52,
      '> START <', this.mcStyleColor(10, '#FFFF55', '#7A6A00'));
    this.ui.startLabel.anchor.setTo(0.5, 0.5);

    // Tip text
    this.ui.tipLabel = this.game.add.text(cx, cy + 90,
      'Hit creepers!\nAvoid TNT!', this.mcStyleColor(7, '#FFAAAA', '#550000'));
    this.ui.tipLabel.anchor.setTo(0.5, 0.5);
    this.ui.tipLabel.lineSpacing = 6;
  },

  clearMainMenu: function () {
    if (this.ui.menuPanel)    { this.ui.menuPanel.destroy();    this.ui.menuPanel = null; }
    if (this.ui.titleLabel)   { this.ui.titleLabel.destroy();   this.ui.titleLabel = null; }
    if (this.ui.subtitleLabel){ this.ui.subtitleLabel.destroy(); this.ui.subtitleLabel = null; }
    if (this.ui.tipLabel)     { this.ui.tipLabel.destroy();     this.ui.tipLabel = null; }
    if (this.ui.startLabel)   { this.ui.startLabel.destroy();   this.ui.startLabel = null; }
    if (this.buttons.startButton) {
      this.buttons.startButton.destroy();
      this.buttons.startButton = null;
    }
  },

  // ── Game flow ─────────────────────────────────────────────────────────────
  startGame: function () {
    this.clearMainMenu();

    this.timeCount  = 60;
    this.scoreCount = 0;
    this.gameLevel  = 0;
    this.gameState  = 'playing';

    // Background music
    this.bgMusic = this.game.add.audio('blue_beat');
    this.bgMusic.volume = 0.25;
    this.bgMusic.loop = true;
    this.bgMusic.play();

    var self = this;

    // Spawn loop — speed increases with level
    this.events.throwItems = this.game.time.events.loop(
      Phaser.Timer.SECOND * 2.2,
      function () {
        if (self.gameState === 'playing') { self.showEnemies(); }
      }, self);

    // 1-second countdown tick
    this.events.countdown = this.game.time.events.loop(
      Phaser.Timer.SECOND,
      function () {
        if (self.gameState === 'playing') {
          self.timeCount -= 1;
          if (self.timeCount <= 0) {
            self.timeCount = 0;
            self.gameState = 'gameOver';
            self.gameOverState('TIME\'S UP!');
          }
        }
      }, self);

    self.showEnemies();
  },

  showEnemies: function () {
    this.gameLevel += 1;
    var total;
    if      (this.gameLevel <= 3)  { total = 1; }
    else if (this.gameLevel <= 6)  { total = 2; }
    else if (this.gameLevel <= 10) { total = 3; }
    else if (this.gameLevel <= 14) { total = 4; }
    else                           { total = 5; }

    var spaces = JSON.parse(JSON.stringify(this.holes));
    for (var i = 0; i < total; i++) {
      var idx  = Math.floor(Math.random() * spaces.length);
      var spot = spaces.splice(idx, 1)[0];
      this.createEnemy(spot.x, spot.y);
    }
  },

  createEnemy: function (xPos, yPos) {
    var isBomb = Math.random() < 0.15;  // 15% chance of TNT
    var type   = isBomb ? 'bomb' : 'mole';

    var sprite = this.enemies.create(
      xPos + this.xMargin, yPos + this.yMargin, type);
    sprite.type  = type;
    sprite.inputEnabled = true;
    sprite.anchor.setTo(0.5, 0.5);
    sprite.alpha = 0;

    // Scale TNT slightly smaller than creeper so sizing looks balanced
    if (type === 'bomb') {
      sprite.scale.setTo(0.48, 0.48);
    }

    var lifespan = isBomb ? 3000 : 2200;
    var tweenIn  = this.game.add.tween(sprite).to({ alpha: 1 }, 300, 'Linear');
    var tweenOut = this.game.add.tween(sprite).to({ alpha: 0 }, 600, 'Linear');
    tweenIn.chain(tweenOut);
    tweenIn.start();
    setTimeout(function () {
      if (sprite && sprite.alive) { sprite.destroy(); }
    }, lifespan);

    return sprite;
  },

  enemyDestroy: function (enemy) {
    this.sounds.smash.play();
    this.scoreCount += 100;
    // Flash white on hit
    enemy.tint = 0xFFFFFF;
    var self = this;
    setTimeout(function () {
      if (enemy && enemy.alive) { enemy.destroy(); }
    }, 80);
  },

  // ── Game Over ─────────────────────────────────────────────────────────────
  gameOverState: function (reason) {
    var cx = this.game.world.centerX;
    var cy = this.game.world.centerY;

    if (this.bgMusic) { this.bgMusic.stop(); }
    if (this.events.throwItems) {
      this.game.time.events.remove(this.events.throwItems);
    }
    if (this.events.countdown) {
      this.game.time.events.remove(this.events.countdown);
    }
    this.enemies.removeAll(true);

    // Rank calculation
    var rank;
    if      (this.scoreCount >= 3000) { rank = 'DIAMOND'; }
    else if (this.scoreCount >= 2000) { rank = 'GOLD';    }
    else if (this.scoreCount >= 1000) { rank = 'IRON';    }
    else if (this.scoreCount >= 500)  { rank = 'STONE';   }
    else                              { rank = 'WOOD';    }

    var rankColors = {
      DIAMOND: '#55FFFF',
      GOLD:    '#FFAA00',
      IRON:    '#AAAAAA',
      STONE:   '#888888',
      WOOD:    '#AA7744',
    };

    // Dark backdrop
    var panel = this.game.add.graphics(0, 0);
    panel.beginFill(0x000000, 0.78);
    panel.drawRect(20, cy - 150, 320, 310);
    panel.endFill();
    this.ui.gameOverPanel = panel;

    // "GAME OVER" header
    this.game.add.text(cx, cy - 120,
      'GAME OVER', this.mcStyleColor(18, '#FF5555', '#550000'))
      .anchor.setTo(0.5, 0.5);

    // Reason
    this.game.add.text(cx, cy - 70,
      reason, this.mcStyleColor(11, '#FFAA00', '#553300'))
      .anchor.setTo(0.5, 0.5);

    // Score
    this.game.add.text(cx, cy - 20,
      'Score: ' + this.scoreCount, this.mcStyle(13))
      .anchor.setTo(0.5, 0.5);

    // Rank
    this.game.add.text(cx, cy + 30,
      'Rank: ' + rank,
      this.mcStyleColor(11, rankColors[rank] || '#FFFFFF', '#000000'))
      .anchor.setTo(0.5, 0.5);

    // Restart button
    this.buttons.restartButton = this.game.add.button(
      cx - 85, cy + 70, 'preloaderBar', this.restartGame, this, 2, 1, 0);
    this.game.add.text(cx, cy + 93,
      '> PLAY AGAIN <', this.mcStyleColor(8, '#FFFF55', '#7A6A00'))
      .anchor.setTo(0.5, 0.5);
  },

  restartGame: function () {
    this.game.state.restart(true);
  },

  resetAll: function () {
    this.timeCount  = 60;
    this.scoreCount = 0;
    this.gameLevel  = 0;
    this.gameState  = 'preparing';
  },

  render: function () {
    // this.game.debug.text(this.game.time.fps || '--', 2, 14, '#00ff00');
  },
};
