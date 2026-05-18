// =====================================================
// Phaser 游戏基础配置
// =====================================================
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


// =====================================================
// 全局变量
// =====================================================
let player, shrimps, shells, enemies, bloodEmitter, obstacles;

let score = 0;
let moltCount = 0;
let health = 3;

let scoreText, moltText, healthText, timerText;
let gameStarted = false;

let moveDirection = { dx: 0, dy: 0, active: 0 };

let startTime;
let lastEnemyTime = 0;
let isMolting = false;

// 后门：游戏开始后连续点击鲎 5 下，然后输入密码
let houClickCount = 0;
let lastHouClickTime = 0;

// 语言选择按钮容器：开始游戏后直接 destroy
let languagePanel = null;

// 方向按钮集合：胜利 / 失败后统一隐藏
let controlButtons = [];


// =====================================================
// 屏幕尺寸与自适应参数
// =====================================================
let sw = window.innerWidth;
let sh = window.innerHeight;

const aspectRatio = 85 / 60;
const moltGrowth = 1.08;

// 正常游戏目标：5 次蜕壳
const targetMoltCount = 5;

let gameScale;
let baseWidth;
let baseHeight;
let moveSpeed;
let baseGrowth;
let baseStoneSize;
let shrimpSize;
let enemySize;
let buttonSize;

recalcLayout();


// =====================================================
// 语言系统
// =====================================================
let currentLang = localStorage.getItem('hou_lang') || 'zh-CN';

const TEXT = {
    'zh-CN': {
        langSimple: '简体',
        langTrad: '繁體',
        langEng: 'Eng',

        energy: '能量(虾)',
        moltProgress: '蜕壳进度',
        health: '生命(蓝血)',
        timer: '生存时间',

        startTitle: '————【 鲎的壮丽成长史 】————',
        startLine1: '• 收集能量：吃虾成长，体型变大',
        startLine2: '• 进化蜕壳：需完成 5 次方可成年',
        startLine3: '• 躲避障碍：石头会随进化逐渐增多',
        startLine4: '• 保护蓝血：蜕壳时也很虚弱，小心海鸥！',
        startHint: '( 点击屏幕开始进化 )',

        molting: '正在蜕壳进化...',
        seagullAlert: '⚠ 海鸥来袭！',

        password: '请输入认证密码：',
        wrongPassword: '密码错误，乖乖玩吧！',

        winTitle: '你太棒了！顺利完成 5 次蜕壳进化！',
        stats: '战绩统计',
        timeUsed: '耗时',
        hpLeft: '剩余血量',
        bestTime: '历史最快',
        scienceTitle: '鲎的终极科普',
        fact1: '• 幼年期的鲎每蜕一次壳都会显著长大',
        fact2: '• 在成年之前，它们要经历约 16 次蜕壳',
        fact3: '• 鲎的蓝色血液为人类医学做出了巨大贡献',
        protect: '保护滩涂，就是守护这些远古的蓝血生物。',
        restart: '再玩一次',

        fail: '挑战失败',
        retry: '重新挑战',
        weakFail: '蜕壳时是很虚弱的，一定要避开海鸥！',
        birdFail: '小心海鸥！它们的俯冲可是很快的。'
    },

    'zh-TW': {
        langSimple: '简体',
        langTrad: '繁體',
        langEng: 'Eng',

        energy: '能量(蝦)',
        moltProgress: '蛻殼進度',
        health: '生命(藍血)',
        timer: '生存時間',

        startTitle: '————【 鱟的壯麗成長史 】————',
        startLine1: '• 收集能量：吃蝦成長，體型變大',
        startLine2: '• 進化蛻殼：需完成 5 次方可成年',
        startLine3: '• 躲避障礙：石頭會隨進化逐漸增多',
        startLine4: '• 保護藍血：蛻殼時也很虛弱，小心海鷗！',
        startHint: '( 點擊螢幕開始進化 )',

        molting: '正在蛻殼進化...',
        seagullAlert: '⚠ 海鷗來襲！',

        password: '請輸入認證密碼：',
        wrongPassword: '密碼錯誤，乖乖玩吧！',

        winTitle: '你太棒了！順利完成 5 次蛻殼進化！',
        stats: '戰績統計',
        timeUsed: '耗時',
        hpLeft: '剩餘血量',
        bestTime: '歷史最快',
        scienceTitle: '鱟的終極科普',
        fact1: '• 幼年期的鱟每蛻一次殼都會顯著長大',
        fact2: '• 在成年之前，牠們要經歷約 16 次蛻殼',
        fact3: '• 鱟的藍色血液為人類醫學作出了巨大貢獻',
        protect: '保護灘塗，就是守護這些遠古的藍血生物。',
        restart: '再玩一次',

        fail: '挑戰失敗',
        retry: '重新挑戰',
        weakFail: '蛻殼時是很虛弱的，一定要避開海鷗！',
        birdFail: '小心海鷗！牠們的俯衝可是很快的。'
    },

    'en': {
        langSimple: '简体',
        langTrad: '繁體',
        langEng: 'Eng',

        energy: 'Energy(Shrimp)',
        moltProgress: 'Molting Progress',
        health: 'Life(Blue Blood)',
        timer: 'Survival Time',

        startTitle: '————【 The Growth Story of Horseshoe Crabs 】————',
        startLine1: '• Collect energy: eat shrimp and grow bigger',
        startLine2: '• Molt and evolve: complete 5 molts to become adult',
        startLine3: '• Avoid obstacles: more rocks appear as you evolve',
        startLine4: '• Protect blue blood: beware of seagulls while molting!',
        startHint: '( Click the screen to start evolving )',

        molting: 'Molting and evolving...',
        seagullAlert: '⚠ Seagulls Incoming!',

        password: 'Enter password:',
        wrongPassword: 'Wrong password. Play properly!',

        winTitle: 'Amazing! You completed 5 molts!',
        stats: 'Battle Stats',
        timeUsed: 'Time',
        hpLeft: 'HP Left',
        bestTime: 'Best Time',
        scienceTitle: 'Horseshoe Crab Facts',
        fact1: '• Young horseshoe crabs grow larger after each molt',
        fact2: '• Before adulthood, they molt about 16 times',
        fact3: '• Their blue blood has greatly helped medical science',
        protect: 'Protecting mudflats means protecting these ancient blue-blooded creatures.',
        restart: 'Play Again',

        fail: 'Challenge Failed',
        retry: 'Retry',
        weakFail: 'Molting makes you vulnerable. Stay away from seagulls!',
        birdFail: 'Watch out for seagulls! Their dives are fast.'
    }
};

