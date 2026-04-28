const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#f4d1a0', 
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
    scene: { preload: preload, create: create, update: update }
};

const game = new Phaser.Game(config);
let player, shrimps, shells, enemies, bloodEmitter; 
let score = 0, moltCount = 0, health = 3; 
let scoreText, moltText, healthText, timerText, gameStarted = false; 
let moveDirection = { dx: 0, dy: 0, active: 0 };
let startTime, lastEnemyTime = 0; // 增加天敌时间控制器

const baseWidth = 60, baseHeight = 85; 
const moveSpeed = 250;  
const baseGrowth = 2;   
const moltGrowth = 1.3; 

function preload() {
    this.load.image('hou', 'hou.png'); 
    this.load.image('shrimp', 'shrimp.png');
    this.load.image('bg', 'bg.jpg'); 
    this.load.image('enemy', 'enemy.png'); 
    this.load.image('blue_dot', 'hou.png'); 
}

function create() {
    const sw = window.innerWidth, sh = window.innerHeight;
    this.add.image(sw/2, sh/2, 'bg').setDisplaySize(sw, sh).setDepth(0);

    shells = this.add.group();   
    enemies = this.physics.add.group(); 

    player = this.physics.add.sprite(sw/2, sh/2, 'hou').setDepth(5).setDisplaySize(baseWidth, baseHeight);
    player.setCollideWorldBounds(true);
    player.body.enable = false;

    bloodEmitter = this.add.particles(0, 0, 'blue_dot', {
        speed: { min: -100, max: 100 }, scale: { start: 0.1, end: 0 },
        alpha: { start: 1, end: 0 }, lifespan: 600, tint: 0x0000ff, emitting: false
    }).setDepth(6);

    shrimps = this.physics.add.group();
    refreshShrimps(this); 

    this.physics.add.overlap(player, shrimps, collectShrimp, null, this);
    this.physics.add.overlap(player, enemies, (p, e) => {
        if(e.alpha < 0.8) return; 
        e.destroy();
        handleDamage(this);
    }, null, this);
    
    scoreText = this.add.text(20, 20, '能量(虾): 0/3', { fontSize: '24px', fill: '#333', backgroundColor: 'rgba(255,255,255,0.6)', padding: {x:8, y:4} }).setDepth(10).setVisible(false);
    moltText = this.add.text(20, 65, '蜕壳进度: 0/3 次', { fontSize: '24px', fill: '#d35400', backgroundColor: 'rgba(255,255,255,0.6)', padding: {x:8, y:4} }).setDepth(10).setVisible(false);
    healthText = this.add.text(20, 110, '生命(蓝血): 3/3', { fontSize: '24px', fill: '#0000ff', backgroundColor: 'rgba(255,255,255,0.6)', padding: {x:8, y:4} }).setDepth(10).setVisible(false);
    timerText = this.add.text(sw/2, 20, '生存时间: 0s', { fontSize: '24px', fill: '#000', fontStyle: 'bold' }).setOrigin(0.5, 0).setDepth(10).setVisible(false);

    setupButtons(this, sh, sw);

    // 8. 开场引导
    const startOverlay = this.add.rectangle(sw/2, sh/2, sw, sh, 0x000000, 0.7).setDepth(100).setInteractive();
    
    const startText = this.add.text(sw/2, sh/2, 
        "————【 鲎的壮丽成长史 】————\n\n" +
        "• 收集能量：吃虾长大约 2 像素\n" +
        "• 进化蜕壳：体型猛长，留下虚影\n" +
        "• 保护蓝血：第2轮起海鸥将会俯冲！\n\n" +
        "鲎血是珍贵的医疗资源，请守护它们。\n" +
        "( 点击屏幕开始进化 )", 
        { 
            fontSize: '22px', 
            fill: '#fff', 
            align: 'left', // 确保多行文字每行都居中
            lineSpacing: 12 
        }
    ).setOrigin(0.5).setDepth(101); // 这里的 setOrigin(0.5) 确保文字块中心点在 sw/2, sh/2

    startOverlay.on('pointerdown', () => {
        startTime = this.time.now;
        lastEnemyTime = this.time.now; // 初始化天敌计时
        startOverlay.destroy(); startText.destroy();
        scoreText.setVisible(true); moltText.setVisible(true); healthText.setVisible(true); timerText.setVisible(true);
        player.body.enable = true; gameStarted = true;
    });
}

function update() {
    if (!gameStarted) return;

    let currentTime = this.time.now;
    let timeElapsed = Math.floor((currentTime - startTime) / 1000);
    timerText.setText('生存时间: ' + timeElapsed + 's');

    // 移动逻辑
    const drag = 0.92; 
    if (moveDirection.active) {
        player.setVelocity(moveDirection.dx, moveDirection.dy);
        let angleDegs = Phaser.Math.RadToDeg(Math.atan2(moveDirection.dy, moveDirection.dx)) + 90;
        player.rotation = Phaser.Math.Angle.RotateTo(player.rotation, Phaser.Math.DegToRad(angleDegs), 0.15);
    } else {
        player.setVelocity(player.body.velocity.x * drag, player.body.velocity.y * drag);
    }

    // *** 稳定触发逻辑：每 8 秒必出一个海鸥 ***
    if (moltCount >= 1 && currentTime - lastEnemyTime > 8000) { 
        spawnEnemy(this);
        lastEnemyTime = currentTime; // 重置计时器
    }
}

function spawnEnemy(scene) {
    const sw = window.innerWidth;
    const enemy = enemies.create(Phaser.Math.Between(100, sw - 100), -100, 'enemy');
    enemy.setDisplaySize(130, 130).setAlpha(0).setDepth(4);

    scene.tweens.add({
        targets: enemy, alpha: 0.5, y: 80, duration: 2000,
        onComplete: () => {
            if (!enemy.active) return;
            enemy.setAlpha(1);
            enemy.setVelocityY(300);
        }
    });
}

function collectShrimp(player, shrimp) {
    shrimp.disableBody(true, true);
    score++;
    scoreText.setText('能量(虾): ' + score + '/3');
    this.tweens.add({
        targets: player, scaleX: player.scaleX * 0.8, scaleY: player.scaleY * 0.8, duration: 100, yoyo: true,
        onComplete: () => { player.setDisplaySize(player.displayWidth + baseGrowth, player.displayHeight + baseGrowth); }
    });
    if (score === 3) handleMolting(this); 
}

function handleDamage(scene) {
    health--;
    healthText.setText('生命(蓝血): ' + health + '/3');
    bloodEmitter.emitParticleAt(player.x, player.y, 15);
    scene.tweens.add({ targets: player, tint: 0xff0000, duration: 100, yoyo: true, repeat: 3, onComplete: () => player.clearTint() });
    if (health <= 0) gameOver(scene);
}

function handleMolting(scene) {
    gameStarted = false; 
    player.setVelocity(0, 0);
    score = 0; // 变量清零
    scoreText.setText('能量(虾): 0/3'); // 【新增】让左上角的文字也立刻变回 0/3
    moltCount++; 

    const sw = window.innerWidth;
    const sh = window.innerHeight;
    
    // 找回那句消失的提示语
    const moltMsg = scene.add.text(sw/2, sh/2, '正在蜕壳进化...', { 
        fontSize: '32px', fill: '#fff', backgroundColor: 'rgba(0,0,0,0.5)', padding: {x:20, y:10} 
    }).setOrigin(0.5).setDepth(50);

    // 留下虚影壳
    let shell = shells.create(player.x, player.y, 'hou');
    shell.setDisplaySize(player.displayWidth, player.displayHeight).setAngle(player.angle).setAlpha(0.3).setTint(0xeeeeee).setDepth(3);

    // 蜕壳闪烁动画
    scene.tweens.add({
        targets: player, alpha: 0.2, duration: 100, yoyo: true, repeat: 8,
        onComplete: () => {
            player.setDisplaySize(player.displayWidth * moltGrowth, player.displayHeight * moltGrowth);
            player.alpha = 1;
            moltMsg.destroy(); // 进化完才消失提示

            if (moltCount < 3) {
                moltText.setText('蜕壳进度: ' + moltCount + '/3 次');
                refreshShrimps(scene);
                gameStarted = true;
            } else {
                showWinScene(scene);
            }
        }
    });
}