function T(key) {
    return TEXT[currentLang][key] || TEXT['zh-CN'][key] || key;
}


// =====================================================
// 自适应布局计算
// =====================================================
function recalcLayout() {
    sw = window.innerWidth;
    sh = window.innerHeight;

    const shortSide = Math.min(sw, sh);

    gameScale = Phaser.Math.Clamp(shortSide / 800, 0.65, 1.25);

    baseWidth = Phaser.Math.Clamp(shortSide / 15, 42, 90);
    baseHeight = baseWidth * aspectRatio;

    // 玩家移动速度
    // 原本是 260 * gameScale
    // 现在降低约 30%，让游戏时间稍微拉长
    moveSpeed = 182 * gameScale;

    baseGrowth = 1.2 * gameScale;

    baseStoneSize = Phaser.Math.Clamp(shortSide * 0.11, 70, 120);
    shrimpSize = Phaser.Math.Clamp(shortSide * 0.055, 38, 60);
    enemySize = Phaser.Math.Clamp(shortSide * 0.14, 95, 150);
    buttonSize = Phaser.Math.Clamp(shortSide * 0.08, 56, 74);
}


// =====================================================
// 统一文字样式
// padding 解决字体顶部被裁切的问题
// =====================================================
function makeTextStyle(size, color = '#000', extra = {}) {
    return {
        fontFamily: 'Arial, "Microsoft YaHei", "PingFang TC", "Noto Sans", sans-serif',
        fontSize: Math.round(size * gameScale) + 'px',
        fill: color,
        padding: {
            top: Math.round(10 * gameScale),
            bottom: Math.round(7 * gameScale),
            left: Math.round(7 * gameScale),
            right: Math.round(7 * gameScale)
        },
        ...extra
    };
}


// =====================================================
// 资源加载
// =====================================================
function preload() {
    this.load.image('hou', 'hou.png');
    this.load.image('shrimp', 'shrimp.png');
    this.load.image('bg', 'bg.jpg');
    this.load.image('enemy', 'enemy.png');
    this.load.image('stone', 'stone.png');
}