function refreshShrimps(scene) {
    shrimps.clear(true, true);
    // 留出 100 像素的边距，防止虾刷在屏幕边缘看不见
    const padding = 100; 
    const safeW = window.innerWidth - padding;
    const safeH = window.innerHeight - padding;

    for (let i = 0; i < 3; i++) {
        // 让虾刷新在安全范围内 (从 100 到 宽度-100)
        let rx = Phaser.Math.Between(padding, safeW);
        let ry = Phaser.Math.Between(padding, safeH);
        let s = shrimps.create(rx, ry, 'shrimp');
        s.setDisplaySize(40, 40);
    }
}

function showWinScene(scene) {
    let timeElapsed = Math.floor((scene.time.now - startTime) / 1000);
    gameStarted = false;
    const sw = window.innerWidth;
    const sh = window.innerHeight;

    // 黑色半透明背景
    scene.add.rectangle(sw/2, sh/2, sw, sh, 0x000000, 0.85).setDepth(200);

    // 核心文本：确保每一个 text 后面都有 .setOrigin(0.5) 才能完美居中
    const infoText = scene.add.text(sw/2, sh/2 - 60, 
        "你太棒了！顺利完成 3 次蜕壳进化！\n\n" +
        `【 战绩统计：耗时 ${timeElapsed}秒 | 剩余血量 ${health} 】\n\n` +
        "【 鲎的终极科普 】\n" +
        "• 幼年期的鲎每蜕一次壳都会显著长大\n" +
        "• 在成年之前，它们要经历约 16 次蜕壳\n" +
        "• 鲎的蓝色血液为人类医学做出了巨大贡献\n\n" +
        "保护滩涂，就是守护这些远古的蓝血生物。", 
        { 
            fontSize: '20px', 
            fill: '#fff', 
            align: 'center', 
            lineSpacing: 10 
        }
    ).setOrigin(0.5).setDepth(201); // 这里的 setOrigin(0.5) 是居中的关键

    // 再玩一次按钮
    const restartBtn = scene.add.rectangle(sw/2, sh/2 + 180, 200, 60, 0xffffff, 1).setInteractive().setDepth(202);
    scene.add.text(sw/2, sh/2 + 180, "再玩一次", { fontSize: '24px', color: '#000' }).setOrigin(0.5).setDepth(203);
    
    restartBtn.on('pointerdown', () => window.location.reload());
}


function gameOver(scene) {
    gameStarted = false;
    const sw = window.innerWidth, sh = window.innerHeight;
    scene.add.rectangle(sw/2, sh/2, sw, sh, 0x330000, 0.8).setDepth(300);
    scene.add.text(sw/2, sh/2 - 50, "挑战失败\n\n蓝血耗尽了...\n避开海鸥，才能安全蜕壳。", { fontSize: '22px', fill: '#ffcccc', align: 'center' }).setOrigin(0.5).setDepth(301);
    const retryBtn = scene.add.rectangle(sw/2, sh/2 + 150, 200, 60, 0xff0000, 1).setInteractive().setDepth(302);
    scene.add.text(sw/2, sh/2 + 150, "重新挑战", { fontSize: '24px', color: '#fff' }).setOrigin(0.5).setDepth(303);
    retryBtn.on('pointerdown', () => window.location.reload());
}

function setupButtons(scene, screenH, screenW) {
    const bSize = 75, pad = 15;
    const cx = screenW - 200, cy = screenH - 180;
    const btns = [{x:cx, y:cy-bSize-pad, t:'↑', dx:0, dy:-moveSpeed}, {x:cx, y:cy+bSize+pad, t:'↓', dx:0, dy:moveSpeed}, {x:cx-bSize-pad, y:cy, t:'←', dx:-moveSpeed, dy:0}, {x:cx+bSize+pad, y:cy, t:'→', dx:moveSpeed, dy:0}];
    btns.forEach(b => {
        let r = scene.add.rectangle(b.x, b.y, bSize, bSize, 0x000000, 0.3).setInteractive().setDepth(20);
        scene.add.text(b.x, b.y, b.t, {fontSize:'40px', color:'#fff'}).setOrigin(0.5).setDepth(21);
        r.on('pointerdown', () => { if(gameStarted){ moveDirection.dx=b.dx; moveDirection.dy=b.dy; moveDirection.active=1; r.setFillStyle(0x000000, 0.6); }});
        r.on('pointerup', () => { moveDirection.active=0; r.setFillStyle(0x000000, 0.3); });
    });
}