// =====================================================
// 游戏创建
// =====================================================
function create() {
    const sw = window.innerWidth;
    const sh = window.innerHeight;

    // 背景
    this.add.image(sw / 2, sh / 2, 'bg')
        .setDisplaySize(sw, sh)
        .setDepth(0);

    // 生成蓝血粒子贴图
    const g = this.add.graphics();
    g.fillStyle(0x0000ff, 1);
    g.fillCircle(4, 4, 4);
    g.generateTexture('blue_dot', 8, 8);
    g.destroy();

    shells = this.add.group();
    enemies = this.physics.add.group();

    // 玩家
    player = this.physics.add.sprite(sw / 2, sh / 2, 'hou')
        .setDepth(5)
        .setDisplaySize(baseWidth, baseHeight);

    // =================================================
    // 后门：连续点鲎 5 下，输入 104 或 319
    // =================================================
    player.setInteractive();

    player.on('pointerdown', () => {
        if (!gameStarted) return;

        const now = this.time.now;

        if (now - lastHouClickTime > 1500) {
            houClickCount = 0;
        }

        lastHouClickTime = now;
        houClickCount++;

        if (houClickCount >= 5) {
            houClickCount = 0;

            const code = prompt(T('password'));

            if (code === '104' || code === '319') {
                startTime = this.time.now - Phaser.Math.Between(41, 49) * 1000;
                gameStarted = false;
                isMolting = false;
                moltCount = targetMoltCount;

                if (enemies) enemies.clear(true, true);

                destroyLanguagePanel();
                showWinScene(this);
            } else if (code !== null) {
                alert(T('wrongPassword'));
            }
        }
    });

    player.setCollideWorldBounds(true);
    player.body.enable = false;
    updatePlayerBodySize();

    // 石头障碍
    obstacles = this.physics.add.staticGroup();

    for (let i = 0; i < 3; i++) {
        spawnStaticStone(obstacles, sw, sh, player);
    }

    this.physics.add.collider(player, obstacles);

    // 蓝血粒子效果
    bloodEmitter = this.add.particles(0, 0, 'blue_dot', {
        speed: { min: -100, max: 100 },
        scale: { start: 1, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 600,
        tint: 0x0000ff,
        emitting: false
    }).setDepth(6);

    // 虾
    shrimps = this.physics.add.group();
    refreshShrimps(this);

    // 海鸥碰撞
    this.physics.add.overlap(player, enemies, (p, e) => {
        if (e.alpha < 0.8) return;
        e.destroy();
        handleDamage(this);
    }, null, this);

    // =================================================
    // 左上角状态栏
    // 你要改位置就改这里的 y 值：30、80、130
    // =================================================
    scoreText = this.add.text(
        22,
        30,
        T('energy') + ': 0/3',
        makeTextStyle(22, '#333', {
            backgroundColor: 'rgba(255,255,255,0.70)'
        })
    ).setDepth(10).setVisible(false);

    moltText = this.add.text(
        22,
        80,
        T('moltProgress') + ': 0/' + targetMoltCount,
        makeTextStyle(22, '#d35400', {
            backgroundColor: 'rgba(255,255,255,0.70)'
        })
    ).setDepth(10).setVisible(false);

    healthText = this.add.text(
        22,
        130,
        T('health') + ': 3/3',
        makeTextStyle(22, '#0000ff', {
            backgroundColor: 'rgba(255,255,255,0.70)'
        })
    ).setDepth(10).setVisible(false);

    timerText = this.add.text(
        sw / 2,
        30,
        T('timer') + ': 0s',
        makeTextStyle(22, '#000', {
            fontStyle: 'bold',
            backgroundColor: 'rgba(255,255,255,0.45)'
        })
    ).setOrigin(0.5, 0).setDepth(10).setVisible(false);

    // 方向按钮
    setupButtons(this, sh, sw);

    // =================================================
    // 开场遮罩
    // =================================================
    const startOverlay = this.add.rectangle(sw / 2, sh / 2, sw, sh, 0x000000, 0.72)
        .setDepth(100)
        .setInteractive();

    const startText = this.add.text(
        sw / 2,
        sh / 2 - 45 * gameScale,
        T('startTitle') + '\n\n' +
        T('startLine1') + '\n' +
        T('startLine2') + '\n' +
        T('startLine3') + '\n' +
        T('startLine4') + '\n\n' +
        T('startHint'),
        makeTextStyle(21, '#fff', {
            align: 'left',
            lineSpacing: Math.round(10 * gameScale),
            wordWrap: { width: sw * 0.85 }
        })
    ).setOrigin(0.5).setDepth(101);

    // 开场语言按钮
    createLanguageButtons(this, sw, sh);

    // 点击开始游戏
    startOverlay.on('pointerdown', () => {
        destroyLanguagePanel();

        startTime = this.time.now;
        lastEnemyTime = this.time.now;

        startOverlay.destroy();
        startText.destroy();

        scoreText.setVisible(true);
        moltText.setVisible(true);
        healthText.setVisible(true);
        timerText.setVisible(true);

        player.body.enable = true;
        gameStarted = true;
    });

    // 窗口变化时刷新，避免 UI 错位
    window.addEventListener('resize', () => {
        location.reload();
    });
}


// =====================================================
// 开场语言选择按钮
// 重点：全部放进 languagePanel，开始游戏后一次性 destroy
// =====================================================
function createLanguageButtons(scene, sw, sh) {
    destroyLanguagePanel();

    languagePanel = scene.add.container(0, 0).setDepth(105);

    const langs = [
        { code: 'zh-CN', label: T('langSimple') },
        { code: 'zh-TW', label: T('langTrad') },
        { code: 'en', label: T('langEng') }
    ];

    const btnW = 92 * gameScale;
    const btnH = 40 * gameScale;
    const gap = 14 * gameScale;

    const totalW = btnW * 3 + gap * 2;
    const startX = sw / 2 - totalW / 2 + btnW / 2;
    const y = sh / 2 + 185 * gameScale;

    langs.forEach((lang, index) => {
        const x = startX + index * (btnW + gap);
        const selected = currentLang === lang.code;

        const rect = scene.add.rectangle(
            x,
            y,
            btnW,
            btnH,
            selected ? 0xffffff : 0x222222,
            selected ? 1 : 0.82
        ).setInteractive();

        rect.setStrokeStyle(
            2 * gameScale,
            selected ? 0xffffff : 0xcccccc,
            selected ? 0.9 : 0.45
        );

        const label = scene.add.text(
            x,
            y,
            lang.label,
            makeTextStyle(17, selected ? '#000' : '#fff', {
                fontStyle: selected ? 'bold' : 'normal'
            })
        ).setOrigin(0.5);

        languagePanel.add([rect, label]);

        rect.on('pointerover', () => {
            rect.setFillStyle(selected ? 0xffffff : 0x444444, 1);
        });

        rect.on('pointerout', () => {
            rect.setFillStyle(selected ? 0xffffff : 0x222222, selected ? 1 : 0.82);
        });

        rect.on('pointerdown', (pointer, localX, localY, event) => {
            // 防止点击语言按钮时触发开场遮罩的开始事件
            if (event) event.stopPropagation();

            localStorage.setItem('hou_lang', lang.code);
            location.reload();
        });
    });
}


// =====================================================
// 销毁语言按钮
// 任何时候不想显示语言按钮，就调用这个
// =====================================================
function destroyLanguagePanel() {
    if (languagePanel) {
        languagePanel.destroy(true);
        languagePanel = null;
    }
}


// =====================================================
// 每帧更新
// =====================================================
function update() {
    if (!gameStarted) return;

    const currentTime = this.time.now;
    const timeElapsed = Math.floor((currentTime - startTime) / 1000);

    timerText.setText(T('timer') + ': ' + timeElapsed + 's');

    checkShrimpCollect(this);

    const drag = 0.92;

    if (isMolting) {
        player.setVelocity(0, 0);
    } else if (moveDirection.active) {
        player.setVelocity(moveDirection.dx, moveDirection.dy);

        const angleDegs = Phaser.Math.RadToDeg(
            Math.atan2(moveDirection.dy, moveDirection.dx)
        ) + 90;

        player.rotation = Phaser.Math.Angle.RotateTo(
            player.rotation,
            Phaser.Math.DegToRad(angleDegs),
            0.15
        );
    } else {
        player.setVelocity(
            player.body.velocity.x * drag,
            player.body.velocity.y * drag
        );
    }

    if (moltCount >= 1 && currentTime - lastEnemyTime > 7000) {
        spawnEnemy(this);
        lastEnemyTime = currentTime;
    }

    enemies.getChildren().forEach(enemy => {
        if (enemy.y > window.innerHeight + 180) {
            enemy.destroy();
        }
    });
}


// =====================================================
// 更新玩家碰撞体
// =====================================================
function updatePlayerBodySize() {
    if (!player || !player.body) return;

    const bodyW = player.displayWidth * 0.68;
    const bodyH = player.displayHeight * 0.68;

    player.body.setSize(bodyW, bodyH, true);
}


// =====================================================
// 吃虾判定：距离判定，不用小碰撞体
// =====================================================
function checkShrimpCollect(scene) {
    if (!player || !shrimps || isMolting) return;

    shrimps.getChildren().forEach(shrimp => {
        if (!shrimp.active) return;

        const dist = Phaser.Math.Distance.Between(
            player.x,
            player.y,
            shrimp.x,
            shrimp.y
        );

        const eatRange =
            Math.max(player.displayWidth, player.displayHeight) * 0.45 +
            shrimp.displayWidth * 0.45;

        if (dist < eatRange) {
            collectShrimp.call(scene, player, shrimp);
        }
    });
}


// =====================================================
// 生成静态石头
// =====================================================
function spawnStaticStone(group, sw, sh, avoidTarget) {
    let rx, ry;
    let safe = false;
    let attempts = 0;

    const edgePadding = Math.max(90, 130 * gameScale);

    while (!safe && attempts < 100) {
        attempts++;

        rx = Phaser.Math.Between(edgePadding, sw - edgePadding);
        ry = Phaser.Math.Between(edgePadding, sh - edgePadding);

        const dist = Phaser.Math.Distance.Between(rx, ry, avoidTarget.x, avoidTarget.y);
        let tooClose = false;

        group.getChildren().forEach(s => {
            if (Phaser.Math.Distance.Between(rx, ry, s.x, s.y) < 120 * gameScale) {
                tooClose = true;
            }
        });

        if (dist > 220 * gameScale && !tooClose) {
            safe = true;
        }
    }

    if (safe) {
        const size = Phaser.Math.Between(baseStoneSize, baseStoneSize + 20 * gameScale);
        const s = group.create(rx, ry, 'stone');

        s.setDisplaySize(size, size);

        const radius = size * 0.35;
        s.body.setCircle(radius, size / 2 - radius, size / 2 - radius);
        s.refreshBody();
    }
}


// =====================================================
// 生成海鸥
// =====================================================
function spawnEnemy(scene) {
    const sw = window.innerWidth;

    const enemy = enemies.create(
        Phaser.Math.Between(100, sw - 100),
        -100,
        'enemy'
    );

    enemy.setDisplaySize(enemySize, enemySize)
        .setAlpha(0)
        .setDepth(4);

    const speed = 300 * gameScale + moltCount * 60 * gameScale;

    scene.tweens.add({
        targets: enemy,
        alpha: 0.5,
        y: 80,
        duration: 1500,
        onComplete: () => {
            if (enemy.active) {
                enemy.setAlpha(1);
                enemy.setVelocityY(speed);
            }
        }
    });
}


// =====================================================
// 中央警告提示
// 第一次蜕壳后提示“海鸥来袭！”
// =====================================================
function showAlertText(scene, message) {
    const sw = window.innerWidth;
    const sh = window.innerHeight;

    const alertText = scene.add.text(
        sw / 2,
        sh / 2 - 135 * gameScale,
        message,
        makeTextStyle(46, '#ff2a2a', {
            fontStyle: 'bold',
            stroke: '#ffffff',
            strokeThickness: Math.round(7 * gameScale),
            backgroundColor: 'rgba(0,0,0,0.45)',
            align: 'center'
        })
    ).setOrigin(0.5).setDepth(80).setAlpha(0);

    scene.tweens.add({
        targets: alertText,
        alpha: 1,
        scaleX: 1.18,
        scaleY: 1.18,
        duration: 260,
        yoyo: true,
        hold: 1300,
        onComplete: () => {
            alertText.destroy();
        }
    });
}


// =====================================================
// 吃到虾
// =====================================================
function collectShrimp(player, shrimp) {
    if (isMolting) return;

    shrimp.disableBody(true, true);
    score++;

    scoreText.setText(T('energy') + ': ' + score + '/3');

    this.tweens.add({
        targets: player,
        scaleX: player.scaleX * 0.8,
        scaleY: player.scaleY * 0.8,
        duration: 100,
        yoyo: true,
        onComplete: () => {
            player.setDisplaySize(
                player.displayWidth + baseGrowth,
                player.displayHeight + baseGrowth
            );

            updatePlayerBodySize();
        }
    });

    if (score === 3) {
        handleMolting(this);
    }
}


// =====================================================
// 受到海鸥伤害
// =====================================================
function handleDamage(scene) {
    if (!gameStarted) return;

    health--;

    healthText.setText(T('health') + ': ' + health + '/3');
    bloodEmitter.emitParticleAt(player.x, player.y, 15);

    scene.tweens.add({
        targets: player,
        tint: 0xff0000,
        duration: 100,
        yoyo: true,
        repeat: 3,
        onComplete: () => {
            if (player) player.clearTint();
        }
    });

    if (health <= 0) {
        gameStarted = false;
        isMolting = false;

        scene.tweens.killTweensOf(player);

        let wasMolting = false;

        scene.children.list.forEach(child => {
            if (child.text === T('molting')) {
                wasMolting = true;
                child.destroy();
            }
        });

        enemies.clear(true, true);

        gameOver(
            scene,
            wasMolting ? T('weakFail') : T('birdFail')
        );
    }
}


// =====================================================
// 蜕壳逻辑
// =====================================================
function handleMolting(scene) {
    if (health <= 0) return;

    isMolting = true;
    moveDirection.active = 0;

    player.setVelocity(0, 0);

    score = 0;
    scoreText.setText(T('energy') + ': 0/3');

    const sw = window.innerWidth;
    const sh = window.innerHeight;

    const moltMsg = scene.add.text(
        sw / 2,
        sh / 2,
        T('molting'),
        makeTextStyle(30, '#fff', {
            backgroundColor: 'rgba(0,0,0,0.55)'
        })
    ).setOrigin(0.5).setDepth(50);

    const shell = shells.create(player.x, player.y, 'hou');

    shell.setDisplaySize(player.displayWidth, player.displayHeight)
        .setAngle(player.angle)
        .setAlpha(0.3)
        .setTint(0xeeeeee)
        .setDepth(3);

    scene.tweens.add({
        targets: player,
        alpha: 0.2,
        duration: 100,
        yoyo: true,
        repeat: 8,
        onComplete: () => {
            if (health <= 0) {
                moltMsg.destroy();
                isMolting = false;
                return;
            }

            player.setDisplaySize(
                player.displayWidth * moltGrowth,
                player.displayHeight * moltGrowth
            );

            updatePlayerBodySize();

            player.alpha = 1;
            moltMsg.destroy();

            isMolting = false;
            moltCount++;

            moltText.setText(T('moltProgress') + ': ' + moltCount + '/' + targetMoltCount);

            if (moltCount < targetMoltCount) {
                spawnStaticStone(obstacles, sw, sh, player);
                refreshShrimps(scene);

                // 第一次蜕壳后，海鸥开始出现，给玩家提示
                if (moltCount === 1) {
                    showAlertText(scene, T('seagullAlert'));
                }
            } else {
                gameStarted = false;
                enemies.clear(true, true);

                scene.time.delayedCall(500, () => {
                    showWinScene(scene);
                });
            }
        }
    });
}


// =====================================================
// 刷新虾
// =====================================================
function refreshShrimps(scene) {
    shrimps.clear(true, true);

    const padding = Math.max(90, 130 * gameScale);
    const safeW = window.innerWidth - padding;
    const safeH = window.innerHeight - padding;

    for (let i = 0; i < 3; i++) {
        let rx, ry;
        let isSafe = false;
        let attempts = 0;

        while (!isSafe && attempts < 50) {
            attempts++;

            rx = Phaser.Math.Between(padding, safeW);
            ry = Phaser.Math.Between(padding, safeH);

            let tooClose = false;

            obstacles.getChildren().forEach(stone => {
                if (Phaser.Math.Distance.Between(rx, ry, stone.x, stone.y) < 110 * gameScale) {
                    tooClose = true;
                }
            });

            if (!tooClose) {
                isSafe = true;
            }
        }

        const s = shrimps.create(rx, ry, 'shrimp');

        s.setDisplaySize(shrimpSize, shrimpSize);

        const currentScale = s.scaleX;

        scene.tweens.add({
            targets: s,
            scaleX: currentScale * 1.08,
            scaleY: currentScale * 1.08,
            angle: Phaser.Math.Between(-6, 6),
            duration: 900,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }
}


// =====================================================
// 胜利界面
// =====================================================
function showWinScene(scene) {
    gameStarted = false;
    destroyLanguagePanel();
    hideControlButtons();

    const timeElapsed = Math.floor((scene.time.now - startTime) / 1000);

    let bestTime = Number(localStorage.getItem('hou_best_time')) || 999;

    if (timeElapsed < bestTime) {
        localStorage.setItem('hou_best_time', timeElapsed);
        bestTime = timeElapsed;
    }

    const sw = window.innerWidth;
    const sh = window.innerHeight;

    scene.add.rectangle(sw / 2, sh / 2, sw, sh, 0x000000, 0.86)
        .setDepth(200);

    scene.add.text(
        sw / 2,
        sh / 2 - 65 * gameScale,
        T('winTitle') + '\n\n' +
        `【 ${T('stats')}：${T('timeUsed')} ${timeElapsed}s | ${T('hpLeft')} ${health} | ${T('bestTime')} ${bestTime}s】\n\n` +
        '【 ' + T('scienceTitle') + ' 】\n' +
        T('fact1') + '\n' +
        T('fact2') + '\n' +
        T('fact3') + '\n\n' +
        T('protect'),
        makeTextStyle(19, '#fff', {
            align: 'center',
            lineSpacing: Math.round(8 * gameScale),
            wordWrap: { width: sw * 0.85 }
        })
    ).setOrigin(0.5).setDepth(201);

    const restartBtn = scene.add.rectangle(
        sw / 2,
        sh / 2 + 185 * gameScale,
        210 * gameScale,
        62 * gameScale,
        0xffffff,
        1
    ).setInteractive().setDepth(202);

    scene.add.text(
        sw / 2,
        sh / 2 + 185 * gameScale,
        T('restart'),
        makeTextStyle(23, '#000', {
            fontStyle: 'bold'
        })
    ).setOrigin(0.5).setDepth(203);

    restartBtn.on('pointerdown', () => window.location.reload());
}


// =====================================================
// 失败界面
// =====================================================
function gameOver(scene, reason) {
    gameStarted = false;
    destroyLanguagePanel();
    hideControlButtons();

    const sw = window.innerWidth;
    const sh = window.innerHeight;

    scene.add.rectangle(sw / 2, sh / 2, sw, sh, 0x330000, 0.82)
        .setDepth(300);

    scene.add.text(
        sw / 2,
        sh / 2 - 105 * gameScale,
        T('fail'),
        makeTextStyle(38, '#ff0000', {
            fontStyle: 'bold'
        })
    ).setOrigin(0.5).setDepth(301);

    scene.add.text(
        sw / 2,
        sh / 2,
        reason,
        makeTextStyle(21, '#ffcccc', {
            align: 'center',
            wordWrap: { width: sw * 0.8 }
        })
    ).setOrigin(0.5).setDepth(301);

    const retryBtn = scene.add.rectangle(
        sw / 2,
        sh / 2 + 150 * gameScale,
        210 * gameScale,
        62 * gameScale,
        0xff1f1f,
        1
    ).setInteractive().setDepth(302);

    scene.add.text(
        sw / 2,
        sh / 2 + 150 * gameScale,
        T('retry'),
        makeTextStyle(23, '#fff', {
            fontStyle: 'bold'
        })
    ).setOrigin(0.5).setDepth(303);

    retryBtn.on('pointerdown', () => window.location.reload());
}


// =====================================================
// 右下角方向控制按钮
// 圆形按钮 + 图形箭头
// 不用文字箭头，所以更整齐、更粗壮、更像游戏 UI
// =====================================================
function setupButtons(scene, screenH, screenW) {
    controlButtons = [];

    const bSize = buttonSize;
    const radius = bSize / 2;

    // 按钮之间的间距
    const gap = bSize * 0.25;

    // 控制区中心位置
    // 想整体往左：把 2.35 改大一点，比如 2.55
    // 想整体往上：把 2.25 改大一点，比如 2.45
    const cx = screenW - bSize * 2.45;
    const cy = screenH - bSize * 2.35;

    const btns = [
        { x: cx, y: cy - bSize - gap, dir: 'up', dx: 0, dy: -moveSpeed },
        { x: cx, y: cy + bSize + gap, dir: 'down', dx: 0, dy: moveSpeed },
        { x: cx - bSize - gap, y: cy, dir: 'left', dx: -moveSpeed, dy: 0 },
        { x: cx + bSize + gap, y: cy, dir: 'right', dx: moveSpeed, dy: 0 }
    ];

    btns.forEach(b => {
        // 按钮底部圆形
        const circle = scene.add.circle(
            b.x,
            b.y,
            radius,
            0x000000,
            0.28
        ).setInteractive().setDepth(20);

        // 白色外圈
        const border = scene.add.circle(
            b.x,
            b.y,
            radius,
            0xffffff,
            0
        ).setStrokeStyle(
            2.5 * gameScale,
            0xffffff,
            0.6
        ).setDepth(21);

        // 画粗壮箭头，不用文字
        const arrow = scene.add.graphics().setDepth(22);
        drawArrow(arrow, b.x, b.y, b.dir, bSize, 0xffffff, 0.92);

        controlButtons.push(circle, border, arrow);

        const stopMove = () => {
            moveDirection.active = 0;

            circle.setFillStyle(0x000000, 0.28);
            border.setStrokeStyle(2.5 * gameScale, 0xffffff, 0.6);

            arrow.clear();
            drawArrow(arrow, b.x, b.y, b.dir, bSize, 0xffffff, 0.92);
        };

        circle.on('pointerdown', () => {
            if (gameStarted && !isMolting) {
                moveDirection.dx = b.dx;
                moveDirection.dy = b.dy;
                moveDirection.active = 1;

                // 按下反馈：按钮更亮，箭头稍微变大
                circle.setFillStyle(0x000000, 0.52);
                border.setStrokeStyle(3.5 * gameScale, 0xffffff, 0.95);

                arrow.clear();
                drawArrow(arrow, b.x, b.y, b.dir, bSize * 1.08, 0xffffff, 1);
            }
        });

        circle.on('pointerup', stopMove);
        circle.on('pointerout', stopMove);
    });

    // 防止鼠标 / 手指离开按钮后移动卡住
    scene.input.on('pointerup', () => {
        moveDirection.active = 0;
    });
}

// =====================================================
// 绘制方向箭头
// 用三角形画箭头，比文字箭头更整齐
// =====================================================
function drawArrow(graphics, x, y, dir, size, color, alpha) {
    const arrowW = size * 0.34;
    const arrowH = size * 0.38;

    graphics.fillStyle(color, alpha);

    let points;

    if (dir === 'up') {
        points = [
            new Phaser.Geom.Point(x, y - arrowH / 2),
            new Phaser.Geom.Point(x - arrowW / 2, y + arrowH / 2),
            new Phaser.Geom.Point(x + arrowW / 2, y + arrowH / 2)
        ];
    }

    if (dir === 'down') {
        points = [
            new Phaser.Geom.Point(x, y + arrowH / 2),
            new Phaser.Geom.Point(x - arrowW / 2, y - arrowH / 2),
            new Phaser.Geom.Point(x + arrowW / 2, y - arrowH / 2)
        ];
    }

    if (dir === 'left') {
        points = [
            new Phaser.Geom.Point(x - arrowH / 2, y),
            new Phaser.Geom.Point(x + arrowH / 2, y - arrowW / 2),
            new Phaser.Geom.Point(x + arrowH / 2, y + arrowW / 2)
        ];
    }

    if (dir === 'right') {
        points = [
            new Phaser.Geom.Point(x + arrowH / 2, y),
            new Phaser.Geom.Point(x - arrowH / 2, y - arrowW / 2),
            new Phaser.Geom.Point(x - arrowH / 2, y + arrowW / 2)
        ];
    }

    graphics.fillPoints(points, true);
}

// =====================================================
// 隐藏方向按钮
// 胜利 / 失败界面调用
// =====================================================
function hideControlButtons() {
    controlButtons.forEach(item => {
        if (item && item.setVisible) {
            item.setVisible(false);
        }
    });
}